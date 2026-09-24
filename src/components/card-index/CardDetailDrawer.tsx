"use client";

import { AnimatePresence, motion } from "framer-motion";
import { X } from "lucide-react";
import { useEffect, useId, useMemo, useState } from "react";
import { UniformCard } from "@/components/feed/FeedContainer";
import { useCardIndex } from "@/context/CardIndexContext";
import { useFeedEngine } from "@/context/FeedEngineContext";
import { ALL_PORTAL_IDS } from "@/lib/portalScope";
import { portalThemes } from "@/data/portalThemes";
import type { PortalId } from "@/types/cardEngine";
import {
  CARD_STATUSES,
  PILLARS,
  type CardStatus,
  type IndexedCard,
  type Pillar,
} from "@/types/cardIndex";
import { PortalBadgeRow } from "./PortalBadge";
import { StatusPill } from "./StatusPill";
import { cn } from "@/lib/utils";

type Draft = Omit<IndexedCard, "portals"> & { portals: PortalId[] };

function toDraft(card: IndexedCard): Draft {
  return { ...card, portals: [...card.portals] };
}

export function CardDetailDrawer({
  cardId,
  open,
  onClose,
}: {
  cardId: string | null;
  open: boolean;
  onClose: () => void;
}) {
  const { getCard, updateCard, addCard } = useCardIndex();
  const { cards: feedCards } = useFeedEngine();
  const titleId = useId();
  const isNew = cardId === "__new__";

  const [draft, setDraft] = useState<Draft | null>(null);

  useEffect(() => {
    if (!open) return;
    if (isNew) {
      setDraft({
        id: "",
        idea: "",
        pillar: "Other",
        mainProduct: "",
        subProduct: "",
        status: "Idea",
        portals: [],
        owner: "",
        notes: "",
      });
      return;
    }
    const card = cardId ? getCard(cardId) : undefined;
    if (card) setDraft(toDraft(card));
  }, [open, isNew, cardId, getCard]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  const previewCard = useMemo(() => {
    const sourceId = draft?.sourceCardId;
    if (!sourceId) return null;
    return feedCards.find((c) => c.id === sourceId) ?? null;
  }, [draft?.sourceCardId, feedCards]);

  const patch = <K extends keyof Draft>(key: K, value: Draft[K]) => {
    setDraft((prev) => (prev ? { ...prev, [key]: value } : prev));
  };

  const togglePortal = (id: PortalId) => {
    setDraft((prev) => {
      if (!prev) return prev;
      const has = prev.portals.includes(id);
      return {
        ...prev,
        portals: has
          ? prev.portals.filter((p) => p !== id)
          : [...prev.portals, id],
      };
    });
  };

  const handleSave = () => {
    if (!draft) return;
    if (isNew) {
      addCard({
        idea: draft.idea.trim() || "Untitled idea",
        pillar: draft.pillar,
        mainProduct: draft.mainProduct.trim(),
        subProduct: draft.subProduct.trim(),
        status: draft.status,
        portals: draft.portals,
        owner: draft.owner.trim() || "Unassigned",
        notes: draft.notes?.trim() || undefined,
        sourceCardId: draft.sourceCardId,
      });
    } else if (cardId) {
      updateCard(cardId, {
        idea: draft.idea.trim(),
        pillar: draft.pillar,
        mainProduct: draft.mainProduct.trim(),
        subProduct: draft.subProduct.trim(),
        status: draft.status,
        portals: draft.portals,
        owner: draft.owner.trim(),
        notes: draft.notes?.trim() || undefined,
        sourceCardId: draft.sourceCardId,
      });
    }
    onClose();
  };

  return (
    <AnimatePresence>
      {open && draft ? (
        <>
          <motion.button
            type="button"
            aria-label="Close card details"
            className="fixed inset-0 z-[70] bg-slate-900/40"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />
          <motion.aside
            role="dialog"
            aria-modal="true"
            aria-labelledby={titleId}
            data-testid="card-index-drawer"
            className={cn(
              "fixed inset-y-0 right-0 z-[80] flex w-full flex-col bg-white shadow-2xl",
              "sm:max-w-xl md:max-w-2xl",
            )}
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", stiffness: 380, damping: 34 }}
          >
            <header className="flex items-start justify-between gap-3 border-b border-slate-200 px-4 py-4 sm:px-5">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">
                  {isNew ? "New card" : draft.id}
                </p>
                <h2
                  id={titleId}
                  className="mt-1 text-lg font-semibold text-slate-900"
                >
                  {isNew ? "Add a card idea" : "Edit card"}
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  Change the fields, then hit Save. Preview shows the live feed
                  design when one exists.
                </p>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-800"
                aria-label="Close"
              >
                <X className="size-5" />
              </button>
            </header>

            <div className="flex-1 overflow-y-auto px-4 py-4 sm:px-5">
              <div className="grid gap-6 lg:grid-cols-2">
                <form
                  className="space-y-3"
                  onSubmit={(e) => {
                    e.preventDefault();
                    handleSave();
                  }}
                >
                  <Field label="Idea">
                    <textarea
                      value={draft.idea}
                      onChange={(e) => patch("idea", e.target.value)}
                      rows={3}
                      className={fieldClass}
                      placeholder="Short plain description of the card idea"
                    />
                  </Field>
                  <Field label="Pillar">
                    <select
                      value={draft.pillar}
                      onChange={(e) => patch("pillar", e.target.value as Pillar)}
                      className={fieldClass}
                    >
                      {PILLARS.map((p) => (
                        <option key={p} value={p}>
                          {p}
                        </option>
                      ))}
                    </select>
                  </Field>
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <Field label="Main product">
                      <input
                        value={draft.mainProduct}
                        onChange={(e) => patch("mainProduct", e.target.value)}
                        className={fieldClass}
                      />
                    </Field>
                    <Field label="Sub product">
                      <input
                        value={draft.subProduct}
                        onChange={(e) => patch("subProduct", e.target.value)}
                        className={fieldClass}
                      />
                    </Field>
                  </div>
                  <Field label="Status">
                    <select
                      value={draft.status}
                      onChange={(e) =>
                        patch("status", e.target.value as CardStatus)
                      }
                      className={fieldClass}
                    >
                      {CARD_STATUSES.map((s) => (
                        <option key={s} value={s}>
                          {s}
                        </option>
                      ))}
                    </select>
                  </Field>
                  <Field label="Owner">
                    <input
                      value={draft.owner}
                      onChange={(e) => patch("owner", e.target.value)}
                      className={fieldClass}
                    />
                  </Field>
                  <Field label="Portals">
                    <div className="flex flex-wrap gap-2">
                      {ALL_PORTAL_IDS.map((id) => {
                        const on = draft.portals.includes(id);
                        const theme = portalThemes[id];
                        return (
                          <button
                            key={id}
                            type="button"
                            onClick={() => togglePortal(id)}
                            aria-pressed={on}
                            className={cn(
                              "rounded-md px-2.5 py-1.5 text-xs font-semibold ring-1 transition",
                              on
                                ? "text-white ring-transparent"
                                : "bg-white text-slate-600 ring-slate-200 hover:bg-slate-50",
                            )}
                            style={
                              on
                                ? { background: theme.accent }
                                : undefined
                            }
                          >
                            {theme.shortName}
                          </button>
                        );
                      })}
                    </div>
                  </Field>
                  <Field label="Notes">
                    <textarea
                      value={draft.notes ?? ""}
                      onChange={(e) => patch("notes", e.target.value)}
                      rows={2}
                      className={fieldClass}
                      placeholder="Optional notes"
                    />
                  </Field>
                  {!isNew && draft.sourceCardId ? (
                    <p className="text-xs text-slate-500">
                      Linked feed card:{" "}
                      <code className="rounded bg-slate-100 px-1">
                        {draft.sourceCardId}
                      </code>
                    </p>
                  ) : null}
                </form>

                <div>
                  <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500">
                    Live preview
                  </p>
                  {previewCard ? (
                    <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                      <UniformCard card={previewCard} />
                    </div>
                  ) : (
                    <div
                      className="flex min-h-[220px] items-center justify-center rounded-xl border border-dashed border-slate-300 bg-slate-100 px-4 text-center text-sm text-slate-500"
                      data-testid="card-index-no-design"
                    >
                      No design yet
                    </div>
                  )}
                  <div className="mt-3">
                    <StatusPill status={draft.status} />
                    <div className="mt-2">
                      <PortalBadgeRow portals={draft.portals} />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <footer className="flex items-center justify-end gap-2 border-t border-slate-200 px-4 py-3 sm:px-5">
              <button
                type="button"
                onClick={onClose}
                className="rounded-lg px-3 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-100"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSave}
                className="rounded-lg bg-[#0F2537] px-4 py-2 text-sm font-semibold text-white hover:bg-[#163249]"
              >
                Save
              </button>
            </footer>
          </motion.aside>
        </>
      ) : null}
    </AnimatePresence>
  );
}

const fieldClass =
  "w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20";

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-semibold text-slate-600">
        {label}
      </span>
      {children}
    </label>
  );
}
