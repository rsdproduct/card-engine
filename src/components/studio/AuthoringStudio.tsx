"use client";

import { useMemo, useState, type FormEvent } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useFeedEngine } from "@/context/FeedEngineContext";
import { HEADER_IMAGE_PRESETS, GRADIENT_FALLBACK } from "@/data/imagePresets";
import { lifecycleLabels, portalThemes } from "@/data/portalThemes";
import {
  ALL_PORTAL_IDS,
  expandPortalScope,
  formatPortalScopeSummary,
  isPortalId,
  isPortalPreset,
  normalizePortalScope,
  PRESET_LABELS,
  PRESET_PORTALS,
} from "@/lib/portalScope";
import type {
  AudienceTargeting,
  CardTemplate,
  ExperienceTier,
  IclAttributeKey,
  LifecycleState,
  PortalId,
  PortalPreset,
  PortalScopeItem,
  SearchIntent,
} from "@/types/cardEngine";
import { cn } from "@/lib/utils";

const templateMeta: Record<
  CardTemplate,
  { title: string; blurb: string }
> = {
  A: {
    title: "Type A · Multi-Step Micro-Profiling",
    blurb: "Q1 → inline transition to Q2 in the same card",
  },
  B: {
    title: "Type B · Quick-Stitch Utility",
    blurb: "RTJ keyword tailor + modal overlay",
  },
  C: {
    title: "Type C · B2C2B Recruiter Alert",
    blurb: "Search pulse + Open-to-Inquiries toggle",
  },
  D: {
    title: "Type D · Footprint Digest",
    blurb: "Multi-stat micro dashboard",
  },
};

const QUICK_PRESETS: PortalPreset[] = [
  "ALL",
  "CAREER_DOCS",
  "JOB_PORTALS",
  "BOLD_PRO",
];

const allLifecycles = Object.keys(lifecycleLabels) as LifecycleState[];
const searchIntents: Array<{ id: SearchIntent; label: string }> = [
  { id: "actively_applying", label: "Actively Applying" },
  { id: "passively_exploring", label: "Passively Exploring" },
  { id: "employed_career_growth", label: "Employed / Career Growth" },
];
const experienceTiers: Array<{ id: ExperienceTier; label: string }> = [
  { id: "entry", label: "Entry (<2)" },
  { id: "mid", label: "Mid (2–5)" },
  { id: "senior", label: "Senior / Executive (5+)" },
];

const defaultTargeting: AudienceTargeting = {
  portalScope: ["ALL"],
  lifecycles: ["early_1_7"],
  searchIntents: ["actively_applying"],
  experienceTiers: ["mid"],
};

function PreviewCard({
  variant,
  headline,
  body,
  image,
  template,
  brand,
}: {
  variant: "A" | "B";
  headline: string;
  body: string;
  image: string;
  template: CardTemplate;
  brand: string;
}) {
  return (
    <div className="overflow-hidden rounded-2xl border border-[#D5DEE6] bg-white shadow-sm">
      <div className="flex items-center justify-between px-3 pt-3 pb-2">
        <div className="flex items-center gap-2">
          <span className="flex size-8 items-center justify-center rounded-full bg-[#0F2537] text-[10px] font-bold text-white">
            {brand.slice(0, 2).toUpperCase()}
          </span>
          <div>
            <p className="text-xs font-semibold text-[#0F2537]">{brand}</p>
            <p className="text-[10px] text-[#5A6B7A]">
              Type {template} · Variant {variant}
            </p>
          </div>
        </div>
        <span className="text-[10px] text-[#5A6B7A]">Preview</span>
      </div>
      <div
        className="h-[160px] w-full overflow-hidden"
        style={{ background: image ? undefined : GRADIENT_FALLBACK }}
      >
        {image ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={image} alt="" className="h-full w-full object-cover" />
        ) : null}
      </div>
      <div className="space-y-2 p-3">
        <h4 className="text-sm font-semibold leading-snug text-[#0F2537]">
          {headline || `Headline Variant ${variant}`}
        </h4>
        <p className="text-xs leading-relaxed text-[#5A6B7A]">
          {body || "Body copy will appear here for candidates."}
        </p>
        <div className="rounded-lg bg-[#F4F7F9] px-2 py-2 text-[10px] text-[#5A6B7A]">
          Interactive area · Template {template}
        </div>
        <div className="rounded-lg bg-[#00A88F] px-3 py-2 text-center text-xs font-semibold text-white">
          Primary CTA
        </div>
      </div>
    </div>
  );
}

