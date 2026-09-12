"use client";

import { useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useFeedEngine } from "@/context/FeedEngineContext";
import type { FeedCard } from "@/types/cardEngine";
import { cn } from "@/lib/utils";
import { CardTemplateA } from "./CardTemplateA";
import { CardTemplateB } from "./CardTemplateB";
import { CardTemplateC } from "./CardTemplateC";
import { CardTemplateD } from "./CardTemplateD";

function CardShell({
  card,
  children,
}: {
  card: FeedCard;
  children: React.ReactNode;
}) {
  const { theme, recordImpression } = useFeedEngine();

  useEffect(() => {
    recordImpression(card.id);
  }, [card.id, recordImpression]);

  return (
    <motion.article
      layout
      initial={{ opacity: 0, y: 18, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -12, scale: 0.96 }}
      transition={{ type: "spring", stiffness: 380, damping: 28 }}
      className={cn(
        "overflow-hidden rounded-2xl border p-5 shadow-sm",
        theme.glow && "shadow-[0_0_0_1px_rgba(99,102,241,0.25),0_12px_40px_rgba(99,102,241,0.12)]",
      )}
      style={{
        background: theme.surface,
        borderColor: theme.border,
        color: theme.text,
      }}
    >
      <div className="mb-3 flex items-start justify-between gap-3">
        <div>
          <p
            className="text-[11px] font-semibold uppercase tracking-[0.14em]"
            style={{ color: theme.accent }}
          >
            Template {card.template}
            {card.custom ? " · Custom" : ""}
          </p>
          <h3 className="mt-1 text-lg font-semibold leading-snug tracking-tight">
            {card.headline}
          </h3>
          {card.subtitle ? (
            <p className="mt-1 text-sm leading-relaxed" style={{ color: theme.muted }}>
              {card.subtitle}
            </p>
          ) : null}
        </div>
      </div>
      {children}
    </motion.article>
  );
}

export function FeedContainer() {
  const { rankedCards, theme, hydrated } = useFeedEngine();

  if (!hydrated) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center text-sm" style={{ color: theme.muted }}>
        Loading feed engine…
      </div>
    );
  }

  if (rankedCards.length === 0) {
    return (
      <div
        className="rounded-2xl border border-dashed p-10 text-center"
        style={{ borderColor: theme.border, color: theme.muted }}
      >
        <p className="text-base font-medium" style={{ color: theme.text }}>
          No cards in the live feed
        </p>
        <p className="mt-2 text-sm">
          Enable authoring to publish a card, disable pruning, or reset the engine.
        </p>
      </div>
    );
  }

  return (
    <motion.div layout className="flex flex-col gap-4">
      <AnimatePresence mode="popLayout">
        {rankedCards.map((card) => (
          <CardShell key={card.id} card={card}>
            {card.template === "A" ? <CardTemplateA card={card} /> : null}
            {card.template === "B" ? <CardTemplateB card={card} /> : null}
            {card.template === "C" ? <CardTemplateC card={card} /> : null}
            {card.template === "D" ? <CardTemplateD card={card} /> : null}
          </CardShell>
        ))}
      </AnimatePresence>
    </motion.div>
  );
}
