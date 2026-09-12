"use client";

import { Sparkles } from "lucide-react";
import { useFeedEngine } from "@/context/FeedEngineContext";
import type { CardTemplateBContent, FeedCard } from "@/types/cardEngine";

export function CardTemplateB({ card }: { card: FeedCard }) {
  const { theme, openQuickStitch } = useFeedEngine();
  const content = card.content as CardTemplateBContent;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        {typeof content.matchScore === "number" ? (
          <span
            className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold"
            style={{
              background: theme.dark ? "rgba(99,102,241,0.2)" : `${theme.accent}18`,
              color: theme.accentSecondary || theme.accent,
            }}
          >
            <Sparkles className="size-3.5" />
            {content.matchScore}% Match
            {content.matchLabel ? `: ${content.matchLabel}` : ""}
          </span>
        ) : null}
        {typeof content.healthScore === "number" ? (
          <span
            className="inline-flex rounded-full px-3 py-1 text-xs font-semibold"
            style={{
              background: `${theme.accent}18`,
              color: theme.accent,
            }}
          >
            ATS Health {content.healthScore}%
          </span>
        ) : null}
      </div>

      {content.missingKeywords?.length ? (
        <div className="flex flex-wrap gap-2">
          {content.missingKeywords.map((kw) => (
            <span
              key={kw}
              className="rounded-md border px-2.5 py-1 font-mono text-xs"
              style={{ borderColor: theme.border, color: theme.muted }}
            >
              [{kw}]
            </span>
          ))}
        </div>
      ) : null}

      {content.blockers?.length ? (
        <ul className="space-y-1 text-sm" style={{ color: theme.muted }}>
          {content.blockers.map((b) => (
            <li key={b}>• {b}</li>
          ))}
        </ul>
      ) : null}

      <button
        type="button"
        onClick={() => openQuickStitch(card.id)}
        className="inline-flex items-center justify-center rounded-xl px-4 py-2.5 text-sm font-semibold text-white transition hover:opacity-90"
        style={{
          background:
            theme.id === "boldpro"
              ? `linear-gradient(135deg, ${theme.accent}, ${theme.accentSecondary})`
              : theme.accent,
        }}
      >
        {content.ctaLabel}
      </button>
    </div>
  );
}
