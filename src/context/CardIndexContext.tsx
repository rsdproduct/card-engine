"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { cardIndexSeed, nextCardIndexId } from "@/data/cardIndexSeed";
import type { IndexedCard } from "@/types/cardIndex";

const STORAGE_KEY = "bold-card-index-v1";

type CardIndexPersisted = {
  version: number;
  cards: IndexedCard[];
};

interface CardIndexContextValue {
  hydrated: boolean;
  cards: IndexedCard[];
  getCard: (id: string) => IndexedCard | undefined;
  updateCard: (id: string, patch: Partial<IndexedCard>) => void;
  addCard: (card?: Partial<IndexedCard>) => IndexedCard;
  resetToSeed: () => void;
}

const CardIndexContext = createContext<CardIndexContextValue | null>(null);

function loadEdits(): IndexedCard[] | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as CardIndexPersisted;
    if (!parsed?.cards?.length) return null;
    return parsed.cards;
  } catch {
    return null;
  }
}

function saveEdits(cards: IndexedCard[]) {
  if (typeof window === "undefined") return;
  try {
    const payload: CardIndexPersisted = { version: 1, cards };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
  } catch {
    // private mode / quota — keep in-memory only
  }
}

function clearEdits() {
  if (typeof window === "undefined") return;
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    // ignore
  }
}

function blankCard(id: string): IndexedCard {
  return {
    id,
    idea: "",
    pillar: "Other",
    mainProduct: "",
    subProduct: "",
    status: "Idea",
    portals: [],
    owner: "",
  };
}

export function CardIndexProvider({ children }: { children: ReactNode }) {
  const [hydrated, setHydrated] = useState(false);
  const [cards, setCards] = useState<IndexedCard[]>(cardIndexSeed);

  useEffect(() => {
    const edits = loadEdits();
    if (edits) setCards(edits);
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    saveEdits(cards);
  }, [cards, hydrated]);

  const getCard = useCallback(
    (id: string) => cards.find((c) => c.id === id),
    [cards],
  );

  const updateCard = useCallback((id: string, patch: Partial<IndexedCard>) => {
    setCards((prev) =>
      prev.map((card) => (card.id === id ? { ...card, ...patch, id: card.id } : card)),
    );
  }, []);

  const addCard = useCallback((partial?: Partial<IndexedCard>) => {
    let created: IndexedCard = blankCard("CI-000");
    setCards((prev) => {
      const id = partial?.id ?? nextCardIndexId(prev);
      created = {
        ...blankCard(id),
        ...partial,
        id,
        idea: partial?.idea?.trim() || "Untitled idea",
        owner: partial?.owner?.trim() || "Unassigned",
        portals: partial?.portals ? [...partial.portals] : [],
      };
      return [...prev, created];
    });
    return created;
  }, []);

  const resetToSeed = useCallback(() => {
    clearEdits();
    setCards(cardIndexSeed.map((c) => ({ ...c, portals: [...c.portals] })));
  }, []);

  const value = useMemo(
    () => ({
      hydrated,
      cards,
      getCard,
      updateCard,
      addCard,
      resetToSeed,
    }),
    [hydrated, cards, getCard, updateCard, addCard, resetToSeed],
  );

  return (
    <CardIndexContext.Provider value={value}>
      {children}
    </CardIndexContext.Provider>
  );
}

export function useCardIndex() {
  const ctx = useContext(CardIndexContext);
  if (!ctx) {
    throw new Error("useCardIndex must be used within CardIndexProvider");
  }
  return ctx;
}
