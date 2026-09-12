export type PortalId = "mpr" | "rna" | "boldpro" | "monster";

export type LifecycleState =
  | "pre_conversion"
  | "early_1_7"
  | "long_term_8_plus"
  | "post_cancellation";

export type EntryModifier = "uploader" | "scratch_builder";

export type CardTemplate = "A" | "B" | "C" | "D";

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
  | "employer_intent_signal"
  | "quick_stitch_applied";

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

export interface CardTemplateAContent {
  options: CardOption[];
  iclKey: IclAttributeKey;
}

export interface CardTemplateBContent {
  matchScore?: number;
  matchLabel?: string;
  missingKeywords?: string[];
  healthScore?: number;
  blockers?: string[];
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

export interface FeedCard {
  id: string;
  template: CardTemplate;
  headline: string;
  subtitle?: string;
  priority: number;
  /** Higher = preferred for these portals */
  portalBoost?: Partial<Record<PortalId, number>>;
  /** Higher = preferred for these entry modifiers */
  entryBoost?: Partial<Record<EntryModifier, number>>;
  /** Higher = preferred for these lifecycle states */
  lifecycleBoost?: Partial<Record<LifecycleState, number>>;
  content: CardContent;
  pruned?: boolean;
  custom?: boolean;
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
