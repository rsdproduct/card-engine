"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { initialCards } from "@/data/initialCards";
import { portalThemes } from "@/data/portalThemes";
import {
  clearLocalStorage,
  fetchSharedCampaigns,
  isSupabaseConfigured,
  loadFromLocalStorage,
  saveToLocalStorage,
  STORAGE_VERSION,
  syncCampaignsToSupabase,
} from "@/lib/persistence";
import { averageCtr, getCtr, rankCards } from "@/lib/ranking";
import {
  ALL_PORTAL_IDS,
  normalizePortalScope,
  resolveTargetPortalIds,
} from "@/lib/portalScope";
import type {
  AppMode,
  AudienceTargeting,
  CardCtrStats,
  CardTemplate,
  EntryModifier,
  FeedCard,
  IclAttributeKey,
  IclAttributes,
  LifecycleState,
  MarketplaceState,
  PortalId,
  PortalTheme,
  TelemetryEvent,
  ToastMessage,
} from "@/types/cardEngine";

const defaultIcl: IclAttributes = {
  target_role: null,
  salary_band: null,
  work_pref: null,
  urgency_tier: null,
  skills_focus: null,
};

const defaultMarketplace: MarketplaceState = {
  open_to_inquiries: false,
  vanity_claimed: false,
};

function uid(prefix: string) {
  return `${prefix}-${Math.random().toString(36).slice(2, 9)}-${Date.now().toString(36)}`;
}

function seedCtr(cards: FeedCard[]): CardCtrStats[] {
  return cards.map((card, index) => {
    const impressions = 10 + ((index * 3) % 9);
    const clicks = 2 + ((index * 2) % 6);
    const aImp = Math.floor(impressions * 0.55);
    const bImp = impressions - aImp;
    const aClk = Math.floor(clicks * (index % 3 === 0 ? 0.75 : 0.5));
    const bClk = clicks - aClk;
    return {
      cardId: card.id,
      impressions,
      clicks,
      variantAImpressions: aImp,
      variantAClicks: aClk,
      variantBImpressions: bImp,
      variantBClicks: bClk,
    };
  });
}

export interface PublishCampaignInput {
  campaignName: string;
  headlineA: string;
  headlineB: string;
  bodyCopy: string;
  headerImage: string;
  template: CardTemplate;
  targeting: AudienceTargeting;
  options?: string[];
  optionsStep2?: string[];
  step2Prompt?: string;
  iclKey?: IclAttributeKey;
  iclKeyStep2?: IclAttributeKey;
}

interface FeedEngineContextValue {
  hydrated: boolean;
  mode: AppMode;
  setMode: (mode: AppMode) => void;
  portal: PortalId;
  lifecycle: LifecycleState;
  entryModifier: EntryModifier;
  icl: IclAttributes;
  cards: FeedCard[];
  rankedCards: FeedCard[];
  theme: PortalTheme;
  marketplace: MarketplaceState;
  telemetry: TelemetryEvent[];
  ctrStats: CardCtrStats[];
  pruningEnabled: boolean;
  avgCtr: number;
  toast: ToastMessage | null;
  telemetryOpen: boolean;
  activeQuickStitchCardId: string | null;
  multiStepProgress: Record<string, number>;
  persistenceLabel: string;
  setPortal: (portal: PortalId) => void;
  setLifecycle: (lifecycle: LifecycleState) => void;
  setEntryModifier: (modifier: EntryModifier) => void;
  setPruningEnabled: (enabled: boolean) => void;
  setTelemetryOpen: (open: boolean) => void;
  selectOption: (cardId: string, optionValue: string, iclKey: IclAttributeKey) => void;
  answerMultiStep: (
    cardId: string,
    stepIndex: number,
    optionValue: string,
    iclKey: IclAttributeKey,
    totalSteps: number,
  ) => void;
  openQuickStitch: (cardId: string) => void;
  closeQuickStitch: () => void;
  applyQuickStitch: (cardId: string) => void;
  toggleMarketplace: (key: keyof MarketplaceState, cardId: string) => void;
  boostVisibility: (cardId: string) => void;
  publishCampaign: (input: PublishCampaignInput) => Promise<void>;
  pauseLowVariant: (cardId: string, variant: "A" | "B") => void;
  setActiveVariant: (cardId: string, variant: "A" | "B") => void;
  recordImpression: (cardId: string) => void;
  clearToast: () => void;
  showToast: (message: string) => void;
  resetEngine: () => void;
  runPrunePass: () => void;
}

