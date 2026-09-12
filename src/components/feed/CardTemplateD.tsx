"use client";

import { ArrowUpRight } from "lucide-react";
import { useFeedEngine } from "@/context/FeedEngineContext";
import type { CardTemplateDContent, FeedCard } from "@/types/cardEngine";

export function CardTemplateD({ card }: { card: FeedCard }) {
  const { theme, boostVisibility } = useFeedEngine();
  const content = card.content as CardTemplateDContent;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-3">
        {content.metrics.map((metric) => (
          <div
            key={metric.label}
            className="rounded-xl border px-3 py-3 text-center"
            style={{ borderColor: theme.border }}
          >
            <p className="text-xl font-semibold tracking-tight">{metric.value}</p>
            <p className="mt-1 text-[11px] leading-tight" style={{ color: theme.muted }}>
              {metric.label}
            </p>
          </div>
        ))}
      </div>

      <div>
        <div className="mb-1.5 flex items-center justify-between text-xs" style={{ color: theme.muted }}>
          <span>{content.progressLabel}</span>
          <span>{content.progressValue}%</span>
        </div>
        <div
          className="h-2 overflow-hidden rounded-full"
          style={{ background: theme.dark ? "rgba(255,255,255,0.08)" : "#E8EEF2" }}
        >
          <div
            className="h-full rounded-full transition-all"
            style={{
              width: `${content.progressValue}%`,
              background:
                theme.id === "boldpro"
                  ? `linear-gradient(90deg, ${theme.accent}, ${theme.accentSecondary})`
                  : theme.accent,
            }}
          />
        </div>
      </div>

      <button
        type="button"
        onClick={() => boostVisibility(card.id)}
        className="inline-flex items-center gap-1 text-sm font-semibold"
        style={{ color: theme.accent }}
      >
        {content.ctaLabel}
        <ArrowUpRight className="size-4" />
      </button>
    </div>
  );
}
