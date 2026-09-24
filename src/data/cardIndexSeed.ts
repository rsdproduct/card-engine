/**
 * Dummy data for the Card Index catalog.
 * Seeded from Candidate Feed cards (read-only) plus six non-live extras.
 * Edits live in LocalStorage — this file is the reset baseline only.
 *
 * v1.1: taxonomy fields (pillar / mainProduct / subProduct) are owned by
 * TAXONOMY_BY_ID so a remap can land without touching ids, ideas, statuses,
 * portals, owners, or sourceCardIds.
 */
import { initialCards } from "@/data/initialCards";
import { resolveTargetPortalIds } from "@/lib/portalScope";
import { getCardPortalScope } from "@/lib/ranking";
import type { FeedCard } from "@/types/cardEngine";
import type { IndexedCard, Pillar } from "@/types/cardIndex";

type Taxonomy = {
  pillar: Pillar;
  mainProduct: string;
  subProduct: string;
};

type SeedMeta = {
  idea: string;
  owner: string;
  notes?: string;
};

/**
 * v1.1 taxonomy remap for CI-001…CI-015.
 * Only pillar / mainProduct / subProduct — ids, ideas, statuses, portals,
 * owners, and sourceCardIds stay on the card records below.
 */
const TAXONOMY_BY_ID: Record<string, Taxonomy> = {
  "CI-001": {
    pillar: "Job Search",
    mainProduct: "Jobs",
    subProduct: "Target Role",
  },
  "CI-002": {
    pillar: "Job Search",
    mainProduct: "Jobs",
    subProduct: "Work Preferences",
  },
  "CI-003": {
    pillar: "Work Productivity & Career Management",
    mainProduct: "Salary Tools",
    subProduct: "Salary Band",
  },
  "CI-004": {
    pillar: "Career Documents",
    mainProduct: "Resume Builder",
    subProduct: "Skills Emphasis",
  },
  "CI-005": {
    pillar: "Job Search",
    mainProduct: "Jobs",
    subProduct: "Search Urgency",
  },
  "CI-006": {
    pillar: "Career Documents",
    mainProduct: "Resume Optimization",
    subProduct: "Quick-Stitch RTJ",
  },
  "CI-007": {
    pillar: "Job Search",
    mainProduct: "Monster / CareerBuilder",
    subProduct: "Employer Opt-in",
  },
  "CI-008": {
    pillar: "Work Productivity & Career Management",
    mainProduct: "Bold.pro",
    subProduct: "Vanity URL",
  },
  "CI-009": {
    pillar: "Work Productivity & Career Management",
    mainProduct: "Bold.pro",
    subProduct: "Profile Analytics",
  },
  "CI-010": {
    pillar: "Career Documents",
    mainProduct: "Cover Letter Builder",
    subProduct: "Tone Selector",
  },
  "CI-011": {
    pillar: "Job Search",
    mainProduct: "Jobs",
    subProduct: "Saved Search Digest",
  },
  "CI-012": {
    pillar: "Work Productivity & Career Management",
    mainProduct: "Career Planning",
    subProduct: "Weekly Goals",
  },
  "CI-013": {
    pillar: "Work Life & Wellness",
    mainProduct: "Wellness Content",
    subProduct: "Burnout Check-in",
  },
  "CI-014": {
    pillar: "Work Productivity & Career Management",
    mainProduct: "Interview Prep",
    subProduct: "Calm Tips",
  },
  "CI-015": {
    pillar: "Career Documents",
    mainProduct: "Resume Optimization",
    subProduct: "ATS Health Score",
  },
};

/** Metadata inferred from each feed card's campaign / copy (non-taxonomy). */
const FEED_META: Record<string, SeedMeta> = {
  "role-radar": {
    idea: "Ask the member where they want to go next so we can tune matches",
    owner: "Growth PM",
  },
  "work-style": {
    idea: "Capture remote / hybrid / office preference for matching filters",
    owner: "Growth PM",
  },
  "salary-pulse": {
    idea: "Calibrate salary band against market intel for senior cohorts",
    owner: "Insights PM",
  },
  "skills-spotlight": {
    idea: "Let members pick skills to emphasize on the next tailor pass",
    owner: "Docs PM",
  },
  "urgency-calibrator": {
    idea: "Two-step intent: how hot is the search, then what to optimize",
    owner: "Growth PM",
  },
  "resume-tailoring": {
    idea: "Show ATS keyword gaps and open Quick-Stitch tailor in ~10s",
    owner: "Docs PM",
  },
  "recruiter-radar": {
    idea: "Surface employer search pulse and Open-to-Inquiries toggle",
    owner: "Marketplace PM",
  },
  "vanity-claim": {
    idea: "Prompt members to claim their public Bold.pro profile URL",
    owner: "Bold.pro PM",
  },
  "weekly-digest": {
    idea: "Weekly visibility loop: searches, views, and tailor actions",
    owner: "Engagement PM",
  },
};

