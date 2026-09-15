export type PortalId = "mpr" | "rna" | "zeti" | "monster" | "boldpro";

/** Category presets for multi-portal targeting */
export type PortalPreset = "ALL" | "CAREER_DOCS" | "JOB_PORTALS" | "BOLD_PRO";

/** A card may target concrete portals and/or category presets */
export type PortalScopeItem = PortalId | PortalPreset;

export type LifecycleState =
  | "pre_conversion"
  | "early_1_7"
  | "long_term_8_plus"
  | "post_cancellation";

export type EntryModifier = "uploader" | "scratch_builder";

export type CardTemplate = "A" | "B" | "C" | "D";

export type AppMode = "candidate" | "studio";

export type SearchIntent =
  | "actively_applying"
  | "passively_exploring"
  | "employed_career_growth";

export type ExperienceTier = "entry" | "mid" | "senior";

export type IclAttributeKey =
  | "target_role"
  | "salary_band"
  | "work_pref"
  | "urgency_tier"
  | "skills_focus";

export type TelemetryEventType =
  | "card_impression"
  | "card_click"
  | "icl_attribute_updated"
  | "card_pruned"
  | "card_published"
  | "campaign_published"
  | "multi_step_answer_logged"
  | "employer_intent_signal"
  | "quick_stitch_applied"
  | "variant_paused";

export interface IclAttributes {
  target_role: string | null;
  salary_band: string | null;
  work_pref: string | null;
  urgency_tier: string | null;
  skills_focus: string | null;
}

export interface CardOption {
  id: string;
  label: string;
  value: string;
}

export interface MicroStep {
  id: string;
  prompt: string;
  options: CardOption[];
  iclKey: IclAttributeKey;
}

export interface CardTemplateAContent {
  /** Single-step micro-profiling (legacy / simple) */
  options?: CardOption[];
  iclKey?: IclAttributeKey;
  /** Multi-step Q1 → Q2 inline flow */
  steps?: MicroStep[];
}

export interface CardTemplateBContent {
  matchScore?: number;
  matchLabel?: string;
  missingKeywords?: string[];
  completenessScore?: number;
  ctaLabel: string;
  modalTitle: string;
  modalPreview: string[];
}

export interface CardTemplateCContent {
  statLabel: string;
  statValue: number;
  toggleLabel: string;
  toggleKey: "open_to_inquiries" | "vanity_claimed";
  detail?: string;
}

export interface CardTemplateDContent {
  metrics: Array<{ label: string; value: number | string }>;
  progressLabel: string;
  progressValue: number;
  ctaLabel: string;
}

export type CardContent =
  | CardTemplateAContent
  | CardTemplateBContent
  | CardTemplateCContent
  | CardTemplateDContent;

export interface AudienceTargeting {
  /** Multi-select portals and/or category presets (ALL, CAREER_DOCS, …) */
  portalScope: PortalScopeItem[];
  /** @deprecated Prefer portalScope; kept for LocalStorage migration */
  portals?: Array<PortalId | "all">;
  lifecycles: LifecycleState[];
  searchIntents: SearchIntent[];
  experienceTiers: ExperienceTier[];
}

export interface FeedCard {
  id: string;
  template: CardTemplate;
  campaignName?: string;
  headline: string;
  /** A/B secondary headline; shown as Variant B in studio + feed when active */
  headlineVariantB?: string;
  activeVariant?: "A" | "B";
  variantPaused?: "A" | "B" | null;
  subtitle?: string;
  bodyCopy?: string;
  headerImage?: string;
  brandTag?: string;
  timestampLabel?: string;
  priority: number;
  portalBoost?: Partial<Record<PortalId, number>>;
  entryBoost?: Partial<Record<EntryModifier, number>>;
  lifecycleBoost?: Partial<Record<LifecycleState, number>>;
  targeting?: AudienceTargeting;
  /** Direct portal/preset targeting; falls back to targeting.portalScope */
  portalScope?: PortalScopeItem[];
  content: CardContent;
  pruned?: boolean;
  custom?: boolean;
  campaignId?: string;
}

export interface CampaignDraft {
  campaignName: string;
  headlineA: string;
  headlineB: string;
  bodyCopy: string;
  headerImage: string;
  template: CardTemplate;
  targeting: AudienceTargeting;
  /** Type A options for step 1 / single step */
  optionsText: string;
  /** Type A step 2 options (multi-step) */
  optionsTextStep2: string;
  iclKey: IclAttributeKey;
  iclKeyStep2: IclAttributeKey;
  step2Prompt: string;
}

export interface TelemetryEvent {
  id: string;
  type: TelemetryEventType;
  cardId?: string;
  message: string;
  timestamp: number;
  meta?: Record<string, string | number | boolean | null>;
}

export interface CardCtrStats {
  cardId: string;
  impressions: number;
  clicks: number;
  variantAImpressions?: number;
  variantAClicks?: number;
  variantBImpressions?: number;
  variantBClicks?: number;
}

export interface MarketplaceState {
  open_to_inquiries: boolean;
  vanity_claimed: boolean;
}

export interface PortalTheme {
  id: PortalId;
  name: string;
  shortName: string;
  logoText: string;
  background: string;
  surface: string;
  text: string;
  muted: string;
  accent: string;
  accentSecondary: string;
  border: string;
  headerBadge: string;
  dark: boolean;
  glow?: boolean;
}

export interface EnginePersistedState {
  version: number;
  mode: AppMode;
  portal: PortalId;
  lifecycle: LifecycleState;
  entryModifier: EntryModifier;
  icl: IclAttributes;
  cards: FeedCard[];
  marketplace: MarketplaceState;
  pruningEnabled: boolean;
  telemetry: TelemetryEvent[];
  ctrStats: CardCtrStats[];
}

export interface ToastMessage {
  id: string;
  message: string;
}

export interface ImagePreset {
  id: string;
  label: string;
  url: string;
}
