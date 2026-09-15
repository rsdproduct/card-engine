import type { LucideIcon } from "lucide-react";
import {
  Gauge,
  Layers3,
  LayoutGrid,
  Scissors,
  Sparkles,
  Wrench,
} from "lucide-react";
import type { AppMode } from "@/types/cardEngine";

export type ExplainerStepId =
  | "god-mode"
  | "icl-badges"
  | "uniform-cards"
  | "pm-studio"
  | "telemetry"
  | "pruning";

export type ExplainerStep = {
  id: ExplainerStepId;
  title: string;
  summary: string;
  body: string;
  bullets: string[];
  targetTestId: string;
  mode: AppMode;
  openTelemetry?: boolean;
  icon: LucideIcon;
  glossaryLabel: string;
  mobilePreview: string;
};

export const EXPLAINER_STORAGE_KEY = "card-engine-wtf-explainer-seen";

export const explainerSteps: ExplainerStep[] = [
  {
    id: "god-mode",
    title: "God Mode Multi-Tenant Controller",
    summary: "One engine, four white-label portals.",
    body: "Switch portal brand, lifecycle stage, and entry path instantly. The same card registry re-ranks for MPR, RNA, Bold.pro, and Monster — without rebuilding the feed.",
    bullets: [
      "4 portals × 4 lifecycle stages (pre-conversion → post-cancellation)",
      "Entry modifiers: uploader vs scratch builder",
      "White-label theming updates accents, headers, and ranking weights live",
    ],
    targetTestId: "god-mode-toolbar",
    mode: "candidate",
    icon: Gauge,
    glossaryLabel: "God Mode controller",
    mobilePreview: "Portal · Lifecycle · Entry switchers",
  },
  {
    id: "icl-badges",
    title: "ICL Badges",
    summary: "Live inferred context that rewrites the feed.",
    body: "The Inferred Context Layer (ICL) tracks what candidates reveal through micro-actions. Tap a pill on a card and these badges update — then ranking follows.",
    bullets: [
      "target_role · salary_band · work_pref · urgency_tier",
      "Micro-actions on Type A cards write attributes in real time",
      "Badge animations confirm the signal landed before the feed reorders",
    ],
    targetTestId: "icl-badges",
    mode: "candidate",
    icon: Sparkles,
    glossaryLabel: "ICL live attributes",
    mobilePreview: "Live attribute chips in the toolbar",
  },
  {
    id: "uniform-cards",
    title: "Uniform Card Containers A–D",
    summary: "LinkedIn / Instagram-style shells, four interaction schemas.",
    body: "Every campaign shares one container (brand header, media, body, CTA). Only the interactive middle changes by template type — so PMs can author without custom layout work.",
    bullets: [
      "Type A — Multi-step micro-profiling (Q1 → Q2 inline)",
      "Type B — Quick-Stitch utility (10s keyword tailor modal)",
      "Type C — B2C2B recruiter alert + Open-to-Inquiries toggle",
      "Type D — Footprint digest micro-dashboard",
    ],
    targetTestId: "feed-card",
    mode: "candidate",
    icon: LayoutGrid,
    glossaryLabel: "Uniform cards A–D",
    mobilePreview: "Shared card shell · Type A/B/C/D",
  },
  {
    id: "pm-studio",
    title: "PM Authoring Studio",
    summary: "No-code campaigns into the live engine.",
    body: "Product managers draft headlines, pick a template, target portals and segments, preview variants, then publish. Cards land in the candidate feed immediately.",
    bullets: [
      "Headline Variant A / B for in-card A/B testing",
      "Multi-select portal targeting + category presets",
      "Lifecycle, intent, and experience segment filters",
    ],
    targetTestId: "pm-studio",
    mode: "studio",
    icon: Wrench,
    glossaryLabel: "PM Authoring Studio",
    mobilePreview: "Campaign form · portal chips · publish",
  },
  {
    id: "telemetry",
    title: "Live Telemetry",
    summary: "Proxy signals while RC1 still lags ~45 days.",
    body: "The bottom drawer streams engine events as candidates interact. Leading indicators (CTR, impressions, ICL updates) stand in for subscription outcomes that take weeks to read.",
    bullets: [
      "card_impression · card_click · icl_attribute_updated",
      "Simulated CTR bars per card for prune decisions",
      "45-day RC1 / LTV lag → optimize on proxies today",
    ],
    targetTestId: "telemetry-drawer",
    mode: "candidate",
    openTelemetry: true,
    icon: Layers3,
    glossaryLabel: "Live telemetry stream",
    mobilePreview: "Event stream · CTR bars",
  },
  {
    id: "pruning",
    title: "Dynamic Pruning",
    summary: "Pause underperformers before they burn attention.",
    body: "When a card or variant sits below 30% of category average CTR, the engine flags it. Toggle auto-prune or manually pause a low-performing A/B variant.",
    bullets: [
      "<30% relative CTR → at-risk highlight",
      "Auto-prune toggle + one-shot Run prune",
      "Pause Low-Performing Variant A or B per card",
    ],
    targetTestId: "pruning-toggle",
    mode: "candidate",
    openTelemetry: true,
    icon: Scissors,
    glossaryLabel: "Dynamic pruning",
    mobilePreview: "Auto-prune <30% CTR toggle",
  },
];
