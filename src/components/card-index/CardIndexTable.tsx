"use client";

import { AnimatePresence, motion } from "framer-motion";
import { ChevronDown } from "lucide-react";
import { useState } from "react";
import { portalThemes } from "@/data/portalThemes";
import { displayIdea, displayOwner } from "@/lib/cardIndexFeed";
import type { PortalId } from "@/types/cardEngine";
import type { IndexedCard, Pillar } from "@/types/cardIndex";
import { PortalBadgeRow } from "./PortalBadge";
import { StatusPill } from "./StatusPill";
import { cn } from "@/lib/utils";

export function CardIndexTable({
  groups,
  groupKey,
  onSelect,
}: {
  groups: Array<{ key: string; label: string; cards: IndexedCard[] }>;
  groupKey: "pillar" | "portal";
  onSelect: (id: string) => void;
}) {
  const hidePillar = groupKey === "pillar";
  const hidePortals = groupKey === "portal";

  return (
    <div className="space-y-3" data-testid="card-index-table">
      {groups.map((group) => (
        <CollapsibleGroup
          key={group.key}
          label={group.label}
          count={group.cards.length}
          portalAccent={
            groupKey === "portal"
              ? portalThemes[group.key as PortalId]?.accent
              : undefined
          }
        >
          {/* Desktop / tablet table — no horizontal scroll ≥768 */}
          <div className="hidden md:block">
            <table className="w-full table-fixed border-collapse text-left text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-[11px] uppercase tracking-wide text-slate-500">
                  <th className="w-[72px] px-2 py-2 font-semibold xl:px-3">ID</th>
                  <th className="px-2 py-2 font-semibold xl:px-3">Idea</th>
                  {!hidePillar ? (
                    <th className="px-2 py-2 font-semibold xl:px-3">Pillar</th>
                  ) : null}
                  <th className="px-2 py-2 font-semibold xl:px-3">Main Product</th>
                  <th className="hidden px-2 py-2 font-semibold lg:table-cell xl:px-3">
                    Sub Product
                  </th>
                  <th className="w-[100px] px-2 py-2 font-semibold xl:px-3">Status</th>
                  {!hidePortals ? (
                    <th className="px-2 py-2 font-semibold xl:px-3">Portals</th>
                  ) : null}
                  <th className="hidden px-2 py-2 font-semibold min-[1100px]:table-cell xl:w-[110px] xl:px-3">
                    Owner
                  </th>
                </tr>
              </thead>
              <tbody>
                {group.cards.map((card) => (
                  <tr
                    key={card.id}
                    className="cursor-pointer border-b border-slate-100 hover:bg-slate-50 focus-within:bg-slate-50"
                    onClick={() => onSelect(card.id)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        onSelect(card.id);
                      }
                    }}
                    tabIndex={0}
                    data-testid={`card-index-row-${card.id}`}
                  >
                    <td className="whitespace-nowrap px-2 py-2.5 font-mono text-xs text-slate-600 xl:px-3">
                      {card.id}
                    </td>
                    <td className="truncate px-2 py-2.5 font-medium text-slate-900 xl:px-3">
                      {displayIdea(card.idea)}
                    </td>
                    {!hidePillar ? (
                      <td className="truncate px-2 py-2.5 text-slate-600 xl:px-3">
                        {card.pillar}
                      </td>
                    ) : null}
                    <td className="truncate px-2 py-2.5 text-slate-600 xl:px-3">
                      {card.mainProduct || "—"}
                    </td>
                    <td className="hidden truncate px-2 py-2.5 text-slate-600 lg:table-cell xl:px-3">
                      {card.subProduct || "—"}
                    </td>
                    <td className="px-2 py-2.5 xl:px-3">
                      <StatusPill status={card.status} />
                    </td>
                    {!hidePortals ? (
                      <td className="px-2 py-2.5 xl:px-3">
                        <PortalBadgeRow portals={card.portals} />
                      </td>
                    ) : null}
                    <td className="hidden truncate px-2 py-2.5 text-slate-600 min-[1100px]:table-cell xl:px-3">
                      {displayOwner(card.owner)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile stacked cards */}
          <ul className="space-y-2 md:hidden">
            {group.cards.map((card) => (
              <li key={card.id}>
                <button
                  type="button"
                  onClick={() => onSelect(card.id)}
                  className="w-full rounded-xl border border-slate-200 bg-white p-3 text-left shadow-sm hover:border-slate-300"
                  data-testid={`card-index-mobile-${card.id}`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <span className="font-mono text-[11px] text-slate-500">
                      {card.id}
                    </span>
                    <StatusPill status={card.status} />
                  </div>
                  <p className="mt-1.5 text-sm font-semibold text-slate-900">
                    {displayIdea(card.idea)}
                  </p>
                  <p className="mt-1 text-xs text-slate-500">
                    {card.pillar} · {card.mainProduct || "—"} ·{" "}
                    {card.subProduct || "—"}
                  </p>
                  <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
                    <PortalBadgeRow portals={card.portals} />
                    <span className="text-xs text-slate-500">
                      {displayOwner(card.owner)}
                    </span>
                  </div>
                </button>
              </li>
            ))}
          </ul>
        </CollapsibleGroup>
      ))}
    </div>
  );
}

function CollapsibleGroup({
  label,
  count,
  children,
  portalAccent,
}: {
  label: string;
  count: number;
  children: React.ReactNode;
  portalAccent?: string;
}) {
  const [open, setOpen] = useState(true);
  return (
    <section className="overflow-hidden rounded-xl border border-slate-200 bg-white">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="flex w-full items-center justify-between gap-3 px-3 py-3 text-left hover:bg-slate-50 sm:px-4"
      >
        <span className="flex min-w-0 items-center gap-2">
          {portalAccent ? (
            <span
              className="size-2.5 shrink-0 rounded-full"
              style={{ background: portalAccent }}
              aria-hidden
            />
          ) : null}
          <span className="truncate text-sm font-semibold text-slate-900">
            {label}
          </span>
          <span className="rounded-md bg-slate-100 px-1.5 py-0.5 text-[11px] font-semibold text-slate-600">
            {count}
          </span>
        </span>
        <ChevronDown
          className={cn(
            "size-4 shrink-0 text-slate-500 transition-transform",
            open && "rotate-180",
          )}
        />
      </button>
      <AnimatePresence initial={false}>
        {open ? (
          <motion.div
            key="body"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.22 }}
            className="overflow-hidden border-t border-slate-100"
          >
            <div className="p-2 sm:p-3">{children}</div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </section>
  );
}

export function pillarOrder(pillar: Pillar): number {
  const order: Pillar[] = [
    "Career Documents",
    "Job Search",
    "Work Productivity & Career Management",
    "Work Life & Wellness",
    "Other",
  ];
  return order.indexOf(pillar);
}
