"use client";

import { useState, type FormEvent } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { X } from "lucide-react";
import { useFeedEngine } from "@/context/FeedEngineContext";
import type { CardTemplate, IclAttributeKey } from "@/types/cardEngine";

export function CardAuthoringDrawer() {
  const { authoringOpen, setAuthoringOpen, theme, publishCard } = useFeedEngine();
  const [template, setTemplate] = useState<CardTemplate>("A");
  const [headline, setHeadline] = useState("");
  const [subtitle, setSubtitle] = useState("");
  const [optionsText, setOptionsText] = useState("Option A, Option B, Option C");
  const [iclKey, setIclKey] = useState<IclAttributeKey>("target_role");
  const [error, setError] = useState<string | null>(null);

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (!headline.trim()) {
      setError("Headline is required.");
      return;
    }
    const options = optionsText
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
    publishCard({
      template,
      headline: headline.trim(),
      subtitle: subtitle.trim() || undefined,
      options: template === "A" ? options : undefined,
      iclKey: template === "A" ? iclKey : undefined,
    });
    setHeadline("");
    setSubtitle("");
    setError(null);
  }

  return (
    <AnimatePresence>
      {authoringOpen ? (
        <>
          <motion.button
            type="button"
            aria-label="Close authoring drawer"
            className="fixed inset-0 z-50 bg-black/45"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setAuthoringOpen(false)}
          />
          <motion.aside
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", stiffness: 320, damping: 32 }}
            className="fixed top-0 right-0 z-50 flex h-full w-full max-w-md flex-col border-l shadow-2xl"
            style={{
              background: theme.surface,
              borderColor: theme.border,
              color: theme.text,
            }}
          >
            <div className="flex items-center justify-between border-b px-5 py-4" style={{ borderColor: theme.border }}>
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.14em]" style={{ color: theme.accent }}>
                  No-Code Authoring Studio
                </p>
                <h2 className="text-lg font-semibold tracking-tight">Publish a live feed card</h2>
              </div>
              <button
                type="button"
                onClick={() => setAuthoringOpen(false)}
                className="rounded-lg p-2"
                style={{ color: theme.muted }}
              >
                <X className="size-5" />
              </button>
            </div>

            <form onSubmit={onSubmit} className="flex flex-1 flex-col gap-4 overflow-y-auto px-5 py-4">
              <label className="block text-sm">
                <span className="mb-1.5 block font-medium">Template</span>
                <select
                  value={template}
                  onChange={(e) => setTemplate(e.target.value as CardTemplate)}
                  className="w-full rounded-xl border px-3 py-2.5 text-sm outline-none"
                  style={{
                    background: theme.dark ? "#0D0F17" : "#fff",
                    borderColor: theme.border,
                    color: theme.text,
                  }}
                >
                  <option value="A">A · Micro-Action</option>
                  <option value="B">B · Quick-Stitch</option>
                  <option value="C">C · Recruiter Ping</option>
                  <option value="D">D · Digest</option>
                </select>
              </label>

              <label className="block text-sm">
                <span className="mb-1.5 block font-medium">Headline</span>
                <input
                  value={headline}
                  onChange={(e) => setHeadline(e.target.value)}
                  placeholder="e.g. What’s your next title?"
                  className="w-full rounded-xl border px-3 py-2.5 text-sm outline-none"
                  style={{
                    background: theme.dark ? "#0D0F17" : "#fff",
                    borderColor: theme.border,
                    color: theme.text,
                  }}
                />
              </label>

              <label className="block text-sm">
                <span className="mb-1.5 block font-medium">Subtitle</span>
                <textarea
                  value={subtitle}
                  onChange={(e) => setSubtitle(e.target.value)}
                  rows={3}
                  placeholder="Optional supporting copy"
                  className="w-full rounded-xl border px-3 py-2.5 text-sm outline-none"
                  style={{
                    background: theme.dark ? "#0D0F17" : "#fff",
                    borderColor: theme.border,
                    color: theme.text,
                  }}
                />
              </label>

              {template === "A" ? (
                <>
                  <label className="block text-sm">
                    <span className="mb-1.5 block font-medium">Options (comma-separated)</span>
                    <input
                      value={optionsText}
                      onChange={(e) => setOptionsText(e.target.value)}
                      className="w-full rounded-xl border px-3 py-2.5 text-sm outline-none"
                      style={{
                        background: theme.dark ? "#0D0F17" : "#fff",
                        borderColor: theme.border,
                        color: theme.text,
                      }}
                    />
                  </label>
                  <label className="block text-sm">
                    <span className="mb-1.5 block font-medium">ICL attribute</span>
                    <select
                      value={iclKey}
                      onChange={(e) => setIclKey(e.target.value as IclAttributeKey)}
                      className="w-full rounded-xl border px-3 py-2.5 text-sm outline-none"
                      style={{
                        background: theme.dark ? "#0D0F17" : "#fff",
                        borderColor: theme.border,
                        color: theme.text,
                      }}
                    >
                      <option value="target_role">target_role</option>
                      <option value="salary_band">salary_band</option>
                      <option value="work_pref">work_pref</option>
                      <option value="urgency_tier">urgency_tier</option>
                      <option value="skills_focus">skills_focus</option>
                    </select>
                  </label>
                </>
              ) : null}

              {error ? (
                <p className="text-sm" style={{ color: theme.accent }}>
                  {error}
                </p>
              ) : null}

              <button
                type="submit"
                className="mt-auto rounded-xl px-4 py-3 text-sm font-semibold text-white"
                style={{
                  background:
                    theme.id === "boldpro"
                      ? `linear-gradient(135deg, ${theme.accent}, ${theme.accentSecondary})`
                      : theme.accent,
                }}
              >
                Publish to Live Registry
              </button>
            </form>
          </motion.aside>
        </>
      ) : null}
    </AnimatePresence>
  );
}
