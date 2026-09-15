"use client";

import { useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useFeedEngine } from "@/context/FeedEngineContext";
import type { FeedCard } from "@/types/cardEngine";
import { GRADIENT_FALLBACK } from "@/data/imagePresets";
import { cn } from "@/lib/utils";
import { CardTemplateA } from "./CardTemplateA";
import { CardTemplateB } from "./CardTemplateB";
import { CardTemplateC } from "./CardTemplateC";
import { CardTemplateD } from "./CardTemplateD";

function displayHeadline(card: FeedCard) {
  if (card.activeVariant === "B" && card.headlineVariantB) {
    return card.headlineVariantB;
  }
  return card.headline;
}

export function UniformCard({ card }: { card: FeedCard }) {
  const { theme, recordImpression } = useFeedEngine();

  useEffect(() => {
    recordImpression(card.id);
  }, [card.id, recordImpression]);

  const headline = displayHeadline(card);
  const hasImage = Boolean(card.headerImage);

  return (
    <motion.article
      layout
      data-testid="feed-card"
      data-card-id={card.id}
      initial={{ opacity: 0, y: 18, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -12, scale: 0.96 }}
      transition={{ type: "spring", stiffness: 380, damping: 28 }}
      className={cn(
        "overflow-hidden rounded-2xl border shadow-sm",
        theme.id === "boldpro" &&
          "shadow-[0_1px_2px_rgba(10,15,44,0.04),0_8px_24px_rgba(10,15,44,0.06)]",
        theme.glow &&
          "shadow-[0_0_0_1px_rgba(99,102,241,0.25),0_12px_40px_rgba(99,102,241,0.12)]",
      )}
      style={{
        background: theme.surface,
        borderColor: theme.border,
        color: theme.text,
      }}
    >
      {/* Header: brand badge + timestamp */}
      <div className="flex items-center justify-between gap-3 px-4 pt-4 pb-3">
        <div className="flex min-w-0 items-center gap-2.5">
          <span
            className="flex size-9 shrink-0 items-center justify-center rounded-full text-[11px] font-bold tracking-tight text-white"
            style={{
              background:
                theme.id === "boldpro"
                  ? `linear-gradient(135deg, ${theme.accent}, ${theme.accentSecondary})`
                  : theme.accent,
            }}
          >
            {(card.brandTag ?? theme.shortName).slice(0, 2).toUpperCase()}
          </span>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold tracking-tight">
              {card.brandTag ?? theme.name}
            </p>
            <p className="text-[11px]" style={{ color: theme.muted }}>
              Type {card.template}
              {card.custom ? " · Campaign" : ""}
              {card.activeVariant ? ` · Variant ${card.activeVariant}` : ""}
            </p>
          </div>
        </div>
        <span className="shrink-0 text-[11px] font-medium" style={{ color: theme.muted }}>
          {card.timestampLabel ?? "Today"}
        </span>
      </div>

      {/* Media: fixed 160px */}
      <div
        className="relative h-[160px] w-full overflow-hidden"
        style={{
          background: hasImage ? undefined : GRADIENT_FALLBACK,
        }}
      >
        {hasImage ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={card.headerImage}
            alt=""
            className="h-full w-full object-cover"
          />
        ) : (
          <div
            className="flex h-full w-full items-end p-4"
            style={{
              background:
                theme.id === "boldpro"
                  ? `linear-gradient(135deg, ${theme.accent}, ${theme.accentSecondary})`
                  : theme.id === "monster"
                    ? `linear-gradient(135deg, #6E44FF, #1A1A1A)`
                    : theme.id === "rna"
                      ? `linear-gradient(135deg, #0066FF, #FF5A36)`
                      : GRADIENT_FALLBACK,
            }}
          >
            <p className="text-sm font-semibold text-white/90">
              {card.campaignName ?? "Daily Feed"}
            </p>
          </div>
        )}
      </div>

      {/* Body */}
      <div className="px-4 pt-4 pb-2">
        <h3 className="text-[17px] font-semibold leading-snug tracking-tight">
          {headline}
        </h3>
        {card.subtitle ? (
          <p className="mt-1.5 text-sm leading-relaxed" style={{ color: theme.muted }}>
            {card.subtitle}
          </p>
        ) : null}
      </div>

      {/* Interactive area */}
      <div className="px-4 pb-3">
        {card.template === "A" ? <CardTemplateA card={card} /> : null}
        {card.template === "B" ? <CardTemplateB card={card} /> : null}
        {card.template === "C" ? <CardTemplateC card={card} /> : null}
        {card.template === "D" ? <CardTemplateD card={card} /> : null}
      </div>
    </motion.article>
  );
}

export function FeedContainer() {
  const { rankedCards, theme, hydrated } = useFeedEngine();

  if (!hydrated) {
    return (
      <div
        className="flex min-h-[40vh] items-center justify-center text-sm"
        style={{ color: theme.muted }}
      >
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
          Open PM Authoring Studio to publish a campaign, disable pruning, or reset
          the engine.
        </p>
      </div>
    );
  }

  return (
    <motion.div
      layout
      data-testid="candidate-feed"
      className="mx-auto flex max-w-xl flex-col gap-4"
    >
      <AnimatePresence mode="popLayout">
        {rankedCards.map((card) => (
          <UniformCard key={card.id} card={card} />
        ))}
      </AnimatePresence>
    </motion.div>
  );
}
