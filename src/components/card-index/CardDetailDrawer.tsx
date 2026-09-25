"use client";

import { AnimatePresence, motion } from "framer-motion";
import { X } from "lucide-react";
import { useEffect, useId, useMemo, useState } from "react";
import { UniformCard } from "@/components/feed/FeedContainer";
import {
  ProductPicker,
  dedupePreserveCase,
  resolveProductValue,
  ADD_NEW,
} from "@/components/card-index/ProductPicker";
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
  const { getCard, updateCard, addCard, cards } = useCardIndex();
  const { cards: feedCards, showToast, unpruneCard } = useFeedEngine();
  const titleId = useId();
  const ideaId = useId();
  const pillarId = useId();
  const mainId = useId();
  const subId = useId();
  const statusId = useId();
  const ownerId = useId();
  const notesId = useId();
  const isNew = cardId === "__new__";

  const [draft, setDraft] = useState<Draft | null>(null);
  const [mainMode, setMainMode] = useState<"pick" | "add">("pick");
  const [subMode, setSubMode] = useState<"pick" | "add">("pick");
  const [mainCustom, setMainCustom] = useState("");
  const [subCustom, setSubCustom] = useState("");
  const [triedSave, setTriedSave] = useState(false);

  useEffect(() => {
    if (!open) return;
    setTriedSave(false);
    setMainCustom("");
    setSubCustom("");
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
      setMainMode("pick");
      setSubMode("pick");
      return;
    }
    const card = cardId ? getCard(cardId) : undefined;
    if (card) {
      setDraft(toDraft(card));
      setMainMode("pick");
      setSubMode("pick");
    }
  }, [open, isNew, cardId, getCard]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  const mainOptions = useMemo(
    () => dedupePreserveCase(cards.map((c) => c.mainProduct)),
    [cards],
  );

  const subOptions = useMemo(() => {
    const mainKey =
      mainMode === "add"
        ? mainCustom.trim().toLowerCase()
        : (draft?.mainProduct ?? "").trim().toLowerCase();
    if (!mainKey) {
      return dedupePreserveCase(cards.map((c) => c.subProduct));
    }
    return dedupePreserveCase(
      cards
        .filter((c) => c.mainProduct.trim().toLowerCase() === mainKey)
        .map((c) => c.subProduct),
    );
  }, [cards, draft?.mainProduct, mainMode, mainCustom]);

  const previewCard = useMemo(() => {
    const sourceId = draft?.sourceCardId;
    if (!sourceId) return null;
    return feedCards.find((c) => c.id === sourceId) ?? null;
  }, [draft?.sourceCardId, feedCards]);

  const ideaError =
    triedSave && !draft?.idea.trim() ? "Add a short idea." : "";
  const pillarError =
    triedSave && !draft?.pillar ? "Pick a pillar." : "";
  const canSave = Boolean(draft?.idea.trim() && draft?.pillar);

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
    setTriedSave(true);
    const idea = draft.idea.trim();
    if (!idea || !draft.pillar) return;

    const mainProduct = resolveProductValue(
      mainMode === "add" ? ADD_NEW : draft.mainProduct,
      mainCustom,
      mainOptions,
    );
    const subProduct = resolveProductValue(
      subMode === "add" ? ADD_NEW : draft.subProduct,
      subCustom,
      subOptions,
    );

    const nextStatus = draft.status;
    const payload = {
      idea,
      pillar: draft.pillar,
      mainProduct,
      subProduct,
      status: nextStatus,
      portals: draft.portals,
      owner: draft.owner.trim(),
      notes: draft.notes?.trim() || undefined,
      sourceCardId: draft.sourceCardId,
    };

    const prevStatus = isNew ? null : cardId ? getCard(cardId)?.status : null;

    if (isNew) {
      addCard(payload);
    } else if (cardId) {
      updateCard(cardId, payload);
    }

    if (nextStatus === "Paused" || nextStatus === "Retired") {
      if (prevStatus !== nextStatus) {
        showToast("Paused. This card is now hidden from the feed.");
      }
    } else if (nextStatus === "Live" && prevStatus && prevStatus !== "Live") {
      if (draft.sourceCardId) {
        unpruneCard(draft.sourceCardId);
      }
      showToast("Live. This card is back in the feed.");
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
                  <Field label="Idea" htmlFor={ideaId} error={ideaError}>
                    <textarea
                      id={ideaId}
                      value={draft.idea}
                      onChange={(e) => patch("idea", e.target.value)}
                      rows={3}
                      className={cn(fieldClass, ideaError && "border-rose-400")}
                      placeholder="Short plain description of the card idea"
                      aria-invalid={Boolean(ideaError)}
                      aria-describedby={ideaError ? `${ideaId}-err` : undefined}
                      required
                    />
                  </Field>
                  <Field label="Pillar" htmlFor={pillarId} error={pillarError}>
                    <select
                      id={pillarId}
                      value={draft.pillar}
                      onChange={(e) => patch("pillar", e.target.value as Pillar)}
                      className={fieldClass}
                      required
                    >
                      {PILLARS.map((p) => (
                        <option key={p} value={p}>
                          {p}
                        </option>
                      ))}
                    </select>
                  </Field>
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <ProductPicker
                      label="Main product"
                      selectId={mainId}
                      mode={mainMode}
                      setMode={setMainMode}
                      selected={draft.mainProduct}
                      onSelect={(v) => {
                        patch("mainProduct", v);
                        patch("subProduct", "");
                        setSubMode("pick");
                        setSubCustom("");
                      }}
                      custom={mainCustom}
                      onCustom={setMainCustom}
                      options={mainOptions}
                      testId="card-index-main-product"
                    />
                    <ProductPicker
                      label="Sub product"
                      selectId={subId}
                      mode={subMode}
                      setMode={setSubMode}
                      selected={draft.subProduct}
                      onSelect={(v) => patch("subProduct", v)}
                      custom={subCustom}
                      onCustom={setSubCustom}
                      options={subOptions}
                      testId="card-index-sub-product"
                    />
                  </div>
                  <Field label="Status" htmlFor={statusId}>
                    <select
                      id={statusId}
                      value={draft.status}
                      onChange={(e) =>
                        patch("status", e.target.value as CardStatus)
                      }
                      className={fieldClass}
                      data-testid="card-index-status"
                    >
                      {CARD_STATUSES.map((s) => (
                        <option key={s} value={s}>
                          {s}
                        </option>
                      ))}
                    </select>
                  </Field>
                  <Field label="Owner" htmlFor={ownerId}>
                    <input
                      id={ownerId}
                      value={draft.owner}
                      onChange={(e) => patch("owner", e.target.value)}
                      className={fieldClass}
                      placeholder="Unassigned"
                    />
                  </Field>
                  <fieldset>
                    <legend className="mb-1 block text-xs font-semibold text-slate-600">
                      Portals
                    </legend>
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
                  </fieldset>
                  <Field label="Notes" htmlFor={notesId}>
                    <textarea
                      id={notesId}
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
                disabled={!canSave}
                className="rounded-lg bg-[#0F2537] px-4 py-2 text-sm font-semibold text-white hover:bg-[#163249] disabled:cursor-not-allowed disabled:opacity-50"
                data-testid="card-index-save"
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
  htmlFor,
  error,
  children,
}: {
  label: string;
  htmlFor?: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="block">
      <label
        htmlFor={htmlFor}
        className="mb-1 block text-xs font-semibold text-slate-600"
      >
        {label}
      </label>
      {children}
      {error ? (
        <p
          id={htmlFor ? `${htmlFor}-err` : undefined}
          className="mt-1 text-xs font-medium text-rose-600"
          role="alert"
        >
          {error}
        </p>
      ) : null}
    </div>
  );
}
