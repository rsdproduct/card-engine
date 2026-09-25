import type { FeedCard } from "@/types/cardEngine";
import type { IndexedCard } from "@/types/cardIndex";

const IDEA_LABEL_MAX = 28;

function truncateIdea(idea: string): string {
  const trimmed = idea.trim();
  if (trimmed.length <= IDEA_LABEL_MAX) return trimmed;
  return `${trimmed.slice(0, IDEA_LABEL_MAX)}…`;
}

function subProductCounts(indexCards: IndexedCard[]): Map<string, number> {
  const counts = new Map<string, number>();
  for (const card of indexCards) {
    const key = card.subProduct.trim().toLowerCase();
    if (!key) continue;
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }
  return counts;
}

/**
 * Human label for a feed card.
 * Unique sub product → `{CI-ID} · {sub product}`
 * Duplicate or empty sub product → `{CI-ID} · {idea}` (trimmed to 28 + …)
 * Falls back to headline / campaign name when not in the Card Index.
 */
export function getCardLabel(
  sourceCardId: string,
  indexCards: IndexedCard[],
  feedCard?: FeedCard | null,
): string {
  const indexed = indexCards.find((c) => c.sourceCardId === sourceCardId);
  if (indexed) {
    const sub = indexed.subProduct.trim();
    const counts = subProductCounts(indexCards);
    const unique = Boolean(sub) && (counts.get(sub.toLowerCase()) ?? 0) === 1;
    if (unique) {
      return `${indexed.id} · ${sub}`;
    }
    const idea =
      indexed.idea.trim() ||
      feedCard?.headline?.trim() ||
      feedCard?.campaignName?.trim() ||
      indexed.id;
    return `${indexed.id} · ${truncateIdea(idea)}`;
  }

  const fallback =
    feedCard?.headline?.trim() ||
    feedCard?.campaignName?.trim() ||
    feedCard?.brandTag?.trim();
  return fallback || sourceCardId;
}

/** Card Index id for a feed card, if linked. */
export function getCardIndexId(
  sourceCardId: string,
  indexCards: IndexedCard[],
): string | null {
  return indexCards.find((c) => c.sourceCardId === sourceCardId)?.id ?? null;
}
