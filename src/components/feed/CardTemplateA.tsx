"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useFeedEngine } from "@/context/FeedEngineContext";
import type { CardTemplateAContent, FeedCard } from "@/types/cardEngine";
import { cn } from "@/lib/utils";

export function CardTemplateA({ card }: { card: FeedCard }) {
  const { theme, icl, selectOption, answerMultiStep, multiStepProgress } =
    useFeedEngine();
  const content = card.content as CardTemplateAContent;

  const steps = content.steps;
  const isMulti = Boolean(steps && steps.length > 1);
  const stepIndex = multiStepProgress[card.id] ?? 0;
  const done = isMulti && stepIndex >= (steps?.length ?? 0);

  if (isMulti && steps) {
    if (done) {
      return (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-xl border px-3 py-3 text-sm"
          style={{ borderColor: theme.border, color: theme.muted }}
        >
          Profile signals saved. Feed ranking updated from your answers.
        </motion.div>
      );
    }

    const step = steps[Math.min(stepIndex, steps.length - 1)];
    return (
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          {steps.map((_, i) => (
            <span
              key={i}
              className="h-1.5 flex-1 rounded-full transition-colors"
              style={{
                background: i <= stepIndex ? theme.accent : theme.border,
              }}
            />
          ))}
        </div>
        <AnimatePresence mode="wait">
          <motion.div
            key={step.id}
            initial={{ opacity: 0, x: 24 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -24 }}
            transition={{ type: "spring", stiffness: 380, damping: 30 }}
          >
            <p className="mb-3 text-sm font-medium">
              {step.prompt}
              <span className="ml-2 text-[11px] font-normal" style={{ color: theme.muted }}>
                Q{stepIndex + 1} of {steps.length}
              </span>
            </p>
            <div className="flex flex-wrap gap-2">
              {step.options.map((option) => {
                const isActive = icl[step.iclKey] === option.value;
                return (
                  <motion.button
                    key={option.id}
                    type="button"
                    whileTap={{ scale: 0.96 }}
                    onClick={() =>
                      answerMultiStep(
                        card.id,
                        stepIndex,
                        option.value,
                        step.iclKey,
                        steps.length,
                      )
                    }
                    className={cn(
                      "rounded-full border px-3.5 py-2 text-sm font-medium transition-colors",
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
          </motion.div>
        </AnimatePresence>
      </div>
    );
  }

  const options = content.options ?? [];
  const iclKey = content.iclKey ?? "target_role";
  const selected = icl[iclKey];

  return (
    <div className="flex flex-wrap gap-2">
      {options.map((option) => {
        const isActive = selected === option.value;
        return (
          <motion.button
            key={option.id}
            type="button"
            whileTap={{ scale: 0.96 }}
            onClick={() => selectOption(card.id, option.value, iclKey)}
            className={cn(
              "rounded-full border px-3.5 py-2 text-sm font-medium transition-colors",
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
