import type { PortalId } from "@/types/cardEngine";

export type Pillar =
  | "Career Documents"
  | "Job Search"
  | "Work Productivity & Career Management"
  | "Work Life & Wellness"
  | "Other";

export type CardStatus = "Idea" | "In Progress" | "Live" | "Paused" | "Retired";

/** Catalog entry for the Card Index. Portals use existing PortalId. */
export interface IndexedCard {
  id: string;
  idea: string;
  pillar: Pillar;
  mainProduct: string;
  subProduct: string;
  status: CardStatus;
  portals: PortalId[];
  owner: string;
  sourceCardId?: string;
  notes?: string;
}

export type CardIndexView = "all" | "live-now";

export const PILLARS: Pillar[] = [
  "Career Documents",
  "Job Search",
  "Work Productivity & Career Management",
  "Work Life & Wellness",
  "Other",
];

export const CARD_STATUSES: CardStatus[] = [
  "Idea",
  "In Progress",
  "Live",
  "Paused",
  "Retired",
];
