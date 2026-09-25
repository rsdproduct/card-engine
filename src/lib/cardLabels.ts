import type { FeedCard } from "@/types/cardEngine";
import type { IndexedCard } from "@/types/cardIndex";

/**
 * Human label for a feed card: `{CI-ID} · {sub product or idea}`.
 * Falls back to headline / campaign name — never a raw generated id when a
 * friendlier name exists.
 */
export function getCardLabel(
  sourceCardId: string,
  indexCards: IndexedCard[],
  feedCard?: FeedCard | null,
): string {
  const indexed = indexCards.find((c) => c.sourceCardId === sourceCardId);
  if (indexed) {
    const name =
      indexed.subProduct.trim() ||
      indexed.idea.trim() ||
      feedCard?.headline?.trim() ||
      feedCard?.campaignName?.trim() ||
      indexed.id;
    return `${indexed.id} · ${name}`;
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
