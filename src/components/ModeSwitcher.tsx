"use client";

import { motion } from "framer-motion";
import { LayoutList, UserRound, Wrench } from "lucide-react";
import { useFeedEngine } from "@/context/FeedEngineContext";
import type { AppMode } from "@/types/cardEngine";
import { cn } from "@/lib/utils";
import { LockSessionButton } from "@/components/auth/LockSessionButton";
import { WtfExplainerTrigger } from "@/components/explainer/WtfExplainer";

const modes: Array<{ id: AppMode; label: string; short: string; icon: typeof UserRound }> = [
  { id: "candidate", label: "Candidate Feed View", short: "Feed", icon: UserRound },
  { id: "studio", label: "PM Authoring Studio", short: "Studio", icon: Wrench },
  { id: "index", label: "Card Index", short: "Index", icon: LayoutList },
];

export function ModeSwitcher({
  hasSeenExplainer,
  onOpenExplainer,
}: {
  hasSeenExplainer: boolean;
  onOpenExplainer: () => void;
}) {
  const { mode, setMode, persistenceLabel } = useFeedEngine();

  return (
    <div
      data-testid="mode-switcher"
      className="border-b border-[#D5DEE6] bg-[#0F2537] text-white"
    >
      <div className="mx-auto flex max-w-7xl flex-col gap-3 px-4 py-3 min-[1100px]:flex-row min-[1100px]:items-center min-[1100px]:justify-between">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#5EEAD4]">
              BOLD · Daily Feed Card Engine V2
            </p>
            <p className="mt-0.5 text-sm text-white/70">
              Dual-view prototype · {persistenceLabel}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <LockSessionButton />
            <WtfExplainerTrigger
              hasSeen={hasSeenExplainer}
              onOpen={onOpenExplainer}
            />
          </div>
        </div>

        <div
          className="relative flex w-full max-w-2xl flex-wrap rounded-xl bg-white/10 p-1 backdrop-blur-sm min-[1100px]:w-auto min-[1100px]:flex-nowrap"
          role="tablist"
          aria-label="App views"
        >
          {modes.map((m) => {
            const active = mode === m.id;
            const Icon = m.icon;
            return (
              <button
                key={m.id}
                type="button"
                role="tab"
                aria-selected={active}
                data-testid={
                  m.id === "studio"
                    ? "mode-studio"
                    : m.id === "index"
                      ? "mode-index"
                      : "mode-candidate"
                }
                onClick={() => setMode(m.id)}
                className={cn(
                  "relative z-10 flex min-w-0 flex-1 items-center justify-center gap-2 rounded-lg px-2.5 py-2.5 text-xs font-semibold transition min-[1100px]:flex-none min-[1100px]:px-3.5",
                  active ? "text-[#0F2537]" : "text-white/80 hover:text-white",
                )}
              >
                {active ? (
                  <motion.span
                    layoutId="mode-pill"
                    className="absolute inset-0 rounded-lg bg-white shadow"
                    transition={{ type: "spring", stiffness: 420, damping: 32 }}
                  />
                ) : null}
                <span className="relative z-10 inline-flex items-center gap-1.5">
                  <Icon className="size-3.5 shrink-0" />
                  <span className="min-[1100px]:hidden">{m.short}</span>
                  <span className="hidden min-[1100px]:inline">{m.label}</span>
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