function padId(n: number) {
  return `CI-${String(n).padStart(3, "0")}`;
}

function applyTaxonomy(
  id: string,
  fallback: Taxonomy,
): Taxonomy {
  return TAXONOMY_BY_ID[id] ?? fallback;
}

function fromFeedCard(card: FeedCard, index: number): IndexedCard {
  const id = padId(index + 1);
  const meta = FEED_META[card.id];
  const portals = resolveTargetPortalIds(getCardPortalScope(card));
  const taxonomy = applyTaxonomy(id, {
    pillar: "Other",
    mainProduct: card.brandTag ?? card.campaignName ?? "Feed",
    subProduct: `Type ${card.template}`,
  });
  return {
    id,
    idea: meta?.idea ?? card.headline,
    pillar: taxonomy.pillar,
    mainProduct: taxonomy.mainProduct,
    subProduct: taxonomy.subProduct,
    status: "Live",
    portals,
    owner: meta?.owner ?? "Product",
    sourceCardId: card.id,
    notes: meta?.notes,
  };
}

/** One IndexedCard per unique feed card; multi-portal cards list all portals. */
const seededFromFeed: IndexedCard[] = initialCards.map((card, i) =>
  fromFeedCard(card, i),
);

type ExtraBase = Omit<IndexedCard, "pillar" | "mainProduct" | "subProduct">;

/** Six extras across Idea / In Progress / Paused / Retired and the four main pillars. */
const extraBases: ExtraBase[] = [
  {
    id: padId(seededFromFeed.length + 1),
    idea: "Cover letter tone picker for application packets",
    status: "Idea",
    portals: ["mpr", "rna", "zeti"],
    owner: "Docs PM",
    notes: "Dummy idea — no feed design yet.",
  },
  {
    id: padId(seededFromFeed.length + 2),
    idea: "Saved-search digest for new Monster matches overnight",
    status: "Idea",
    portals: ["monster"],
    owner: "Growth PM",
    notes: "Dummy idea — explore push vs in-feed.",
  },
  {
    id: padId(seededFromFeed.length + 3),
    idea: "Weekly goals checklist for active job seekers",
    status: "In Progress",
    portals: ["mpr", "monster", "boldpro"],
    owner: "Engagement PM",
    notes: "Dummy in-progress — copy draft only.",
  },
  {
    id: padId(seededFromFeed.length + 4),
    idea: "Burnout check-in with gentle break suggestions",
    status: "In Progress",
    portals: ["rna", "boldpro"],
    owner: "Wellness PM",
    notes: "Dummy in-progress — tone review pending.",
  },
  {
    id: padId(seededFromFeed.length + 5),
    idea: "Interview day calm tips before scheduled screens",
    status: "Paused",
    portals: ["monster", "zeti"],
    owner: "Wellness PM",
    notes: "Dummy paused — waiting on brand partner.",
  },
  {
    id: padId(seededFromFeed.length + 6),
    idea: "Old Phoenix ATS health score (retired prototype)",
    status: "Retired",
    portals: ["mpr", "rna"],
    owner: "Docs PM",
    notes: "Dummy retired — replaced by RTJ tailor flow.",
  },
];

const extras: IndexedCard[] = extraBases.map((base) => {
  const taxonomy = applyTaxonomy(base.id, {
    pillar: "Other",
    mainProduct: "Other",
    subProduct: "Other",
  });
  return { ...base, ...taxonomy };
});

export const cardIndexSeed: IndexedCard[] = [...seededFromFeed, ...extras];

export function nextCardIndexId(existing: IndexedCard[]): string {
  let max = 0;
  for (const card of existing) {
    const match = /^CI-(\d+)$/i.exec(card.id);
    if (match) max = Math.max(max, Number(match[1]));
  }
  return padId(max + 1);
}
