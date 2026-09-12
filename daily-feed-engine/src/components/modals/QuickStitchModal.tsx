"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Check, X } from "lucide-react";
import { useFeedEngine } from "@/context/FeedEngineContext";
import type { CardTemplateBContent } from "@/types/cardEngine";

export function QuickStitchModal() {
  const {
    activeQuickStitchCardId,
    cards,
    theme,
    closeQuickStitch,
    applyQuickStitch,
  } = useFeedEngine();

  const card = cards.find((c) => c.id === activeQuickStitchCardId);
  const content = card?.content as CardTemplateBContent | undefined;

  return (
    <AnimatePresence>
      {card && content ? (
        <motion.div
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 p-4 sm:items-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={closeQuickStitch}
        >
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-labelledby="quick-stitch-title"
            initial={{ opacity: 0, y: 24, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 16, scale: 0.98 }}
            transition={{ type: "spring", stiffness: 360, damping: 28 }}
            className="w-full max-w-lg rounded-2xl border p-5 shadow-2xl"
            style={{
              background: theme.surface,
              borderColor: theme.border,
              color: theme.text,
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-4 flex items-start justify-between gap-3">
              <div>
                <p
                  className="text-[11px] font-semibold uppercase tracking-[0.14em]"
                  style={{ color: theme.accent }}
                >
                  Quick-Stitch · 10s Overlay
                </p>
                <h2 id="quick-stitch-title" className="mt-1 text-xl font-semibold tracking-tight">
                  {content.modalTitle}
                </h2>
                <p className="mt-1 text-sm" style={{ color: theme.muted }}>
                  {card.headline}
                </p>
              </div>
              <button
                type="button"
                aria-label="Close"
                onClick={closeQuickStitch}
                className="rounded-lg p-2 transition hover:opacity-70"
                style={{ color: theme.muted }}
              >
                <X className="size-5" />
              </button>
            </div>

            <ul className="space-y-2">
              {content.modalPreview.map((line) => (
                <li
                  key={line}
                  className="flex items-start gap-2 rounded-xl border px-3 py-2.5 text-sm"
                  style={{ borderColor: theme.border }}
                >
                  <Check className="mt-0.5 size-4 shrink-0" style={{ color: theme.accent }} />
                  <span>{line}</span>
                </li>
              ))}
            </ul>

            <button
              type="button"
              onClick={() => applyQuickStitch(card.id)}
              className="mt-5 w-full rounded-xl px-4 py-3 text-sm font-semibold text-white transition hover:opacity-90"
              style={{
                background:
                  theme.id === "boldpro"
                    ? `linear-gradient(135deg, ${theme.accent}, ${theme.accentSecondary})`
                    : theme.accent,
              }}
            >
              Apply Keywords & Download
            </button>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
