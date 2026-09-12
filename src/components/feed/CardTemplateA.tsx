"use client";

import { motion } from "framer-motion";
import { useFeedEngine } from "@/context/FeedEngineContext";
import type { CardTemplateAContent, FeedCard } from "@/types/cardEngine";
import { cn } from "@/lib/utils";

export function CardTemplateA({ card }: { card: FeedCard }) {
  const { theme, icl, selectOption } = useFeedEngine();
  const content = card.content as CardTemplateAContent;
  const selected = icl[content.iclKey];

  return (
    <div className="flex flex-wrap gap-2">
      {content.options.map((option) => {
        const isActive = selected === option.value;
        return (
          <motion.button
            key={option.id}
            type="button"
            whileTap={{ scale: 0.96 }}
            onClick={() => selectOption(card.id, option.value, content.iclKey)}
            className={cn(
              "rounded-full border px-3.5 py-2 text-sm font-medium transition-colors",
              isActive ? "text-white" : "",
            )}
            style={{
              borderColor: isActive ? theme.accent : theme.border,
              background: isActive ? theme.accent : "transparent",
              color: isActive ? "#fff" : theme.text,
            }}
          >
            {option.label}
          </motion.button>
        );
      })}
    </div>
  );
}
