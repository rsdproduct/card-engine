"use client";

import { Activity, RotateCcw, SlidersHorizontal } from "lucide-react";
import { useFeedEngine } from "@/context/FeedEngineContext";
import { entryModifierLabels, lifecycleLabels, portalThemes } from "@/data/portalThemes";
import type { EntryModifier, LifecycleState, PortalId } from "@/types/cardEngine";
import { IclBadgeDisplay } from "./IclBadgeDisplay";

const portals = Object.keys(portalThemes) as PortalId[];
const lifecycles = Object.keys(lifecycleLabels) as LifecycleState[];
const entries = Object.keys(entryModifierLabels) as EntryModifier[];

export function GodModeToolbar() {
  const {
    portal,
    lifecycle,
    entryModifier,
    theme,
    setPortal,
    setLifecycle,
    setEntryModifier,
    setTelemetryOpen,
    telemetryOpen,
    resetEngine,
  } = useFeedEngine();

  return (
    <div
      className="sticky top-0 z-40 border-b backdrop-blur-md"
      style={{
        background: theme.dark ? "rgba(13,15,23,0.92)" : "rgba(255,255,255,0.92)",
        borderColor: theme.border,
        color: theme.text,
      }}
    >
      <div className="mx-auto flex max-w-6xl flex-col gap-3 px-4 py-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <SlidersHorizontal className="size-4" style={{ color: theme.accent }} />
            <div>
              <p className="text-sm font-semibold tracking-tight">
                God Mode · Feed Engine Controller
              </p>
              <p className="text-[11px]" style={{ color: theme.muted }}>
                Portal · lifecycle · entry · ICL live attributes
              </p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setTelemetryOpen(!telemetryOpen)}
              className="inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-semibold"
              style={{ borderColor: theme.border }}
            >
              <Activity className="size-3.5" />
              Telemetry
            </button>
            <button
              type="button"
              onClick={resetEngine}
              className="inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-semibold"
              style={{ borderColor: theme.border, color: theme.muted }}
            >
              <RotateCcw className="size-3.5" />
              Reset
            </button>
          </div>
        </div>

        <div className="grid gap-3 lg:grid-cols-[1.1fr_1fr_0.9fr]">
          <Switcher
            label="Portal"
            value={portal}
            options={portals.map((id) => ({
              value: id,
              label: portalThemes[id].shortName,
            }))}
            onChange={(v) => setPortal(v as PortalId)}
          />
          <Switcher
            label="Lifecycle"
            value={lifecycle}
            options={lifecycles.map((id) => ({
              value: id,
              label: lifecycleLabels[id],
            }))}
            onChange={(v) => setLifecycle(v as LifecycleState)}
          />
          <Switcher
            label="Entry"
            value={entryModifier}
            options={entries.map((id) => ({
              value: id,
              label: entryModifierLabels[id],
            }))}
            onChange={(v) => setEntryModifier(v as EntryModifier)}
          />
        </div>

        <IclBadgeDisplay />
      </div>
    </div>
  );
}

function Switcher({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: Array<{ value: string; label: string }>;
  onChange: (value: string) => void;
}) {
  const { theme } = useFeedEngine();
  return (
    <div>
      <p
        className="mb-1.5 text-[10px] font-semibold uppercase tracking-[0.14em]"
        style={{ color: theme.muted }}
      >
        {label}
      </p>
      <div className="flex flex-wrap gap-1.5">
        {options.map((opt) => {
          const active = opt.value === value;
          return (
            <button
              key={opt.value}
              type="button"
              onClick={() => onChange(opt.value)}
              className="rounded-md px-2.5 py-1.5 text-[11px] font-semibold transition"
              style={{
                background: active ? theme.accent : "transparent",
                color: active ? "#fff" : theme.text,
                border: `1px solid ${active ? theme.accent : theme.border}`,
              }}
            >
              {opt.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
