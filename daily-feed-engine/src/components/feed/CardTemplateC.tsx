"use client";

import { Radar } from "lucide-react";
import { motion } from "framer-motion";
import { useFeedEngine } from "@/context/FeedEngineContext";
import type { CardTemplateCContent, FeedCard } from "@/types/cardEngine";

export function CardTemplateC({ card }: { card: FeedCard }) {
  const { theme, marketplace, toggleMarketplace } = useFeedEngine();
  const content = card.content as CardTemplateCContent;
  const enabled = marketplace[content.toggleKey];

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <div className="relative flex size-11 items-center justify-center">
          <motion.span
            className="absolute inset-0 rounded-full"
            style={{ border: `2px solid ${theme.accent}` }}
            animate={{ scale: [1, 1.35, 1], opacity: [0.55, 0, 0.55] }}
            transition={{ duration: 2.2, repeat: Infinity, ease: "easeOut" }}
          />
          <div
            className="relative flex size-11 items-center justify-center rounded-full"
            style={{ background: `${theme.accent}22`, color: theme.accent }}
          >
            <Radar className="size-5" />
          </div>
        </div>
        <div>
          <p className="text-2xl font-semibold tracking-tight">{content.statValue}</p>
          <p className="text-sm" style={{ color: theme.muted }}>
            {content.statLabel}
          </p>
        </div>
      </div>

      {content.detail ? (
        <p className="text-sm" style={{ color: theme.muted }}>
          {content.detail}
        </p>
      ) : null}

      <label className="flex cursor-pointer items-center justify-between gap-3 rounded-xl border px-3 py-3"
        style={{ borderColor: theme.border }}
      >
        <span className="text-sm font-medium">{content.toggleLabel}</span>
        <button
          type="button"
          role="switch"
          aria-checked={enabled}
          onClick={() => toggleMarketplace(content.toggleKey, card.id)}
          className="relative h-7 w-12 rounded-full transition-colors"
          style={{ background: enabled ? theme.accent : theme.border }}
        >
          <span
            className="absolute top-0.5 left-0.5 size-6 rounded-full bg-white shadow transition-transform"
            style={{ transform: enabled ? "translateX(1.25rem)" : "translateX(0)" }}
          />
        </button>
      </label>
    </div>
  );
}
