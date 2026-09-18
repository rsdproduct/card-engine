"use client";

import { AnimatePresence, motion } from "framer-motion";
import { CheckCircle2, ExternalLink, Loader2, X } from "lucide-react";
import { useEffect, useId, useState, type FormEvent } from "react";
import { useFeedEngine } from "@/context/FeedEngineContext";
import { createFeedbackId, submitFeedback } from "@/lib/feedback";
import {
  FEEDBACK_SHEET_VIEW_URL,
  type RoadmapTiming,
} from "@/types/feedback";

type SubmitPhase = "idle" | "submitting" | "success" | "local_only";

const TIMING_OPTIONS: { value: RoadmapTiming; label: string; hint: string }[] =
  [
    {
      value: "must_have_mvp",
      label: "Must-have for MVP",
      hint: "Ship this in the first release",
    },
    {
      value: "future_vision",
      label: "Future vision",
      hint: "Important later, not blocking MVP",
    },
  ];

export function FeedbackModal({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const { theme } = useFeedEngine();
  const titleId = useId();
  const authorId = useId();
  const feedbackId = useId();
  const cardIdeaId = useId();

  const [author, setAuthor] = useState("");
  const [feedback, setFeedback] = useState("");
  const [cardIdea, setCardIdea] = useState("");
  const [timing, setTiming] = useState<RoadmapTiming>("must_have_mvp");
  const [phase, setPhase] = useState<SubmitPhase>("idle");
  const [formError, setFormError] = useState<string | null>(null);
  const [localNote, setLocalNote] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setPhase("idle");
    setFormError(null);
    setLocalNote(null);
  }, [open]);

  useEffect(() => {
    if (phase !== "success" && phase !== "local_only") return;
    const t = window.setTimeout(() => {
      resetAndClose();
    }, 2500);
    return () => window.clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- close once per success phase
  }, [phase]);

  function resetAndClose() {
    setAuthor("");
    setFeedback("");
    setCardIdea("");
    setTiming("must_have_mvp");
    setPhase("idle");
    setFormError(null);
    setLocalNote(null);
    onClose();
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (phase === "submitting" || phase === "success" || phase === "local_only") {
      return;
    }

    const trimmedAuthor = author.trim();
    const trimmedFeedback = feedback.trim();
    if (!trimmedAuthor) {
      setFormError("Add your name so the team can follow up.");
      return;
    }
    if (!trimmedFeedback) {
      setFormError("Tell us what you noticed — open-format feedback is required.");
      return;
    }

    setFormError(null);
    setPhase("submitting");

    const entry = {
      id: createFeedbackId(),
      timestamp: new Date().toISOString(),
      author: trimmedAuthor,
      feedback: trimmedFeedback,
      cardIdea: cardIdea.trim() || undefined,
      timing,
    };

    const result = await submitFeedback(entry);

    if (result.status === "sent") {
      setPhase("success");
      return;
    }

    setLocalNote(
      "Couldn’t reach the live sheet — your note is saved in this browser’s feedback log.",
    );
    setPhase("local_only");
  }

  const inputStyle = {
    background: theme.id === "boldpro" ? "#F8F9FD" : theme.background,
    borderColor: theme.border,
    color: theme.text,
  } as const;

  const showForm = phase === "idle" || phase === "submitting";

  return (
    <AnimatePresence>
      {open ? (
        <motion.div
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 p-3 sm:items-center sm:p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={() => {
            if (phase === "submitting") return;
            resetAndClose();
          }}
        >
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-labelledby={titleId}
            data-testid="feedback-modal"
            initial={{ opacity: 0, y: 24, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 16, scale: 0.98 }}
            transition={{ type: "spring", stiffness: 360, damping: 28 }}
            className="flex max-h-[min(92vh,720px)] w-full max-w-lg flex-col overflow-hidden rounded-2xl border shadow-2xl"
            style={{
              background: theme.surface,
              borderColor: theme.border,
              color: theme.text,
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex shrink-0 items-start justify-between gap-3 border-b px-4 py-4 sm:px-5"
              style={{ borderColor: theme.border }}
            >
              <div className="min-w-0">
                <p
                  className="text-[11px] font-semibold uppercase tracking-[0.14em]"
                  style={{ color: theme.accent }}
                >
                  Open-format · Live log
                </p>
                <h2
                  id={titleId}
                  className="mt-1 font-display text-xl font-semibold tracking-tight sm:text-2xl"
                >
                  Share Feedback
                </h2>
                <p className="mt-1 text-sm leading-snug" style={{ color: theme.muted }}>
                  Capture ideas, friction, and card concepts for the collection log.
                </p>
                <a
                  href={FEEDBACK_SHEET_VIEW_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  data-testid="feedback-sheet-link"
                  className="mt-2 inline-flex items-center gap-1 text-sm font-semibold transition hover:opacity-80"
                  style={{ color: theme.accent }}
                >
                  View Feedback Collection Log
                  <ExternalLink className="size-3.5" aria-hidden />
                  <span aria-hidden>↗</span>
                </a>
              </div>
              <button
                type="button"
                aria-label="Close"
                disabled={phase === "submitting"}
                onClick={resetAndClose}
                className="rounded-lg p-2 transition hover:opacity-70 disabled:opacity-40"
                style={{ color: theme.muted }}
              >
                <X className="size-5" />
              </button>
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4 sm:px-5">
              {showForm ? (
                <form
                  id="feedback-form"
                  onSubmit={onSubmit}
                  className="space-y-4"
                  noValidate
                >
                  <div>
                    <label
                      htmlFor={authorId}
                      className="text-xs font-semibold uppercase tracking-[0.08em]"
                      style={{ color: theme.muted }}
                    >
                      Your name
                    </label>
                    <input
                      id={authorId}
                      data-testid="feedback-author"
                      type="text"
                      autoComplete="name"
                      value={author}
                      onChange={(e) => setAuthor(e.target.value)}
                      disabled={phase === "submitting"}
                      placeholder="e.g. Alex from Product"
                      className="mt-1.5 w-full rounded-xl border px-3 py-2.5 text-sm outline-none focus-visible:ring-2 disabled:opacity-60"
                      style={inputStyle}
                    />
                  </div>

                  <div>
                    <label
                      htmlFor={feedbackId}
                      className="text-xs font-semibold uppercase tracking-[0.08em]"
                      style={{ color: theme.muted }}
                    >
                      Feedback
                    </label>
                    <textarea
                      id={feedbackId}
                      data-testid="feedback-body"
                      value={feedback}
                      onChange={(e) => setFeedback(e.target.value)}
                      disabled={phase === "submitting"}
                      rows={4}
                      placeholder="What worked, what felt off, what you’d change…"
                      className="mt-1.5 w-full resize-y rounded-xl border px-3 py-2.5 text-sm leading-relaxed outline-none focus-visible:ring-2 disabled:opacity-60"
                      style={inputStyle}
                    />
                  </div>

                  <div>
                    <label
                      htmlFor={cardIdeaId}
                      className="text-xs font-semibold uppercase tracking-[0.08em]"
                      style={{ color: theme.muted }}
                    >
                      Card idea{" "}
                      <span className="font-normal normal-case tracking-normal">
                        (optional)
                      </span>
                    </label>
                    <input
                      id={cardIdeaId}
                      data-testid="feedback-card-idea"
                      type="text"
                      value={cardIdea}
                      onChange={(e) => setCardIdea(e.target.value)}
                      disabled={phase === "submitting"}
                      placeholder="A card concept or template tweak"
                      className="mt-1.5 w-full rounded-xl border px-3 py-2.5 text-sm outline-none focus-visible:ring-2 disabled:opacity-60"
                      style={inputStyle}
                    />
                  </div>

                  <fieldset>
                    <legend
                      className="text-xs font-semibold uppercase tracking-[0.08em]"
                      style={{ color: theme.muted }}
                    >
                      Roadmap timing
                    </legend>
                    <div
                      className="mt-2 grid gap-2 sm:grid-cols-2"
                      role="radiogroup"
                      aria-label="Roadmap timing"
                      data-testid="feedback-timing"
                    >
                      {TIMING_OPTIONS.map((opt) => {
                        const selected = timing === opt.value;
                        return (
                          <button
                            key={opt.value}
                            type="button"
                            role="radio"
                            aria-checked={selected}
                            data-testid={`feedback-timing-${opt.value}`}
                            disabled={phase === "submitting"}
                            onClick={() => setTiming(opt.value)}
                            className="rounded-xl border px-3 py-2.5 text-left transition disabled:opacity-60"
                            style={{
                              borderColor: selected ? theme.accent : theme.border,
                              background: selected
                                ? `${theme.accent}14`
                                : theme.surface,
                              boxShadow: selected
                                ? `inset 0 0 0 1px ${theme.accent}`
                                : undefined,
                            }}
                          >
                            <span className="block text-sm font-semibold">
                              {opt.label}
                            </span>
                            <span
                              className="mt-0.5 block text-xs leading-snug"
                              style={{ color: theme.muted }}
                            >
                              {opt.hint}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </fieldset>

                  {formError ? (
                    <p
                      role="alert"
                      data-testid="feedback-form-error"
                      className="rounded-xl px-3 py-2 text-sm"
                      style={{
                        background: "rgba(220, 38, 38, 0.08)",
                        color: "#B91C1C",
                      }}
                    >
                      {formError}
                    </p>
                  ) : null}
                </form>
              ) : (
                <div
                  className="flex flex-col items-center justify-center gap-3 py-10 text-center"
                  data-testid={
                    phase === "success"
                      ? "feedback-success"
                      : "feedback-local-only"
                  }
                >
                  <CheckCircle2
                    className="size-12"
                    style={{
                      color:
                        phase === "success" ? theme.accent : theme.accentSecondary,
                    }}
                    aria-hidden
                  />
                  <p className="font-display text-lg font-semibold tracking-tight">
                    {phase === "success"
                      ? "Sent to the collection log"
                      : "Saved to your local log"}
                  </p>
                  <p
                    className="max-w-sm text-sm leading-relaxed"
                    style={{ color: theme.muted }}
                  >
                    {phase === "success"
                      ? "Thanks — closing in a moment."
                      : localNote}
                  </p>
                </div>
              )}
            </div>

            {showForm ? (
              <div
                className="shrink-0 border-t px-4 py-4 sm:px-5"
                style={{ borderColor: theme.border }}
              >
                <button
                  type="submit"
                  form="feedback-form"
                  data-testid="feedback-submit"
                  disabled={phase === "submitting"}
                  className="inline-flex w-full items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-semibold text-white transition hover:opacity-90 disabled:cursor-wait disabled:opacity-80"
                  style={{
                    background:
                      theme.id === "boldpro"
                        ? `linear-gradient(135deg, ${theme.accent}, ${theme.accentSecondary})`
                        : theme.accent,
                  }}
                >
                  {phase === "submitting" ? (
                    <>
                      <Loader2 className="size-4 animate-spin" aria-hidden />
                      Sending…
                    </>
                  ) : (
                    "Send to feedback collection log 🚀"
                  )}
                </button>
              </div>
            ) : null}
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
