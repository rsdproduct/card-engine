"use client";

import { AnimatePresence, motion } from "framer-motion";
import { ChevronDown, Scissors } from "lucide-react";
import { useFeedEngine } from "@/context/FeedEngineContext";
import { ctrRate, getCtr } from "@/lib/ranking";

export function TelemetryDrawer() {
  const {
    telemetryOpen,
    setTelemetryOpen,
    theme,
    telemetry,
    ctrStats,
    cards,
    pruningEnabled,
    setPruningEnabled,
    avgCtr,
    runPrunePass,
  } = useFeedEngine();

  return (
    <div className="fixed right-0 bottom-0 left-0 z-30">
      <button
        type="button"
        onClick={() => setTelemetryOpen(!telemetryOpen)}
        className="mx-auto flex w-full max-w-6xl items-center justify-between border-x border-t px-4 py-2 text-left text-sm font-semibold backdrop-blur-md"
        style={{
          background: theme.dark ? "rgba(22,25,38,0.95)" : "rgba(255,255,255,0.95)",
          borderColor: theme.border,
          color: theme.text,
        }}
      >
        <span className="inline-flex items-center gap-2">
          Telemetry & Dynamic Pruning
          <span className="text-xs font-normal" style={{ color: theme.muted }}>
            avg CTR {Math.round(avgCtr * 100)}%
          </span>
        </span>
        <ChevronDown
          className="size-4 transition-transform"
          style={{ transform: telemetryOpen ? "rotate(0deg)" : "rotate(180deg)" }}
        />
      </button>

      <AnimatePresence initial={false}>
        {telemetryOpen ? (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden border-t"
            style={{
              background: theme.dark ? "#161926" : "#fff",
              borderColor: theme.border,
              color: theme.text,
            }}
          >
            <div className="mx-auto grid max-h-[42vh] max-w-6xl gap-4 overflow-y-auto px-4 py-4 lg:grid-cols-2">
              <section>
                <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                  <h3 className="text-sm font-semibold">Simulated Card CTRs</h3>
                  <div className="flex items-center gap-2">
                    <label className="inline-flex items-center gap-2 text-xs font-medium">
                      <input
                        type="checkbox"
                        checked={pruningEnabled}
                        onChange={(e) => setPruningEnabled(e.target.checked)}
                      />
                      Auto-prune &lt;30% below avg
                    </label>
                    <button
                      type="button"
                      onClick={runPrunePass}
                      className="inline-flex items-center gap-1 rounded-lg border px-2.5 py-1 text-xs font-semibold"
                      style={{ borderColor: theme.border }}
                    >
                      <Scissors className="size-3.5" />
                      Run prune
                    </button>
                  </div>
                </div>
                <div className="space-y-2">
                  {cards.map((card) => {
                    const stat = getCtr(ctrStats, card.id);
                    const rate = ctrRate(stat);
                    const below = rate < avgCtr * 0.7 && stat.impressions >= 3;
                    return (
                      <div
                        key={card.id}
                        className="rounded-xl border px-3 py-2 text-xs"
                        style={{
                          borderColor: below ? theme.accent : theme.border,
                          opacity: card.pruned ? 0.55 : 1,
                        }}
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span className="font-semibold">{card.id}</span>
                          <span style={{ color: theme.muted }}>
                            {stat.clicks}/{stat.impressions} · {Math.round(rate * 100)}%
                            {card.pruned ? " · pruned" : below ? " · at risk" : ""}
                          </span>
                        </div>
                        <div
                          className="mt-1.5 h-1.5 overflow-hidden rounded-full"
                          style={{ background: theme.dark ? "rgba(255,255,255,0.08)" : "#E8EEF2" }}
                        >
                          <div
                            className="h-full rounded-full"
                            style={{
                              width: `${Math.min(rate * 100, 100)}%`,
                              background: theme.accent,
                            }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </section>

              <section>
                <h3 className="mb-3 text-sm font-semibold">Event stream</h3>
                {telemetry.length === 0 ? (
                  <p className="text-sm" style={{ color: theme.muted }}>
                    Interact with cards to stream impressions, clicks, and ICL updates.
                  </p>
                ) : (
                  <ul className="space-y-2">
                    {telemetry.slice(0, 40).map((evt) => (
                      <li
                        key={evt.id}
                        className="rounded-xl border px-3 py-2 text-xs"
                        style={{ borderColor: theme.border }}
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span className="font-semibold" style={{ color: theme.accent }}>
                            {evt.type}
                          </span>
                          <span style={{ color: theme.muted }}>
                            {new Date(evt.timestamp).toLocaleTimeString()}
                          </span>
                        </div>
                        <p className="mt-1" style={{ color: theme.muted }}>
                          {evt.message}
                        </p>
                      </li>
                    ))}
                  </ul>
                )}
              </section>
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}
