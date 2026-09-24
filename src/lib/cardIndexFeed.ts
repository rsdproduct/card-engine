import type { PortalId } from "@/types/cardEngine";
import type { IndexedCard } from "@/types/cardIndex";

/**
 * Whether a feed card should be hidden for the active portal based on
 * Card Index status / portal membership. Cards with no index entry stay visible.
 */
export function isHiddenFromFeed(
  sourceCardId: string,
  portal: PortalId,
  indexCards: IndexedCard[],
): boolean {
  const indexed = indexCards.find((c) => c.sourceCardId === sourceCardId);
  if (!indexed) return false;
  if (indexed.status === "Paused" || indexed.status === "Retired") return true;
  if (!indexed.portals.includes(portal)) return true;
  return false;
}

/** Count of index cards currently Paused (for the feed header muted line). */
export function countPausedInIndex(indexCards: IndexedCard[]): number {
  return indexCards.filter((c) => c.status === "Paused").length;
}

/** Render-only placeholders — never persist these strings. */
export function displayIdea(idea: string): string {
  return idea.trim() || "Untitled idea";
}

export function displayOwner(owner: string): string {
  return owner.trim() || "Unassigned";
}
