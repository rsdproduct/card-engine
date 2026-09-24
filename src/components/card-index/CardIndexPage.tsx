"use client";

import { Plus, RotateCcw, Search, SlidersHorizontal, X } from "lucide-react";
import { useId, useMemo, useState } from "react";
import { useCardIndex } from "@/context/CardIndexContext";
import { ALL_PORTAL_IDS } from "@/lib/portalScope";
import { portalThemes } from "@/data/portalThemes";
import type { PortalId } from "@/types/cardEngine";
import {
  CARD_STATUSES,
  PILLARS,
  type CardIndexView,
  type CardStatus,
  type IndexedCard,
  type Pillar,
} from "@/types/cardIndex";
import { CardDetailDrawer } from "./CardDetailDrawer";
import { CardIndexTable, pillarOrder } from "./CardIndexTable";
import { cn } from "@/lib/utils";

export function CardIndexPage() {
  const { cards, hydrated, resetToSeed } = useCardIndex();
  const [view, setView] = useState<CardIndexView>("all");
  const [search, setSearch] = useState("");
  const [pillar, setPillar] = useState<Pillar | "">("");
  const [mainProduct, setMainProduct] = useState("");
  const [status, setStatus] = useState<CardStatus | "">("");
  const [portal, setPortal] = useState<PortalId | "">("");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [confirmReset, setConfirmReset] = useState(false);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const searchId = useId();

  const mainProducts = useMemo(() => {
    const set = new Set(cards.map((c) => c.mainProduct).filter(Boolean));
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, [cards]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return cards.filter((card) => {
      if (view === "live-now" && card.status !== "Live" && card.status !== "Paused") {
        return false;
      }
      if (pillar && card.pillar !== pillar) return false;
      if (mainProduct && card.mainProduct !== mainProduct) return false;
      if (status && card.status !== status) return false;
      if (portal && !card.portals.includes(portal)) return false;
      if (q) {
        const hay = `${card.idea} ${card.mainProduct} ${card.subProduct}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [cards, view, pillar, mainProduct, status, portal, search]);

  const groups = useMemo(() => {
    if (view === "live-now") {
      return ALL_PORTAL_IDS.map((id) => ({
        key: id,
        label: portalThemes[id]?.name ?? id,
        cards: filtered
          .filter((c) => c.portals.includes(id))
          .sort((a, b) => a.id.localeCompare(b.id)),
      })).filter((g) => g.cards.length > 0);
    }

    const byPillar = new Map<Pillar, IndexedCard[]>();
    for (const card of filtered) {
      const list = byPillar.get(card.pillar) ?? [];
      list.push(card);
      byPillar.set(card.pillar, list);
    }
    return Array.from(byPillar.entries())
      .sort((a, b) => pillarOrder(a[0]) - pillarOrder(b[0]))
      .map(([key, list]) => ({
        key,
        label: key,
        cards: list.sort((a, b) => a.id.localeCompare(b.id)),
      }));
  }, [filtered, view]);

  const clearFilters = () => {
    setSearch("");
    setPillar("");
    setMainProduct("");
    setStatus("");
    setPortal("");
  };

  const activeFilterCount = [pillar, mainProduct, status, portal].filter(Boolean)
    .length;
  const hasFilters = Boolean(search || activeFilterCount);

  const openCard = (id: string) => {
    setSelectedId(id);
    setDrawerOpen(true);
  };

  const openNew = () => {
    setSelectedId("__new__");
    setDrawerOpen(true);
  };

  if (!hydrated) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center text-sm text-slate-500">
        Loading card index…
      </div>
    );
  }

  return (
    <div
      className="min-h-[calc(100vh-5rem)] bg-[#F4F7F9] pb-28"
      data-testid="card-index-page"
    >
      <div className="mx-auto max-w-7xl px-4 py-6">
        <header className="mb-5">
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-teal-700">
            Catalog
          </p>
          <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
            Card Index
          </h1>
          <p className="mt-1 max-w-2xl text-sm text-slate-600">
            Browse every feed card idea in one place. Filter, open a row to edit,
            and reset anytime to the sample list.
          </p>
        </header>

        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div
            className="inline-flex rounded-xl bg-white p-1 shadow-sm ring-1 ring-slate-200"
            role="tablist"
            aria-label="Card Index view"
            data-testid="card-index-view-toggle"
          >
            {(
              [
                { id: "all" as const, label: "All Cards" },
                { id: "live-now" as const, label: "Live Now" },
              ] as const
            ).map((opt) => (
              <button
                key={opt.id}
                type="button"
                role="tab"
                aria-selected={view === opt.id}
                data-testid={`card-index-view-${opt.id}`}
                onClick={() => setView(opt.id)}
                className={cn(
                  "rounded-lg px-3 py-2 text-xs font-semibold transition sm:px-4",
                  view === opt.id
                    ? "bg-[#0F2537] text-white"
                    : "text-slate-600 hover:bg-slate-50",
                )}
              >
                {opt.label}
              </button>
            ))}
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={openNew}
              data-testid="card-index-new"
              className="inline-flex items-center gap-1.5 rounded-lg bg-teal-700 px-3 py-2 text-xs font-semibold text-white hover:bg-teal-800"
            >
              <Plus className="size-3.5" />
              New card
            </button>
            <button
              type="button"
              onClick={() => setConfirmReset(true)}
              data-testid="card-index-reset"
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
            >
              <RotateCcw className="size-3.5" />
              Reset sample data
            </button>
          </div>
        </div>

        <div
          className="mb-4 rounded-xl border border-slate-200 bg-white p-3 shadow-sm sm:p-4"
          data-testid="card-index-filters"
        >
          <div className="flex flex-col gap-3">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
              <div className="relative min-w-0 flex-1">
                <label
                  htmlFor={searchId}
                  className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-slate-500"
                >
                  Search
                </label>
                <span className="pointer-events-none absolute bottom-2.5 left-3 text-slate-400">
                  <Search className="size-4" aria-hidden />
                </span>
                <input
                  id={searchId}
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search idea, main, or sub product"
                  className="w-full rounded-lg border border-slate-200 py-2 pr-3 pl-9 text-sm outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20"
                  data-testid="card-index-search"
                />
              </div>
              <button
                type="button"
                className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 md:hidden"
                aria-expanded={filtersOpen}
                aria-controls="card-index-filter-panel"
                onClick={() => setFiltersOpen((v) => !v)}
                data-testid="card-index-filters-toggle"
              >
                <SlidersHorizontal className="size-3.5" aria-hidden />
                Filters
                {activeFilterCount > 0 ? (
                  <span className="rounded-md bg-teal-700 px-1.5 py-0.5 text-[10px] font-bold text-white">
                    {activeFilterCount}
                  </span>
                ) : null}
              </button>
            </div>

            <div
              id="card-index-filter-panel"
              className={cn(
                "flex-col gap-3 lg:flex-row lg:items-end",
                filtersOpen ? "flex" : "hidden md:flex",
              )}
            >
              <FilterSelect
                label="Pillar"
                value={pillar}
                onChange={(v) => setPillar(v as Pillar | "")}
                options={PILLARS.map((p) => ({ value: p, label: p }))}
                testId="card-index-filter-pillar"
              />
              <FilterSelect
                label="Main product"
                value={mainProduct}
                onChange={setMainProduct}
                options={mainProducts.map((p) => ({ value: p, label: p }))}
                testId="card-index-filter-main"
              />
              <FilterSelect
                label="Status"
                value={status}
                onChange={(v) => setStatus(v as CardStatus | "")}
                options={CARD_STATUSES.map((s) => ({ value: s, label: s }))}
                testId="card-index-filter-status"
              />
              <FilterSelect
                label="Portal"
                value={portal}
                onChange={(v) => setPortal(v as PortalId | "")}
                options={ALL_PORTAL_IDS.map((id) => ({
                  value: id,
                  label: portalThemes[id].shortName,
                }))}
                testId="card-index-filter-portal"
              />
              {hasFilters ? (
                <button
                  type="button"
                  onClick={clearFilters}
                  className="inline-flex items-center gap-1 rounded-lg px-3 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100"
                  data-testid="card-index-clear-filters"
                >
                  <X className="size-3.5" />
                  Clear
                </button>
              ) : null}
            </div>
          </div>
          <p
            className="mt-3 text-xs text-slate-500"
            data-testid="card-index-count"
          >
            Showing {filtered.length} of {cards.length}
          </p>
        </div>

        {groups.length === 0 ? (
          <div className="rounded-xl border border-dashed border-slate-300 bg-white px-6 py-12 text-center">
            <p className="text-base font-semibold text-slate-800">
              No cards match these filters
            </p>
            <p className="mt-1 text-sm text-slate-500">
              Clear filters or switch views to see more.
            </p>
            {hasFilters ? (
              <button
                type="button"
                onClick={clearFilters}
                className="mt-4 rounded-lg bg-slate-900 px-3 py-2 text-xs font-semibold text-white"
              >
                Clear filters
              </button>
            ) : null}
          </div>
        ) : (
          <CardIndexTable
            groups={groups}
            groupKey={view === "live-now" ? "portal" : "pillar"}
            onSelect={openCard}
          />
        )}
      </div>

      <CardDetailDrawer
        cardId={selectedId}
        open={drawerOpen}
        onClose={() => {
          setDrawerOpen(false);
          setSelectedId(null);
        }}
      />

      {confirmReset ? (
        <div
          className="fixed inset-0 z-[90] flex items-center justify-center bg-slate-900/40 p-4"
          role="alertdialog"
          aria-labelledby="reset-title"
          aria-describedby="reset-desc"
          data-testid="card-index-reset-confirm"
        >
          <div className="w-full max-w-sm rounded-2xl bg-white p-5 shadow-xl">
            <h3
              id="reset-title"
              className="text-lg font-semibold text-slate-900"
            >
              Reset to sample data?
            </h3>
            <p id="reset-desc" className="mt-2 text-sm text-slate-600">
              This clears your local edits and puts the seed list back. Feed cards
              hidden by Pause or Retired come back too. You cannot undo.
            </p>
            <div className="mt-5 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setConfirmReset(false)}
                className="rounded-lg px-3 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-100"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  resetToSeed();
                  setConfirmReset(false);
                }}
                className="rounded-lg bg-rose-600 px-3 py-2 text-sm font-semibold text-white hover:bg-rose-700"
                data-testid="card-index-reset-confirm-yes"
              >
                Reset
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function FilterSelect({
  label,
  value,
  onChange,
  options,
  testId,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: Array<{ value: string; label: string }>;
  testId: string;
}) {
  const id = useId();
  return (
    <div className="block min-w-[140px]">
      <label
        htmlFor={id}
        className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-slate-500"
      >
        {label}
      </label>
      <select
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-lg border border-slate-200 bg-white px-2.5 py-2 text-sm outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20"
        data-testid={testId}
        aria-label={label}
      >
        <option value="">All</option>
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </div>
  );
}
