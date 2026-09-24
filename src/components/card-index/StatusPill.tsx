"use client";

import type { CardStatus } from "@/types/cardIndex";
import { cn } from "@/lib/utils";

const STATUS_STYLES: Record<
  CardStatus,
  { className: string; strike?: boolean }
> = {
  Idea: {
    className: "bg-slate-100 text-slate-700 ring-slate-200",
  },
  "In Progress": {
    className: "bg-blue-50 text-blue-800 ring-blue-200",
  },
  Live: {
    className: "bg-emerald-50 text-emerald-800 ring-emerald-200",
  },
  Paused: {
    className: "bg-amber-50 text-amber-900 ring-amber-200",
  },
  Retired: {
    className: "bg-slate-100 text-slate-500 ring-slate-200",
    strike: true,
  },
};

export function StatusPill({ status }: { status: CardStatus }) {
  const style = STATUS_STYLES[status];
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-md px-2 py-0.5 text-[11px] font-semibold ring-1 ring-inset",
        style.className,
        style.strike && "line-through decoration-slate-400",
      )}
    >
      {status}
    </span>
  );
}