export function AuthoringStudio() {
  const { publishCampaign, persistenceLabel } = useFeedEngine();
  const [campaignName, setCampaignName] = useState("");
  const [headlineA, setHeadlineA] = useState("");
  const [headlineB, setHeadlineB] = useState("");
  const [bodyCopy, setBodyCopy] = useState("");
  const [headerImage, setHeaderImage] = useState(HEADER_IMAGE_PRESETS[0].url);
  const [customUrl, setCustomUrl] = useState("");
  const [template, setTemplate] = useState<CardTemplate>("A");
  const [targeting, setTargeting] = useState<AudienceTargeting>(defaultTargeting);
  const [optionsText, setOptionsText] = useState(
    "Actively applying, Quietly exploring, Keeping options open",
  );
  const [optionsTextStep2, setOptionsTextStep2] = useState(
    "More role matches, Salary & level intel, Recruiter reach",
  );
  const [step2Prompt, setStep2Prompt] = useState("What should we optimize for next?");
  const [iclKey, setIclKey] = useState<IclAttributeKey>("urgency_tier");
  const [iclKeyStep2, setIclKeyStep2] = useState<IclAttributeKey>("target_role");
  const [error, setError] = useState<string | null>(null);
  const [publishing, setPublishing] = useState(false);

  const imageForPreview = customUrl.trim() || headerImage;
  const portalScope = normalizePortalScope(targeting.portalScope);

  function setPortalScope(next: PortalScopeItem[]) {
    const normalized = normalizePortalScope(next);
    setTargeting((prev) => ({ ...prev, portalScope: normalized }));
  }

  function applyPreset(preset: PortalPreset) {
    setPortalScope([preset]);
  }

  function togglePortalChip(id: PortalId) {
    // Expand presets/ALL into concrete IDs before toggling a single portal
    let granular: PortalId[];
    if (portalScope.includes("ALL")) {
      granular = [...ALL_PORTAL_IDS];
    } else if (portalScope.some(isPortalPreset)) {
      granular = [...expandPortalScope(portalScope)];
    } else {
      granular = portalScope.filter(isPortalId);
    }
    const has = granular.includes(id);
    const next = has ? granular.filter((p) => p !== id) : [...granular, id];
    setPortalScope(next.length === 0 ? ["ALL"] : next);
  }

  function isPresetActive(preset: PortalPreset): boolean {
    if (portalScope.length === 1 && portalScope[0] === preset) return true;
    if (preset === "ALL" && portalScope.includes("ALL")) return true;
    // Treat exact matching set of portals as that preset (without ALL)
    if (preset !== "ALL" && portalScope.every((x) => !isPortalPreset(x))) {
      const expected = PRESET_PORTALS[preset];
      return (
        expected.length === portalScope.length &&
        expected.every((id) => portalScope.includes(id))
      );
    }
    return false;
  }

  function isPortalChipActive(id: PortalId): boolean {
    if (portalScope.includes("ALL")) return true;
    if (portalScope.includes(id)) return true;
    return portalScope.some(
      (item) => isPortalPreset(item) && PRESET_PORTALS[item].includes(id),
    );
  }

  function toggleLifecycle(id: LifecycleState) {
    setTargeting((prev) => {
      const has = prev.lifecycles.includes(id);
      const next = has
        ? prev.lifecycles.filter((x) => x !== id)
        : [...prev.lifecycles, id];
      return {
        ...prev,
        lifecycles: next.length ? next : ["early_1_7"],
      };
    });
  }

  function toggleIntent(id: SearchIntent) {
    setTargeting((prev) => {
      const has = prev.searchIntents.includes(id);
      const next = has
        ? prev.searchIntents.filter((x) => x !== id)
        : [...prev.searchIntents, id];
      return {
        ...prev,
        searchIntents: next.length ? next : ["actively_applying"],
      };
    });
  }

  function toggleTier(id: ExperienceTier) {
    setTargeting((prev) => {
      const has = prev.experienceTiers.includes(id);
      const next = has
        ? prev.experienceTiers.filter((x) => x !== id)
        : [...prev.experienceTiers, id];
      return {
        ...prev,
        experienceTiers: next.length ? next : ["mid"],
      };
    });
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (!campaignName.trim()) {
      setError("Campaign name is required.");
      return;
    }
    if (!headlineA.trim()) {
      setError("Primary headline (Variant A) is required.");
      return;
    }
    setError(null);
    setPublishing(true);
    try {
      await publishCampaign({
        campaignName: campaignName.trim(),
        headlineA: headlineA.trim(),
        headlineB: headlineB.trim(),
        bodyCopy: bodyCopy.trim(),
        headerImage: imageForPreview,
        template,
        targeting: { ...targeting, portalScope },
        options:
          template === "A"
            ? optionsText
                .split(",")
                .map((s) => s.trim())
                .filter(Boolean)
            : undefined,
        optionsStep2:
          template === "A"
            ? optionsTextStep2
                .split(",")
                .map((s) => s.trim())
                .filter(Boolean)
            : undefined,
        step2Prompt: template === "A" ? step2Prompt.trim() : undefined,
        iclKey: template === "A" ? iclKey : undefined,
        iclKeyStep2: template === "A" ? iclKeyStep2 : undefined,
      });
      setCampaignName("");
      setHeadlineA("");
      setHeadlineB("");
      setBodyCopy("");
    } finally {
      setPublishing(false);
    }
  }

  const chip = (active: boolean) =>
    cn(
      "rounded-md border px-2.5 py-1.5 text-[11px] font-semibold transition",
      active
        ? "border-[#00A88F] bg-[#00A88F] text-white"
        : "border-[#D5DEE6] bg-white text-[#0F2537] hover:border-[#00A88F]/60",
    );

  const fieldClass =
    "w-full rounded-xl border border-[#D5DEE6] bg-white px-3 py-2.5 text-sm text-[#0F2537] outline-none focus:border-[#00A88F]";

  const portalSummary = useMemo(
    () => formatPortalScopeSummary(portalScope),
    [portalScope],
  );

  const targetingSummary = useMemo(() => {
    return `${portalSummary} · ${targeting.lifecycles.length} lifecycle · ${targeting.searchIntents.length} intent · ${targeting.experienceTiers.length} tier`;
  }, [portalSummary, targeting]);

  return (
    <div
      data-testid="pm-studio"
      className="min-h-[calc(100vh-4.5rem)] bg-[linear-gradient(180deg,#F4F7F9_0%,#EAF3F1_45%,#F8FAFC_100%)]"
    >
      <div className="mx-auto max-w-7xl px-4 py-6">
        <header className="mb-6">
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#00A88F]">
            PM Authoring Studio
          </p>
          <h1 className="mt-1 font-display text-3xl font-bold tracking-tight text-[#0F2537] sm:text-4xl">
            Draft, target, and publish campaigns
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-[#5A6B7A]">
            Build Variant A/B copy, pick a template, target portals and audiences,
            then publish into the live Candidate Feed. Persistence: {persistenceLabel}.
          </p>
        </header>

        <form
          onSubmit={onSubmit}
          className="grid gap-6 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)]"
        >
          <section className="space-y-5 rounded-2xl border border-[#D5DEE6] bg-white p-5 shadow-sm">
            <h2 className="text-sm font-semibold uppercase tracking-[0.12em] text-[#5A6B7A]">
              1 · Card metadata & copy
            </h2>

            <label className="block text-sm">
              <span className="mb-1.5 block font-medium text-[#0F2537]">
                Campaign Name (internal)
              </span>
              <input
                value={campaignName}
                onChange={(e) => setCampaignName(e.target.value)}
                placeholder="e.g. Urgency Calibrator — Post-Cancel"
                className={fieldClass}
              />
            </label>

            <div className="grid gap-4 sm:grid-cols-2">
              <label className="block text-sm">
                <span className="mb-1.5 block font-medium text-[#0F2537]">
                  Primary Headline · Variant A
                </span>
                <input
                  value={headlineA}
                  onChange={(e) => setHeadlineA(e.target.value)}
                  placeholder="Where’s your head at with your job search?"
                  className={fieldClass}
                />
              </label>
              <label className="block text-sm">
                <span className="mb-1.5 block font-medium text-[#0F2537]">
                  Secondary Headline · Variant B
                </span>
                <input
                  value={headlineB}
                  onChange={(e) => setHeadlineB(e.target.value)}
                  placeholder="How hot is your search right now?"
                  className={fieldClass}
                />
              </label>
            </div>

            <label className="block text-sm">
              <span className="mb-1.5 block font-medium text-[#0F2537]">
                Body Copy / Description
              </span>
              <textarea
                value={bodyCopy}
                onChange={(e) => setBodyCopy(e.target.value)}
                rows={3}
                placeholder="Two quick taps — urgency first, then preferred next step."
                className={fieldClass}
              />
            </label>

            <div>
              <p className="mb-1.5 text-sm font-medium text-[#0F2537]">
                Header Image Asset
              </p>
              <div className="mb-2 flex flex-wrap gap-2">
                {HEADER_IMAGE_PRESETS.map((preset) => {
                  const active =
                    !customUrl && headerImage === preset.url;
                  return (
                    <button
                      key={preset.id}
                      type="button"
                      onClick={() => {
                        setCustomUrl("");
                        setHeaderImage(preset.url);
                      }}
                      className={chip(active)}
                    >
                      {preset.label}
                    </button>
                  );
                })}
              </div>
              <input
                value={customUrl}
                onChange={(e) => setCustomUrl(e.target.value)}
                placeholder="Or paste an Unsplash / CDN image URL"
                className={fieldClass}
              />
            </div>

            <div>
              <h2 className="mb-3 text-sm font-semibold uppercase tracking-[0.12em] text-[#5A6B7A]">
                2 · Template type
              </h2>
              <div className="grid gap-2 sm:grid-cols-2">
                {(Object.keys(templateMeta) as CardTemplate[]).map((t) => {
                  const active = template === t;
                  return (
                    <button
                      key={t}
                      type="button"
                      onClick={() => setTemplate(t)}
                      className={cn(
                        "rounded-xl border px-3 py-3 text-left transition",
                        active
                          ? "border-[#00A88F] bg-[#EAF7F4]"
                          : "border-[#D5DEE6] bg-white hover:border-[#00A88F]/50",
                      )}
                    >
                      <p className="text-sm font-semibold text-[#0F2537]">
                        {templateMeta[t].title}
                      </p>
                      <p className="mt-1 text-xs text-[#5A6B7A]">
                        {templateMeta[t].blurb}
                      </p>
                    </button>
                  );
                })}
              </div>
            </div>

            <AnimatePresence initial={false}>
              {template === "A" ? (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="space-y-3 overflow-hidden"
                >
                  <h2 className="text-sm font-semibold uppercase tracking-[0.12em] text-[#5A6B7A]">
                    Multi-step fields
                  </h2>
                  <label className="block text-sm">
                    <span className="mb-1.5 block font-medium">
                      Q1 options (comma-separated)
                    </span>
                    <input
                      value={optionsText}
                      onChange={(e) => setOptionsText(e.target.value)}
                      className={fieldClass}
                    />
                  </label>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <label className="block text-sm">
                      <span className="mb-1.5 block font-medium">Q1 ICL key</span>
                      <select
                        value={iclKey}
                        onChange={(e) =>
                          setIclKey(e.target.value as IclAttributeKey)
                        }
                        className={fieldClass}
                      >
                        <option value="urgency_tier">urgency_tier</option>
                        <option value="target_role">target_role</option>
                        <option value="salary_band">salary_band</option>
                        <option value="work_pref">work_pref</option>
                        <option value="skills_focus">skills_focus</option>
                      </select>
                    </label>
                    <label className="block text-sm">
                      <span className="mb-1.5 block font-medium">Q2 ICL key</span>
                      <select
                        value={iclKeyStep2}
                        onChange={(e) =>
                          setIclKeyStep2(e.target.value as IclAttributeKey)
                        }
                        className={fieldClass}
                      >
                        <option value="target_role">target_role</option>
                        <option value="urgency_tier">urgency_tier</option>
                        <option value="salary_band">salary_band</option>
                        <option value="work_pref">work_pref</option>
                        <option value="skills_focus">skills_focus</option>
                      </select>
                    </label>
                  </div>
                  <label className="block text-sm">
                    <span className="mb-1.5 block font-medium">Q2 prompt</span>
                    <input
                      value={step2Prompt}
                      onChange={(e) => setStep2Prompt(e.target.value)}
                      className={fieldClass}
                    />
                  </label>
                  <label className="block text-sm">
                    <span className="mb-1.5 block font-medium">
                      Q2 options (comma-separated)
                    </span>
                    <input
                      value={optionsTextStep2}
                      onChange={(e) => setOptionsTextStep2(e.target.value)}
                      className={fieldClass}
                    />
                  </label>
                </motion.div>
              ) : null}
            </AnimatePresence>

            <div data-testid="portal-targeting">
              <h2 className="mb-3 text-sm font-semibold uppercase tracking-[0.12em] text-[#5A6B7A]">
                3 · Portal & audience targeting
              </h2>
              <p className="mb-2 text-xs text-[#5A6B7A]">{targetingSummary}</p>

              <div
                data-testid="portal-scope-summary"
                className="mb-3 inline-flex max-w-full items-center rounded-full border border-[#00A88F]/35 bg-[#EAF7F4] px-3 py-1.5 text-[11px] font-semibold text-[#0F2537]"
              >
                {portalSummary}
              </div>

              <p className="mb-1.5 text-xs font-semibold text-[#0F2537]">
                Quick-select presets
              </p>
              <div
                data-testid="portal-presets"
                className="mb-3 flex flex-wrap gap-2"
              >
                {QUICK_PRESETS.map((preset) => (
                  <button
                    key={preset}
                    type="button"
                    data-testid={`portal-preset-${preset}`}
                    className={chip(isPresetActive(preset))}
                    onClick={() => applyPreset(preset)}
                  >
                    {PRESET_LABELS[preset]}
                  </button>
                ))}
              </div>

              <p className="mb-1.5 text-xs font-semibold text-[#0F2537]">
                Granular portals
              </p>
              <div
                data-testid="portal-chips"
                className="mb-3 flex flex-wrap gap-2"
              >
                {ALL_PORTAL_IDS.map((p) => (
                  <button
                    key={p}
                    type="button"
                    data-testid={`portal-chip-${p}`}
                    className={chip(isPortalChipActive(p))}
                    onClick={() => togglePortalChip(p)}
                  >
                    {portalThemes[p].shortName}
                  </button>
                ))}
              </div>

              <p className="mb-1.5 text-xs font-semibold text-[#0F2537]">Lifecycle</p>
              <div className="mb-3 flex flex-wrap gap-2">
                {allLifecycles.map((id) => (
                  <button
                    key={id}
                    type="button"
                    className={chip(targeting.lifecycles.includes(id))}
                    onClick={() => toggleLifecycle(id)}
                  >
                    {lifecycleLabels[id]}
                  </button>
                ))}
              </div>

              <p className="mb-1.5 text-xs font-semibold text-[#0F2537]">
                Search Intent
              </p>
              <div className="mb-3 flex flex-wrap gap-2">
                {searchIntents.map((s) => (
                  <button
                    key={s.id}
                    type="button"
                    className={chip(targeting.searchIntents.includes(s.id))}
                    onClick={() => toggleIntent(s.id)}
                  >
                    {s.label}
                  </button>
                ))}
              </div>

              <p className="mb-1.5 text-xs font-semibold text-[#0F2537]">
                Experience Tier
              </p>
              <div className="flex flex-wrap gap-2">
                {experienceTiers.map((t) => (
                  <button
                    key={t.id}
                    type="button"
                    className={chip(targeting.experienceTiers.includes(t.id))}
                    onClick={() => toggleTier(t.id)}
                  >
                    {t.label}
                  </button>
                ))}
              </div>
            </div>

            {error ? (
              <p className="text-sm font-medium text-[#FF5A36]">{error}</p>
            ) : null}

            <button
              type="submit"
              disabled={publishing}
              className="w-full rounded-xl bg-[#0F2537] px-4 py-3.5 text-sm font-semibold text-white transition hover:bg-[#0F2537]/90 disabled:opacity-60"
            >
              {publishing
                ? "Publishing…"
                : "Publish Campaign to Engine"}
            </button>
            <p className="text-center text-[11px] text-[#5A6B7A]">
              Saves to {persistenceLabel} and switches to Candidate Feed View.
            </p>
          </section>

          <aside className="space-y-4">
            <div className="rounded-2xl border border-[#D5DEE6] bg-white p-4 shadow-sm">
              <h2 className="mb-1 text-sm font-semibold uppercase tracking-[0.12em] text-[#5A6B7A]">
                4 · Live side-by-side preview
              </h2>
              <p className="mb-4 text-xs text-[#5A6B7A]">
                Pixel-aligned to the uniform LinkedIn-style card container.
              </p>
              <div className="grid gap-4 sm:grid-cols-2">
                <PreviewCard
                  variant="A"
                  headline={headlineA}
                  body={bodyCopy}
                  image={imageForPreview}
                  template={template}
                  brand={campaignName || "Campaign"}
                />
                <PreviewCard
                  variant="B"
                  headline={headlineB || headlineA}
                  body={bodyCopy}
                  image={imageForPreview}
                  template={template}
                  brand={campaignName || "Campaign"}
                />
              </div>
            </div>
          </aside>
        </form>
      </div>
    </div>
  );
}
