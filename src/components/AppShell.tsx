"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { useFeedEngine } from "@/context/FeedEngineContext";
import { ModeSwitcher } from "@/components/ModeSwitcher";
import { FeedContainer } from "@/components/feed/FeedContainer";
import { FeedbackModal } from "@/components/modals/FeedbackModal";
import { FeedbackTrigger } from "@/components/modals/FeedbackTrigger";
import { QuickStitchModal } from "@/components/modals/QuickStitchModal";
import { AuthoringStudio } from "@/components/studio/AuthoringStudio";
import { GodModeToolbar } from "@/components/toolbar/GodModeToolbar";
import { TelemetryDrawer } from "@/components/telemetry/TelemetryDrawer";
import {
  useWtfExplainer,
  WtfExplainerOverlay,
} from "@/components/explainer/WtfExplainer";

export function AppShell() {
  const { isAuthenticated, isLoading } = useAuth();
  const { theme, toast, clearToast, mode } = useFeedEngine();
  const { open, hasSeen, openExplainer, closeExplainer } = useWtfExplainer();
  const [feedbackOpen, setFeedbackOpen] = useState(false);

  useEffect(() => {
    if (!toast) return;
    const t = window.setTimeout(clearToast, 2400);
    return () => window.clearTimeout(t);
  }, [toast, clearToast]);

  if (isLoading || !isAuthenticated) {
    return <div className="min-h-screen bg-slate-950" aria-hidden />;
  }

  return (
    <div className="relative min-h-screen">
      <ModeSwitcher
        hasSeenExplainer={hasSeen}
        onOpenExplainer={openExplainer}
      />

      <AnimatePresence mode="wait">
        {mode === "studio" ? (
          <motion.div
            key="studio"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.28 }}
          >
            <AuthoringStudio />
          </motion.div>
        ) : (
          <motion.div
            key="candidate"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.28 }}
            className="pb-28 transition-colors"
            style={{
              background:
                theme.id === "boldpro"
                  ? `linear-gradient(180deg, #F8F9FD 0%, #F5F7FF 40%, #EEF0FA 100%)`
                  : theme.id === "monster"
                    ? `linear-gradient(180deg, #FFFFFF 0%, #F7F5FF 45%, #FFFFFF 100%)`
                    : theme.id === "rna"
                      ? `linear-gradient(180deg, #F8FAFC 0%, #EEF4FF 40%, #FFF7F4 100%)`
                      : `linear-gradient(180deg, #F4F7F9 0%, #EAF3F1 50%, #F4F7F9 100%)`,
              color: theme.text,
            }}
          >
            <GodModeToolbar />

            <main className="mx-auto grid max-w-6xl gap-6 px-4 py-6 lg:grid-cols-[1fr_280px]">
              <section>
                <PortalHeader />
                <div className="mt-5">
                  <FeedContainer />
                </div>
              </section>

              <aside className="hidden lg:block">
                <EngineBrief />
              </aside>
            </main>

            <QuickStitchModal />
            <TelemetryDrawer />
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {toast ? (
          <motion.div
            key={toast.id}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 8 }}
            className="fixed bottom-24 left-1/2 z-[60] -translate-x-1/2 rounded-full px-4 py-2 text-sm font-medium text-white shadow-lg"
            style={{ background: theme.accentSecondary || theme.accent }}
          >
            {toast.message}
          </motion.div>
        ) : null}
      </AnimatePresence>

      <WtfExplainerOverlay open={open} onClose={closeExplainer} />

      <FeedbackTrigger onOpen={() => setFeedbackOpen(true)} />
      <FeedbackModal
        open={feedbackOpen}
        onClose={() => setFeedbackOpen(false)}
      />
    </div>
  );
}

function PortalHeader() {
  const { theme } = useFeedEngine();
  return (
    <header
      className="overflow-hidden rounded-2xl border px-5 py-5"
      style={{
        background: theme.surface,
        borderColor: theme.border,
        boxShadow:
          theme.id === "boldpro"
            ? "0 1px 2px rgba(10,15,44,0.04), 0 8px 24px rgba(10,15,44,0.06)"
            : theme.glow
              ? "0 0 0 1px rgba(99,102,241,0.2), 0 18px 50px rgba(99,102,241,0.12)"
              : undefined,
      }}
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p
            className="text-[11px] font-semibold uppercase tracking-[0.18em]"
            style={{ color: theme.muted }}
          >
            Candidate Feed · Uniform Cards
          </p>
          <h1
            className="mt-1 text-3xl font-bold tracking-tight sm:text-4xl"
            style={{ color: theme.text }}
          >
            {theme.logoText}
          </h1>
        </div>
        <span
          className="inline-flex max-w-full items-center rounded-full px-3 py-1.5 text-xs font-semibold"
          style={{
            background:
              theme.id === "monster"
                ? theme.accentSecondary
                : theme.dark
                  ? "rgba(99,102,241,0.2)"
                  : `${theme.accent}18`,
            color:
              theme.id === "monster" ? "#111" : theme.accent,
          }}
        >
          {theme.headerBadge}
        </span>
      </div>
      <p className="mt-3 max-w-2xl text-sm leading-relaxed" style={{ color: theme.muted }}>
        Habit-forming career management for {theme.name}. Cards share one LinkedIn-style
        container and re-rank from portal, lifecycle, entry path, and ICL signals.
      </p>
    </header>
  );
}

function EngineBrief() {
  const { theme, rankedCards, portal, lifecycle, entryModifier, setMode } =
    useFeedEngine();
  return (
    <div
      className="sticky top-36 rounded-2xl border p-4"
      style={{ background: theme.surface, borderColor: theme.border }}
    >
      <p
        className="text-[11px] font-semibold uppercase tracking-[0.14em]"
        style={{ color: theme.accent }}
      >
        Live ranking brief
      </p>
      <p className="mt-2 text-sm leading-relaxed" style={{ color: theme.muted }}>
        Showing {rankedCards.length} cards for{" "}
        <strong style={{ color: theme.text }}>{theme.shortName}</strong>,{" "}
        <strong style={{ color: theme.text }}>{lifecycle.replaceAll("_", " ")}</strong>,{" "}
        <strong style={{ color: theme.text }}>{entryModifier.replaceAll("_", " ")}</strong>.
      </p>
      <ol className="mt-4 space-y-2 text-xs" style={{ color: theme.muted }}>
        {rankedCards.slice(0, 5).map((card, i) => (
          <li key={card.id} className="flex gap-2">
            <span className="font-semibold" style={{ color: theme.text }}>
              {i + 1}.
            </span>
            <span>
              {card.id} · T{card.template}
            </span>
          </li>
        ))}
      </ol>
      <button
        type="button"
        onClick={() => setMode("studio")}
        className="mt-4 w-full rounded-xl border px-3 py-2 text-xs font-semibold"
        style={{ borderColor: theme.border, color: theme.text }}
      >
        Open PM Authoring Studio
      </button>
      <p className="mt-3 text-[11px]" style={{ color: theme.muted }}>
        Portal id: {portal}
      </p>
    </div>
  );
}
