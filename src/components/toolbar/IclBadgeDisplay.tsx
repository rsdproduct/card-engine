"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useFeedEngine } from "@/context/FeedEngineContext";

const labels: Record<string, string> = {
  target_role: "target_role",
  salary_band: "salary_band",
  work_pref: "work_pref",
  urgency_tier: "urgency_tier",
  skills_focus: "skills_focus",
};

export function IclBadgeDisplay() {
  const { icl, theme } = useFeedEngine();
  const entries = Object.entries(icl) as Array<[keyof typeof icl, string | null]>;

  return (
    <div data-testid="icl-badges" className="flex flex-wrap items-center gap-2">
      <span
        className="text-[10px] font-semibold uppercase tracking-[0.16em]"
        style={{ color: theme.muted }}
      >
        ICL Live
      </span>
      <AnimatePresence mode="popLayout">
        {entries.map(([key, value]) => (
          <motion.span
            key={`${key}-${value ?? "null"}`}
            layout
            initial={{ opacity: 0, y: -6, scale: 0.92 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-medium"
            style={{
              borderColor: value ? theme.accent : theme.border,
              background: value
                ? theme.dark
                  ? "rgba(99,102,241,0.18)"
                  : `${theme.accent}14`
                : "transparent",
              color: value ? theme.text : theme.muted,
            }}
          >
            <span style={{ color: theme.muted }}>{labels[key]}</span>
            <span className="font-semibold">{value ?? "—"}</span>
          </motion.span>
        ))}
      </AnimatePresence>
    </div>
  );
}
