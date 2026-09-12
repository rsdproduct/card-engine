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
import { averageCtr, getCtr, rankCards } from "@/lib/ranking";
import type {
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

const STORAGE_KEY = "bold-daily-feed-engine-v1";

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
  return cards.map((card, index) => ({
    cardId: card.id,
    impressions: 8 + ((index * 3) % 7),
    clicks: 2 + ((index * 2) % 5),
  }));
}

interface FeedEngineContextValue {
  hydrated: boolean;
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
  authoringOpen: boolean;
  telemetryOpen: boolean;
  activeQuickStitchCardId: string | null;
  setPortal: (portal: PortalId) => void;
  setLifecycle: (lifecycle: LifecycleState) => void;
  setEntryModifier: (modifier: EntryModifier) => void;
  setPruningEnabled: (enabled: boolean) => void;
  setAuthoringOpen: (open: boolean) => void;
  setTelemetryOpen: (open: boolean) => void;
  selectOption: (cardId: string, optionValue: string, iclKey: IclAttributeKey) => void;
  openQuickStitch: (cardId: string) => void;
  closeQuickStitch: () => void;
  applyQuickStitch: (cardId: string) => void;
  toggleMarketplace: (key: keyof MarketplaceState, cardId: string) => void;
  boostVisibility: (cardId: string) => void;
  publishCard: (input: {
    template: CardTemplate;
    headline: string;
    subtitle?: string;
    options?: string[];
    iclKey?: IclAttributeKey;
  }) => void;
  recordImpression: (cardId: string) => void;
  clearToast: () => void;
  resetEngine: () => void;
  runPrunePass: () => void;
}

const FeedEngineContext = createContext<FeedEngineContextValue | null>(null);

