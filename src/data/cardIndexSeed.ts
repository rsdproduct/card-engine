/**
 * Dummy data for the Card Index catalog.
 * Seeded from Candidate Feed cards (read-only) plus six non-live extras.
 * Edits live in LocalStorage — this file is the reset baseline only.
 */
import { initialCards } from "@/data/initialCards";
import { resolveTargetPortalIds } from "@/lib/portalScope";
import { getCardPortalScope } from "@/lib/ranking";
import type { FeedCard } from "@/types/cardEngine";
import type { IndexedCard, Pillar } from "@/types/cardIndex";

type SeedMeta = {
  idea: string;
  pillar: Pillar;
  mainProduct: string;
  subProduct: string;
  owner: string;
  notes?: string;
};

/** Metadata inferred from each feed card's campaign / copy. */
const FEED_META: Record<string, SeedMeta> = {
  "role-radar": {
    idea: "Ask the member where they want to go next so we can tune matches",
    pillar: "Job Search",
    mainProduct: "Career Path",
    subProduct: "Target Role",
    owner: "Growth PM",
  },
  "work-style": {
    idea: "Capture remote / hybrid / office preference for matching filters",
    pillar: "Job Search",
    mainProduct: "Preferences",
    subProduct: "Work Style",
    owner: "Growth PM",
  },
  "salary-pulse": {
    idea: "Calibrate salary band against market intel for senior cohorts",
    pillar: "Job Search",
    mainProduct: "Market Intel",
    subProduct: "Salary Band",
    owner: "Insights PM",
  },
  "skills-spotlight": {
    idea: "Let members pick skills to emphasize on the next tailor pass",
    pillar: "Career Documents",
    mainProduct: "Skills",
    subProduct: "Resume Emphasis",
    owner: "Docs PM",
  },
  "urgency-calibrator": {
    idea: "Two-step intent: how hot is the search, then what to optimize",
    pillar: "Job Search",
    mainProduct: "Intent",
    subProduct: "Urgency Profiling",
    owner: "Growth PM",
  },
  "resume-tailoring": {
    idea: "Show ATS keyword gaps and open Quick-Stitch tailor in ~10s",
    pillar: "Career Documents",
    mainProduct: "RTJ Tailor",
    subProduct: "ATS Keywords",
    owner: "Docs PM",
  },
  "recruiter-radar": {
    idea: "Surface employer search pulse and Open-to-Inquiries toggle",
    pillar: "Job Search",
    mainProduct: "MCB Marketplace",
    subProduct: "Open to Inquiries",
    owner: "Marketplace PM",
  },
  "vanity-claim": {
    idea: "Prompt members to claim their public Bold.pro profile URL",
    pillar: "Work Productivity & Career Management",
    mainProduct: "Bold.pro",
    subProduct: "Vanity URL",
    owner: "Bold.pro PM",
  },
  "weekly-digest": {
    idea: "Weekly visibility loop: searches, views, and tailor actions",
    pillar: "Work Productivity & Career Management",
    mainProduct: "Digest",
    subProduct: "Visibility Momentum",
    owner: "Engagement PM",
  },
};

function padId(n: number) {
  return `CI-${String(n).padStart(3, "0")}`;
}

function fromFeedCard(card: FeedCard, index: number): IndexedCard {
  const meta = FEED_META[card.id];
  const portals = resolveTargetPortalIds(getCardPortalScope(card));
  return {
    id: padId(index + 1),
    idea: meta?.idea ?? card.headline,
    pillar: meta?.pillar ?? "Other",
    mainProduct: meta?.mainProduct ?? card.brandTag ?? card.campaignName ?? "Feed",
    subProduct: meta?.subProduct ?? `Type ${card.template}`,
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

/** Six extras across Idea / In Progress / Paused / Retired and the four main pillars. */
const extras: IndexedCard[] = [
  {
    id: padId(seededFromFeed.length + 1),
    idea: "Cover letter tone picker for application packets",
    pillar: "Career Documents",
    mainProduct: "Cover Letter",
    subProduct: "Tone Selector",
    status: "Idea",
    portals: ["mpr", "rna", "zeti"],
    owner: "Docs PM",
    notes: "Dummy idea — no feed design yet.",
  },
  {
    id: padId(seededFromFeed.length + 2),
    idea: "Saved-search digest for new Monster matches overnight",
    pillar: "Job Search",
    mainProduct: "Saved Search",
    subProduct: "Overnight Digest",
    status: "Idea",
    portals: ["monster"],
    owner: "Growth PM",
    notes: "Dummy idea — explore push vs in-feed.",
  },
  {
    id: padId(seededFromFeed.length + 3),
    idea: "Weekly goals checklist for active job seekers",
    pillar: "Work Productivity & Career Management",
    mainProduct: "Goals",
    subProduct: "Weekly Checklist",
    status: "In Progress",
    portals: ["mpr", "monster", "boldpro"],
    owner: "Engagement PM",
    notes: "Dummy in-progress — copy draft only.",
  },
  {
    id: padId(seededFromFeed.length + 4),
    idea: "Burnout check-in with gentle break suggestions",
    pillar: "Work Life & Wellness",
    mainProduct: "Wellness",
    subProduct: "Burnout Check-in",
    status: "In Progress",
    portals: ["rna", "boldpro"],
    owner: "Wellness PM",
    notes: "Dummy in-progress — tone review pending.",
  },
  {
    id: padId(seededFromFeed.length + 5),
    idea: "Interview day calm tips before scheduled screens",
    pillar: "Work Life & Wellness",
    mainProduct: "Interview Prep",
    subProduct: "Calm Tips",
    status: "Paused",
    portals: ["monster", "zeti"],
    owner: "Wellness PM",
    notes: "Dummy paused — waiting on brand partner.",
  },
  {
    id: padId(seededFromFeed.length + 6),
    idea: "Old Phoenix ATS health score (retired prototype)",
    pillar: "Career Documents",
    mainProduct: "ATS Health",
    subProduct: "Score Card",
    status: "Retired",
    portals: ["mpr", "rna"],
    owner: "Docs PM",
    notes: "Dummy retired — replaced by RTJ tailor flow.",
  },
];

export const cardIndexSeed: IndexedCard[] = [...seededFromFeed, ...extras];

export function nextCardIndexId(existing: IndexedCard[]): string {
  let max = 0;
  for (const card of existing) {
    const match = /^CI-(\d+)$/i.exec(card.id);
    if (match) max = Math.max(max, Number(match[1]));
  }
  return padId(max + 1);
}
