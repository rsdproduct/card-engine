import type {
  CardCtrStats,
  EntryModifier,
  FeedCard,
  IclAttributes,
  LifecycleState,
  PortalId,
} from "@/types/cardEngine";

export function scoreCard(
  card: FeedCard,
  portal: PortalId,
  lifecycle: LifecycleState,
  entryModifier: EntryModifier,
  icl: IclAttributes,
): number {
  let score = card.priority;
  score += card.portalBoost?.[portal] ?? 0;
  score += card.lifecycleBoost?.[lifecycle] ?? 0;
  score += card.entryBoost?.[entryModifier] ?? 0;

  if (icl.urgency_tier === "Actively applying") {
    if (card.template === "B" || card.id === "recruiter-radar") score += 10;
  }
  if (icl.target_role && card.id === "resume-tailoring") score += 6;
  if (icl.work_pref && card.id === "recruiter-radar") score += 4;
  if (portal === "rna" && entryModifier === "uploader" && card.id === "resume-tailoring") {
    score += 12;
  }
  if (portal === "boldpro" && card.id === "vanity-claim") score += 12;
  if (
    (lifecycle === "long_term_8_plus" || lifecycle === "post_cancellation") &&
    card.id === "salary-pulse"
  ) {
    score += 8;
  }

  return score;
}

export function rankCards(
  cards: FeedCard[],
  portal: PortalId,
  lifecycle: LifecycleState,
  entryModifier: EntryModifier,
  icl: IclAttributes,
  pruningEnabled: boolean,
  ctrStats: CardCtrStats[],
): FeedCard[] {
  const visible = cards.filter((c) => !c.pruned);
  const avgCtr = averageCtr(ctrStats);

  return [...visible]
    .filter((card) => {
      if (!pruningEnabled) return true;
      const ctr = getCtr(ctrStats, card.id);
      if (ctr.impressions < 3) return true;
      const rate = ctr.impressions === 0 ? 0 : ctr.clicks / ctr.impressions;
      return rate >= avgCtr * 0.7;
    })
    .sort(
      (a, b) =>
        scoreCard(b, portal, lifecycle, entryModifier, icl) -
        scoreCard(a, portal, lifecycle, entryModifier, icl),
    );
}

export function getCtr(stats: CardCtrStats[], cardId: string): CardCtrStats {
  return (
    stats.find((s) => s.cardId === cardId) ?? {
      cardId,
      impressions: 0,
      clicks: 0,
      variantAImpressions: 0,
      variantAClicks: 0,
      variantBImpressions: 0,
      variantBClicks: 0,
    }
  );
}

export function averageCtr(stats: CardCtrStats[]): number {
  const eligible = stats.filter((s) => s.impressions >= 3);
  if (eligible.length === 0) return 0.35;
  const sum = eligible.reduce(
    (acc, s) => acc + s.clicks / Math.max(s.impressions, 1),
    0,
  );
  return sum / eligible.length;
}

export function ctrRate(stat: CardCtrStats): number {
  if (stat.impressions === 0) return 0;
  return stat.clicks / stat.impressions;
}

/** Relative CTR of variant vs the stronger sibling; highlight when < 30% of peer. */
export function isLowPerformingVariant(
  stat: CardCtrStats,
  variant: "A" | "B",
): boolean {
  const aImp = stat.variantAImpressions ?? Math.max(1, Math.floor(stat.impressions * 0.5));
  const bImp = stat.variantBImpressions ?? Math.max(1, Math.ceil(stat.impressions * 0.5));
  const aClk = stat.variantAClicks ?? Math.floor(stat.clicks * 0.55);
  const bClk = stat.variantBClicks ?? Math.ceil(stat.clicks * 0.45);
  const aRate = aClk / Math.max(aImp, 1);
  const bRate = bClk / Math.max(bImp, 1);
  const peer = variant === "A" ? bRate : aRate;
  const self = variant === "A" ? aRate : bRate;
  if (peer <= 0) return false;
  return self < peer * 0.3;
}
