"use client";

import { cn } from "@/lib/utils";

export const ADD_NEW = "__add_new__";

const fieldClass =
  "w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20";

export function dedupePreserveCase(values: string[]): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const raw of values) {
    const v = raw.trim();
    if (!v) continue;
    const key = v.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(v);
  }
  return out.sort((a, b) => a.localeCompare(b));
}

export function resolveProductValue(
  selected: string,
  custom: string,
  existing: string[],
): string {
  const raw = selected === ADD_NEW ? custom.trim() : selected.trim();
  if (!raw) return "";
  const match = existing.find((e) => e.toLowerCase() === raw.toLowerCase());
  return match ?? raw;
}

/** Select an existing product name or type a new one. */
export function ProductPicker({
  label,
  selectId,
  mode,
  setMode,
  selected,
  onSelect,
  custom,
  onCustom,
  options,
  testId,
  className,
}: {
  label: string;
  selectId: string;
  mode: "pick" | "add";
  setMode: (m: "pick" | "add") => void;
  selected: string;
  onSelect: (v: string) => void;
  custom: string;
  onCustom: (v: string) => void;
  options: string[];
  testId: string;
  className?: string;
}) {
  const customId = `${selectId}-custom`;
  return (
    <div className={className}>
      <label
        htmlFor={mode === "add" ? customId : selectId}
        className="mb-1 block text-xs font-semibold text-slate-600"
      >
        {label}
      </label>
      {mode === "add" ? (
        <div className="space-y-1.5">
          <input
            id={customId}
            value={custom}
            onChange={(e) => onCustom(e.target.value)}
            className={fieldClass}
            placeholder="Type a new name"
            data-testid={`${testId}-custom`}
            autoFocus
          />
          <button
            type="button"
            className="text-xs font-semibold text-teal-700 hover:underline"
            onClick={() => {
              setMode("pick");
              onCustom("");
            }}
          >
            Pick existing instead
          </button>
        </div>
      ) : (
        <select
          id={selectId}
          value={selected}
          onChange={(e) => {
            const v = e.target.value;
            if (v === ADD_NEW) {
              setMode("add");
              onSelect("");
              return;
            }
            onSelect(v);
          }}
          className={cn(fieldClass)}
          data-testid={testId}
        >
          <option value="">—</option>
          {options.map((o) => (
            <option key={o} value={o}>
              {o}
            </option>
          ))}
          <option value={ADD_NEW}>+ Add new…</option>
        </select>
      )}
    </div>
  );
}