export function FeedEngineProvider({ children }: { children: ReactNode }) {
  const [hydrated, setHydrated] = useState(false);
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
  const [authoringOpen, setAuthoringOpen] = useState(false);
  const [telemetryOpen, setTelemetryOpen] = useState(false);
  const [activeQuickStitchCardId, setActiveQuickStitchCardId] = useState<
    string | null
  >(null);
  const [impressed, setImpressed] = useState<Set<string>>(new Set());

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as Partial<{
          portal: PortalId;
          lifecycle: LifecycleState;
          entryModifier: EntryModifier;
          icl: IclAttributes;
          cards: FeedCard[];
          marketplace: MarketplaceState;
          pruningEnabled: boolean;
          telemetry: TelemetryEvent[];
          ctrStats: CardCtrStats[];
        }>;
        if (parsed.portal) setPortalState(parsed.portal);
        if (parsed.lifecycle) setLifecycleState(parsed.lifecycle);
        if (parsed.entryModifier) setEntryModifierState(parsed.entryModifier);
        if (parsed.icl) setIcl({ ...defaultIcl, ...parsed.icl });
        if (parsed.cards?.length) setCards(parsed.cards);
        if (parsed.marketplace)
          setMarketplace({ ...defaultMarketplace, ...parsed.marketplace });
        if (typeof parsed.pruningEnabled === "boolean") {
          setPruningEnabledState(parsed.pruningEnabled);
        }
        if (parsed.telemetry) setTelemetry(parsed.telemetry.slice(0, 80));
        if (parsed.ctrStats?.length) setCtrStats(parsed.ctrStats);
      }
    } catch {
      // ignore corrupt storage
    }
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    const payload = {
      portal,
      lifecycle,
      entryModifier,
      icl,
      cards,
      marketplace,
      pruningEnabled,
      telemetry: telemetry.slice(0, 80),
      ctrStats,
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
  }, [
    hydrated,
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

  const bumpClick = useCallback((cardId: string) => {
    setCtrStats((prev) => {
      const existing = getCtr(prev, cardId);
      const next = prev.filter((s) => s.cardId !== cardId);
      return [
        ...next,
        {
          ...existing,
          clicks: existing.clicks + 1,
          impressions: Math.max(existing.impressions, 1),
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
          return [
            ...stats.filter((s) => s.cardId !== cardId),
            { ...existing, impressions: existing.impressions + 1 },
          ];
        });
        pushTelemetry("card_impression", `Impression · ${cardId}`, cardId);
        return next;
      });
    },
    [pushTelemetry],
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
      setIcl((prev) => ({ ...prev, [iclKey]: optionValue }));
      bumpClick(cardId);
      pushTelemetry(
        "icl_attribute_updated",
        `ICL ${iclKey} → ${optionValue}`,
        cardId,
        { iclKey, value: optionValue },
      );
      pushTelemetry("card_click", `Option selected on ${cardId}`, cardId);
      showToast(`Updated ${iclKey.replaceAll("_", " ")}: ${optionValue}`);
    },
    [bumpClick, pushTelemetry, showToast],
  );

  const openQuickStitch = useCallback(
    (cardId: string) => {
      setActiveQuickStitchCardId(cardId);
      bumpClick(cardId);
      pushTelemetry("card_click", `Opened Quick-Stitch · ${cardId}`, cardId);
    },
    [bumpClick, pushTelemetry],
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

  const publishCard = useCallback(
    (input: {
      template: CardTemplate;
      headline: string;
      subtitle?: string;
      options?: string[];
      iclKey?: IclAttributeKey;
    }) => {
      const id = uid("custom");
      let content: FeedCard["content"];
      if (input.template === "A") {
        content = {
          options: (input.options ?? ["Option 1", "Option 2"]).map((label, i) => ({
            id: `${id}-opt-${i}`,
            label,
            value: label,
          })),
          iclKey: input.iclKey ?? "target_role",
        };
      } else if (input.template === "B") {
        content = {
          matchScore: 88,
          matchLabel: "Custom match opportunity",
          missingKeywords: ["Leadership", "SQL"],
          ctaLabel: "Tailor Resume in 10s",
          modalTitle: "Quick-Stitch Preview",
          modalPreview: [
            "Inject custom keywords into Skills",
            "Refresh summary for ATS parsers",
          ],
        };
      } else if (input.template === "C") {
        content = {
          statLabel: "marketplace signals this week",
          statValue: 12,
          toggleLabel: "Signal Open to Inquiries",
          toggleKey: "open_to_inquiries",
          detail: "Custom recruiter ping",
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

      const card: FeedCard = {
        id,
        template: input.template,
        headline: input.headline,
        subtitle: input.subtitle,
        priority: 95,
        custom: true,
        content,
      };

      setCards((prev) => [card, ...prev]);
      setCtrStats((prev) => [
        { cardId: id, impressions: 0, clicks: 0 },
        ...prev,
      ]);
      pushTelemetry("card_published", `Published card · ${input.headline}`, id);
      showToast("Card published to live registry");
      setAuthoringOpen(false);
    },
    [pushTelemetry, showToast],
  );

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
    showToast("Prune pass complete (<30% below avg CTR)");
  }, [ctrStats, pushTelemetry, showToast]);

  const resetEngine = useCallback(() => {
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
    setActiveQuickStitchCardId(null);
    localStorage.removeItem(STORAGE_KEY);
    showToast("Engine reset to seed state");
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
    portal,
    lifecycle,
    entryModifier,
    icl,
    cards,
    rankedCards,
    theme: portalThemes[portal],
    marketplace,
    telemetry,
    ctrStats,
    pruningEnabled,
    avgCtr: averageCtr(ctrStats),
    toast,
    authoringOpen,
    telemetryOpen,
    activeQuickStitchCardId,
    setPortal,
    setLifecycle,
    setEntryModifier,
    setPruningEnabled,
    setAuthoringOpen,
    setTelemetryOpen,
    selectOption,
    openQuickStitch,
    closeQuickStitch,
    applyQuickStitch,
    toggleMarketplace,
    boostVisibility,
    publishCard,
    recordImpression,
    clearToast: () => setToast(null),
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