const FeedEngineContext = createContext<FeedEngineContextValue | null>(null);

export function FeedEngineProvider({ children }: { children: ReactNode }) {
  const [hydrated, setHydrated] = useState(false);
  const [mode, setModeState] = useState<AppMode>("candidate");
  const [portal, setPortalState] = useState<PortalId>("mpr");
  const [lifecycle, setLifecycleState] = useState<LifecycleState>("early_1_7");
  const [entryModifier, setEntryModifierState] =
    useState<EntryModifier>("scratch_builder");
  const [icl, setIcl] = useState<IclAttributes>(defaultIcl);
  const [cards, setCards] = useState<FeedCard[]>(initialCards);
  const [marketplace, setMarketplace] =
    useState<MarketplaceState>(defaultMarketplace);
  const [pruningEnabled, setPruningEnabledState] = useState(false);
  const [telemetry, setTelemetry] = useState<TelemetryEvent[]>([]);
  const [ctrStats, setCtrStats] = useState<CardCtrStats[]>(() =>
    seedCtr(initialCards),
  );
  const [toast, setToast] = useState<ToastMessage | null>(null);
  const [telemetryOpen, setTelemetryOpen] = useState(false);
  const [activeQuickStitchCardId, setActiveQuickStitchCardId] = useState<
    string | null
  >(null);
  const [impressed, setImpressed] = useState<Set<string>>(new Set());
  const [multiStepProgress, setMultiStepProgress] = useState<
    Record<string, number>
  >({});
  const [persistenceLabel, setPersistenceLabel] = useState("LocalStorage");

  useEffect(() => {
    async function hydrate() {
      const parsed = loadFromLocalStorage();
      if (parsed) {
        if (
          parsed.mode === "candidate" ||
          parsed.mode === "studio" ||
          parsed.mode === "index"
        ) {
          setModeState(parsed.mode);
        }
        if (parsed.portal && ALL_PORTAL_IDS.includes(parsed.portal)) {
          setPortalState(parsed.portal);
        }
        if (parsed.lifecycle) setLifecycleState(parsed.lifecycle);
        if (parsed.entryModifier) setEntryModifierState(parsed.entryModifier);
        if (parsed.icl) setIcl({ ...defaultIcl, ...parsed.icl });
        if (parsed.cards?.length) {
          const cleaned = parsed.cards.filter(
            (c) => c.id !== "phoenix-ats" && !c.headline?.includes("ATS Health"),
          );
          // v3: refresh seed cards with portalScope / Zety; keep custom campaigns
          if ((parsed.version ?? 0) < 3) {
            const custom = cleaned.filter((c) => c.custom || c.campaignId);
            const customIds = new Set(custom.map((c) => c.id));
            setCards([
              ...initialCards.filter((c) => !customIds.has(c.id)),
              ...custom.map((c) => {
                const scope = normalizePortalScope(
                  c.portalScope ??
                    c.targeting?.portalScope ??
                    c.targeting?.portals,
                );
                return {
                  ...c,
                  portalScope: scope,
                  targeting: c.targeting
                    ? { ...c.targeting, portalScope: scope }
                    : { portalScope: scope, lifecycles: [], searchIntents: [], experienceTiers: [] },
                };
              }),
            ]);
          } else {
            setCards(cleaned);
          }
        }
        if (parsed.marketplace)
          setMarketplace({ ...defaultMarketplace, ...parsed.marketplace });
        if (typeof parsed.pruningEnabled === "boolean") {
          setPruningEnabledState(parsed.pruningEnabled);
        }
        if (parsed.telemetry) setTelemetry(parsed.telemetry.slice(0, 80));
        if (parsed.ctrStats?.length) setCtrStats(parsed.ctrStats);
      }

      const shared = await fetchSharedCampaigns();
      if (shared.length) {
        setCards((prev) => {
          const ids = new Set(prev.map((c) => c.id));
          const merged = [...prev];
          for (const card of shared) {
            if (!ids.has(card.id)) merged.unshift(card);
          }
          return merged;
        });
        setPersistenceLabel(
          isSupabaseConfigured() ? "Supabase + LocalStorage" : "API + LocalStorage",
        );
      } else {
        setPersistenceLabel(
          isSupabaseConfigured() ? "Supabase ready · LocalStorage" : "LocalStorage",
        );
      }
      setHydrated(true);
    }
    void hydrate();
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    saveToLocalStorage({
      version: STORAGE_VERSION,
      mode,
      portal,
      lifecycle,
      entryModifier,
      icl,
      cards,
      marketplace,
      pruningEnabled,
      telemetry: telemetry.slice(0, 80),
      ctrStats,
    });
  }, [
    hydrated,
    mode,
    portal,
    lifecycle,
    entryModifier,
    icl,
    cards,
    marketplace,
    pruningEnabled,
    telemetry,
    ctrStats,
  ]);

  const pushTelemetry = useCallback(
    (
      type: TelemetryEvent["type"],
      message: string,
      cardId?: string,
      meta?: TelemetryEvent["meta"],
    ) => {
      setTelemetry((prev) =>
        [
          {
            id: uid("evt"),
            type,
            cardId,
            message,
            timestamp: Date.now(),
            meta,
          },
          ...prev,
        ].slice(0, 100),
      );
    },
    [],
  );

  const showToast = useCallback((message: string) => {
    setToast({ id: uid("toast"), message });
  }, []);

  const bumpClick = useCallback((cardId: string, variant?: "A" | "B") => {
    setCtrStats((prev) => {
      const existing = getCtr(prev, cardId);
      const next = prev.filter((s) => s.cardId !== cardId);
      const v = variant ?? "A";
      return [
        ...next,
        {
          ...existing,
          clicks: existing.clicks + 1,
          impressions: Math.max(existing.impressions, 1),
          ...(v === "A"
            ? {
                variantAClicks: (existing.variantAClicks ?? 0) + 1,
                variantAImpressions: Math.max(
                  existing.variantAImpressions ?? 0,
                  1,
                ),
              }
            : {
                variantBClicks: (existing.variantBClicks ?? 0) + 1,
                variantBImpressions: Math.max(
                  existing.variantBImpressions ?? 0,
                  1,
                ),
              }),
        },
      ];
    });
  }, []);

  const recordImpression = useCallback(
    (cardId: string) => {
      setImpressed((prev) => {
        if (prev.has(cardId)) return prev;
        const next = new Set(prev);
        next.add(cardId);
        setCtrStats((stats) => {
          const existing = getCtr(stats, cardId);
          const card = cards.find((c) => c.id === cardId);
          const variant = card?.activeVariant ?? "A";
          return [
            ...stats.filter((s) => s.cardId !== cardId),
            {
              ...existing,
              impressions: existing.impressions + 1,
              ...(variant === "A"
                ? {
                    variantAImpressions:
                      (existing.variantAImpressions ?? 0) + 1,
                  }
                : {
                    variantBImpressions:
                      (existing.variantBImpressions ?? 0) + 1,
                  }),
            },
          ];
        });
        pushTelemetry("card_impression", `Impression · ${cardId}`, cardId);
        return next;
      });
    },
    [cards, pushTelemetry],
  );

  const setMode = useCallback(
    (next: AppMode) => {
      setModeState(next);
      showToast(
        next === "studio"
          ? "PM Authoring Studio"
          : next === "index"
            ? "Card Index"
            : "Candidate Feed View",
      );
    },
    [showToast],
  );

  const setPortal = useCallback(
    (next: PortalId) => {
      setPortalState(next);
      pushTelemetry("card_click", `Portal switched to ${portalThemes[next].name}`);
      showToast(`Portal: ${portalThemes[next].name}`);
    },
    [pushTelemetry, showToast],
  );

  const setLifecycle = useCallback(
    (next: LifecycleState) => {
      setLifecycleState(next);
      pushTelemetry("card_click", `Lifecycle → ${next}`);
    },
    [pushTelemetry],
  );

  const setEntryModifier = useCallback(
    (next: EntryModifier) => {
      setEntryModifierState(next);
      pushTelemetry("card_click", `Entry modifier → ${next}`);
    },
    [pushTelemetry],
  );

  const setPruningEnabled = useCallback(
    (enabled: boolean) => {
      setPruningEnabledState(enabled);
      pushTelemetry(
        "card_pruned",
        enabled ? "Dynamic pruning enabled" : "Dynamic pruning disabled",
      );
    },
    [pushTelemetry],
  );

  const selectOption = useCallback(
    (cardId: string, optionValue: string, iclKey: IclAttributeKey) => {
      const card = cards.find((c) => c.id === cardId);
      setIcl((prev) => ({ ...prev, [iclKey]: optionValue }));
      bumpClick(cardId, card?.activeVariant ?? "A");
      pushTelemetry(
        "icl_attribute_updated",
        `ICL ${iclKey} → ${optionValue}`,
        cardId,
        { iclKey, value: optionValue },
      );
      pushTelemetry("card_click", `Option selected on ${cardId}`, cardId);
      showToast(`Updated ${iclKey.replaceAll("_", " ")}: ${optionValue}`);
    },
    [bumpClick, cards, pushTelemetry, showToast],
  );

  const answerMultiStep = useCallback(
    (
      cardId: string,
      stepIndex: number,
      optionValue: string,
      iclKey: IclAttributeKey,
      totalSteps: number,
    ) => {
      const card = cards.find((c) => c.id === cardId);
      setIcl((prev) => ({ ...prev, [iclKey]: optionValue }));
      bumpClick(cardId, card?.activeVariant ?? "A");
      pushTelemetry(
        "multi_step_answer_logged",
        `Step ${stepIndex + 1}/${totalSteps}: ${iclKey} → ${optionValue}`,
        cardId,
        { stepIndex, iclKey, value: optionValue },
      );
      pushTelemetry(
        "icl_attribute_updated",
        `ICL ${iclKey} → ${optionValue}`,
        cardId,
        { iclKey, value: optionValue },
      );
      const nextStep = stepIndex + 1;
      if (nextStep < totalSteps) {
        setMultiStepProgress((prev) => ({ ...prev, [cardId]: nextStep }));
        showToast(`Step ${nextStep + 1} of ${totalSteps}`);
      } else {
        setMultiStepProgress((prev) => ({ ...prev, [cardId]: totalSteps }));
        showToast("Micro-profile complete — feed re-ranked");
      }
    },
    [bumpClick, cards, pushTelemetry, showToast],
  );

  const openQuickStitch = useCallback(
    (cardId: string) => {
      const card = cards.find((c) => c.id === cardId);
      setActiveQuickStitchCardId(cardId);
      bumpClick(cardId, card?.activeVariant ?? "A");
      pushTelemetry("card_click", `Opened Quick-Stitch · ${cardId}`, cardId);
    },
    [bumpClick, cards, pushTelemetry],
  );

  const closeQuickStitch = useCallback(() => {
    setActiveQuickStitchCardId(null);
  }, []);

  const applyQuickStitch = useCallback(
    (cardId: string) => {
      bumpClick(cardId);
      pushTelemetry(
        "quick_stitch_applied",
        `Keywords applied & download queued · ${cardId}`,
        cardId,
      );
      showToast("Keywords applied — resume ready to download");
      setActiveQuickStitchCardId(null);
    },
    [bumpClick, pushTelemetry, showToast],
  );

  const toggleMarketplace = useCallback(
    (key: keyof MarketplaceState, cardId: string) => {
      setMarketplace((prev) => {
        const next = { ...prev, [key]: !prev[key] };
        bumpClick(cardId);
        pushTelemetry(
          "employer_intent_signal",
          `${key} → ${next[key] ? "on" : "off"}`,
          cardId,
          { [key]: next[key] },
        );
        showToast(
          next[key]
            ? key === "vanity_claimed"
              ? "Vanity URL claimed"
              : "Open to inquiries — MCB signal sent"
            : key === "vanity_claimed"
              ? "Vanity claim cleared"
              : "Inquiry signal turned off",
        );
        return next;
      });
    },
    [bumpClick, pushTelemetry, showToast],
  );

  const boostVisibility = useCallback(
    (cardId: string) => {
      bumpClick(cardId);
      pushTelemetry("card_click", `Boost Visibility · ${cardId}`, cardId);
      showToast("Visibility boost queued for this week");
    },
    [bumpClick, pushTelemetry, showToast],
  );

  const publishCampaign = useCallback(
    async (input: PublishCampaignInput) => {
      const campaignId = uid("campaign");
      const id = uid("card");
      let content: FeedCard["content"];

      if (input.template === "A") {
        const step1Options = (input.options ?? ["Option 1", "Option 2"]).map(
          (label, i) => ({
            id: `${id}-s1-${i}`,
            label,
            value: label,
          }),
        );
        const step2Options = (input.optionsStep2 ?? []).filter(Boolean);
        if (step2Options.length > 0) {
          content = {
            steps: [
              {
                id: `${id}-step-1`,
                prompt: input.headlineA,
                options: step1Options,
                iclKey: input.iclKey ?? "target_role",
              },
              {
                id: `${id}-step-2`,
                prompt: input.step2Prompt || "What’s next?",
                options: step2Options.map((label, i) => ({
                  id: `${id}-s2-${i}`,
                  label,
                  value: label,
                })),
                iclKey: input.iclKeyStep2 ?? "urgency_tier",
              },
            ],
          };
        } else {
          content = {
            options: step1Options,
            iclKey: input.iclKey ?? "target_role",
          };
        }
      } else if (input.template === "B") {
        content = {
          matchScore: 88,
          matchLabel: input.campaignName || "Custom match opportunity",
          missingKeywords: ["Leadership", "SQL", "Stakeholder Mgmt"],
          completenessScore: 76,
          ctaLabel: "Tailor Resume in 10s",
          modalTitle: "Quick-Stitch Preview",
          modalPreview: [
            "Inject campaign keywords into Skills",
            "Refresh summary for ATS parsers",
            "Re-score completeness after tailor",
          ],
        };
      } else if (input.template === "C") {
        content = {
          statLabel: "recruiters searched profiles like yours",
          statValue: 27,
          toggleLabel: "Signal Open to Inquiries",
          toggleKey: "open_to_inquiries",
          detail: input.bodyCopy.slice(0, 80) || "Custom recruiter alert",
        };
      } else {
        content = {
          metrics: [
            { label: "Searches", value: 9 },
            { label: "Views", value: 4 },
            { label: "Tailors", value: 2 },
          ],
          progressLabel: "Momentum",
          progressValue: 55,
          ctaLabel: "Boost Visibility",
        };
      }

      const portalBoost: FeedCard["portalBoost"] = {};
      const scope = normalizePortalScope(
        input.targeting.portalScope ?? input.targeting.portals,
      );
      const concrete = resolveTargetPortalIds(scope);
      if (!scope.includes("ALL")) {
        for (const p of concrete) {
          portalBoost[p] = 14;
        }
      }

      const lifecycleBoost: FeedCard["lifecycleBoost"] = {};
      for (const life of input.targeting.lifecycles) {
        lifecycleBoost[life] = 8;
      }

      const targeting: AudienceTargeting = {
        ...input.targeting,
        portalScope: scope,
      };

      const card: FeedCard = {
        id,
        campaignId,
        campaignName: input.campaignName,
        template: input.template,
        headline: input.headlineA,
        headlineVariantB: input.headlineB || undefined,
        activeVariant: "A",
        subtitle: input.bodyCopy.slice(0, 140) || undefined,
        bodyCopy: input.bodyCopy,
        headerImage: input.headerImage || undefined,
        brandTag: input.campaignName || "Campaign",
        timestampLabel: "Just published",
        priority: 97,
        custom: true,
        targeting,
        portalScope: scope,
        portalBoost: Object.keys(portalBoost).length ? portalBoost : undefined,
        lifecycleBoost: Object.keys(lifecycleBoost).length
          ? lifecycleBoost
          : undefined,
        content,
      };

      setCards((prev) => [card, ...prev]);
      setCtrStats((prev) => [
        {
          cardId: id,
          impressions: 0,
          clicks: 0,
          variantAImpressions: 0,
          variantAClicks: 0,
          variantBImpressions: 0,
          variantBClicks: 0,
        },
        ...prev,
      ]);
      pushTelemetry(
        "campaign_published",
        `Campaign published · ${input.campaignName}`,
        id,
        { campaignId, template: input.template },
      );
      pushTelemetry("card_published", `Card live · ${input.headlineA}`, id);

      const sync = await syncCampaignsToSupabase([card]);
      if (sync.mode === "supabase") setPersistenceLabel("Supabase + LocalStorage");
      else if (sync.mode === "api") setPersistenceLabel("API + LocalStorage");

      showToast(`Published “${input.campaignName}” — live in Candidate Feed`);
      setModeState("candidate");
    },
    [pushTelemetry, showToast],
  );

  const pauseLowVariant = useCallback(
    (cardId: string, variant: "A" | "B") => {
      setCards((prev) =>
        prev.map((c) => {
          if (c.id !== cardId) return c;
          const nextActive: "A" | "B" = variant === "A" ? "B" : "A";
          return {
            ...c,
            variantPaused: variant,
            activeVariant: nextActive,
          };
        }),
      );
      pushTelemetry(
        "variant_paused",
        `Paused Variant ${variant} on ${cardId}`,
        cardId,
        { variant },
      );
      showToast(`Paused low-performing Variant ${variant}`);
    },
    [pushTelemetry, showToast],
  );

  const setActiveVariant = useCallback((cardId: string, variant: "A" | "B") => {
    setCards((prev) =>
      prev.map((c) =>
        c.id === cardId && c.variantPaused !== variant
          ? { ...c, activeVariant: variant }
          : c,
      ),
    );
  }, []);

  const runPrunePass = useCallback(() => {
    const avg = averageCtr(ctrStats);
    const threshold = avg * 0.7;
    setCards((prev) =>
      prev.map((card) => {
        const ctr = getCtr(ctrStats, card.id);
        if (ctr.impressions < 3) return card;
        const rate = ctr.clicks / ctr.impressions;
        if (rate < threshold) {
          pushTelemetry(
            "card_pruned",
            `Pruned ${card.id} (${Math.round(rate * 100)}% < ${Math.round(threshold * 100)}% thr)`,
            card.id,
          );
          return { ...card, pruned: true };
        }
        return card;
      }),
    );
    showToast("Prune pass complete (<30% relative CTR)");
  }, [ctrStats, pushTelemetry, showToast]);

  const resetEngine = useCallback(() => {
    setModeState("candidate");
    setPortalState("mpr");
    setLifecycleState("early_1_7");
    setEntryModifierState("scratch_builder");
    setIcl(defaultIcl);
    setCards(initialCards);
    setMarketplace(defaultMarketplace);
    setPruningEnabledState(false);
    setTelemetry([]);
    setCtrStats(seedCtr(initialCards));
    setImpressed(new Set());
    setMultiStepProgress({});
    setActiveQuickStitchCardId(null);
    clearLocalStorage();
    showToast("Engine reset to V2 seed state");
  }, [showToast]);

  const rankedCards = useMemo(
    () =>
      rankCards(
        cards,
        portal,
        lifecycle,
        entryModifier,
        icl,
        pruningEnabled,
        ctrStats,
      ),
    [cards, portal, lifecycle, entryModifier, icl, pruningEnabled, ctrStats],
  );

  const value: FeedEngineContextValue = {
    hydrated,
    mode,
    setMode,
    portal,
    lifecycle,
    entryModifier,
    icl,
    cards,
    rankedCards,
    theme: portalThemes[portal] ?? portalThemes.mpr,
    marketplace,
    telemetry,
    ctrStats,
    pruningEnabled,
    avgCtr: averageCtr(ctrStats),
    toast,
    telemetryOpen,
    activeQuickStitchCardId,
    multiStepProgress,
    persistenceLabel,
    setPortal,
    setLifecycle,
    setEntryModifier,
    setPruningEnabled,
    setTelemetryOpen,
    selectOption,
    answerMultiStep,
    openQuickStitch,
    closeQuickStitch,
    applyQuickStitch,
    toggleMarketplace,
    boostVisibility,
    publishCampaign,
    pauseLowVariant,
    setActiveVariant,
    recordImpression,
    clearToast: () => setToast(null),
    showToast,
    resetEngine,
    runPrunePass,
  };

  return (
    <FeedEngineContext.Provider value={value}>
      {children}
    </FeedEngineContext.Provider>
  );
}

export function useFeedEngine() {
  const ctx = useContext(FeedEngineContext);
  if (!ctx) {
    throw new Error("useFeedEngine must be used within FeedEngineProvider");
  }
  return ctx;
}
