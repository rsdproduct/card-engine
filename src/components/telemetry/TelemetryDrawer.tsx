"use client";

import { useMemo } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronDown, Pause, Scissors } from "lucide-react";
import { useCardIndex } from "@/context/CardIndexContext";
import { useFeedEngine } from "@/context/FeedEngineContext";
import { getCardLabel } from "@/lib/cardLabels";
import { ctrRate, getCtr, isLowPerformingVariant } from "@/lib/ranking";
import type { FeedCard, TelemetryEvent } from "@/types/cardEngine";
import type { IndexedCard } from "@/types/cardIndex";

function eventTypeLabel(type: TelemetryEvent["type"]): string {
  if (type === "demo_control") return "Demo control";
  return type;
}

function displayEventMessage(
  evt: TelemetryEvent,
  indexCards: IndexedCard[],
  feedCards: FeedCard[],
): string {
  if (!evt.cardId) return evt.message;
  const feedCard = feedCards.find((c) => c.id === evt.cardId) ?? null;
  const label = getCardLabel(evt.cardId, indexCards, feedCard);
  if (!evt.message.includes(evt.cardId)) return evt.message;
  return evt.message.split(evt.cardId).join(label);
}

export function TelemetryDrawer() {
  const {
    telemetryOpen,
    setTelemetryOpen,
    theme,
    telemetry,
    ctrStats,
    cards,
    portal,
    pruningEnabled,
    setPruningEnabled,
    avgCtr,
    runPrunePass,
    pauseLowVariant,
  } = useFeedEngine();
  const { cards: indexCards, isHiddenFromFeed } = useCardIndex();

  const orderedCards = useMemo(() => {
    const visible: typeof cards = [];
    const hidden: typeof cards = [];
    for (const card of cards) {
      if (isHiddenFromFeed(card.id, portal)) hidden.push(card);
      else visible.push(card);
    }
    return [...visible, ...hidden];
  }, [cards, isHiddenFromFeed, portal]);

  return (
    <div data-testid="telemetry-drawer" className="fixed right-0 bottom-0 left-0 z-30">
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
                    <label
                      data-testid="pruning-toggle"
                      className="inline-flex items-center gap-2 text-xs font-medium"
                    >
                      <input
                        type="checkbox"
                        checked={pruningEnabled}
                        onChange={(e) => setPruningEnabled(e.target.checked)}
                      />
                      Auto-prune &lt;30% relative CTR
                    </label>
                    <button
                      type="button"
                      onClick={runPrunePass}
                      data-testid="run-prune"
                      className="inline-flex items-center gap-1 rounded-lg border px-2.5 py-1 text-xs font-semibold"
                      style={{ borderColor: theme.border }}
                    >
                      <Scissors className="size-3.5" />
                      Run prune
                    </button>
                  </div>
                </div>
                <div className="space-y-2">
                  {orderedCards.map((card) => {
                    const stat = getCtr(ctrStats, card.id);
                    const rate = ctrRate(stat);
                    const hidden = isHiddenFromFeed(card.id, portal);
                    const below =
                      !hidden && rate < avgCtr * 0.7 && stat.impressions >= 3;
                    const lowA = isLowPerformingVariant(stat, "A");
                    const lowB = isLowPerformingVariant(stat, "B");
                    const label = getCardLabel(card.id, indexCards, card);
                    return (
                      <div
                        key={card.id}
                        data-testid={hidden ? "telemetry-paused-row" : "telemetry-row"}
                        className="rounded-xl border px-3 py-2 text-xs"
                        style={{
                          borderColor:
                            below || lowA || lowB ? theme.accent : theme.border,
                          opacity: hidden ? 0.5 : card.pruned ? 0.55 : 1,
                        }}
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span className="inline-flex min-w-0 items-center gap-2 font-semibold">
                            <span className="truncate">{label}</span>
                            {hidden ? (
                              <span
                                className="shrink-0 rounded-full px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide"
                                style={{
                                  background: theme.dark
                                    ? "rgba(255,255,255,0.08)"
                                    : "rgba(15,37,55,0.08)",
                                  color: theme.muted,
                                }}
                              >
                                Paused
                              </span>
                            ) : null}
                          </span>
                          <span className="shrink-0" style={{ color: theme.muted }}>
                            {stat.clicks}/{stat.impressions} · {Math.round(rate * 100)}%
                            {!hidden && card.pruned
                              ? " · pruned"
                              : !hidden && below
                                ? " · at risk"
                                : ""}
                          </span>
                        </div>
                        <div
                          className="mt-1.5 h-1.5 overflow-hidden rounded-full"
                          style={{
                            background: theme.dark ? "rgba(255,255,255,0.08)" : "#E8EEF2",
                          }}
                        >
                          <div
                            className="h-full rounded-full"
                            style={{
                              width: `${Math.min(rate * 100, 100)}%`,
                              background: theme.accent,
                            }}
                          />
                        </div>
                        {!hidden && (lowA || lowB) && !card.pruned ? (
                          <div className="mt-2 flex flex-wrap gap-2">
                            {lowA && card.variantPaused !== "A" ? (
                              <button
                                type="button"
                                onClick={() => pauseLowVariant(card.id, "A")}
                                className="inline-flex items-center gap-1 rounded-md border px-2 py-1 text-[10px] font-semibold"
                                style={{ borderColor: theme.border }}
                              >
                                <Pause className="size-3" />
                                Pause Low-Performing Variant A
                              </button>
                            ) : null}
                            {lowB && card.variantPaused !== "B" ? (
                              <button
                                type="button"
                                onClick={() => pauseLowVariant(card.id, "B")}
                                className="inline-flex items-center gap-1 rounded-md border px-2 py-1 text-[10px] font-semibold"
                                style={{ borderColor: theme.border }}
                              >
                                <Pause className="size-3" />
                                Pause Low-Performing Variant B
                              </button>
                            ) : null}
                            {card.variantPaused ? (
                              <span style={{ color: theme.muted }}>
                                Variant {card.variantPaused} paused
                              </span>
                            ) : null}
                          </div>
                        ) : null}
                      </div>
                    );
                  })}
                </div>
              </section>

              <section>
                <h3 className="mb-3 text-sm font-semibold">Event stream</h3>
                {telemetry.length === 0 ? (
                  <p className="text-sm" style={{ color: theme.muted }}>
                    Interact with cards to stream impressions, multi-step answers,
                    campaign publishes, and ICL updates.
                  </p>
                ) : (
                  <ul className="space-y-2" data-testid="telemetry-event-stream">
                    {telemetry.slice(0, 40).map((evt) => {
                      const isDemoControl = evt.type === "demo_control";
                      return (
                        <li
                          key={evt.id}
                          data-testid={
                            isDemoControl
                              ? "telemetry-event-demo-control"
                              : "telemetry-event"
                          }
                          className="rounded-xl border px-3 py-2 text-xs"
                          style={{ borderColor: theme.border }}
                        >
                          <div className="flex items-center justify-between gap-2">
                            <span
                              className="font-semibold"
                              style={{
                                color: isDemoControl ? theme.muted : theme.accent,
                              }}
                            >
                              {eventTypeLabel(evt.type)}
                            </span>
                            <span style={{ color: theme.muted }}>
                              {new Date(evt.timestamp).toLocaleTimeString()}
                            </span>
                          </div>
                          <p className="mt-1" style={{ color: theme.muted }}>
                            {displayEventMessage(evt, indexCards, cards)}
                          </p>
                        </li>
                      );
                    })}
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
