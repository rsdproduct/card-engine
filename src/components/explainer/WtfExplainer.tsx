"use client";

import {
  AnimatePresence,
  motion,
  type PanInfo,
  useReducedMotion,
} from "framer-motion";
import {
  BookOpen,
  ChevronLeft,
  ChevronRight,
  Lightbulb,
  X,
} from "lucide-react";
import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type RefObject,
} from "react";
import { useFeedEngine } from "@/context/FeedEngineContext";
import { cn } from "@/lib/utils";
import {
  EXPLAINER_STORAGE_KEY,
  explainerSteps,
  type ExplainerStep,
} from "./explainerSteps";

type Tab = "guide" | "glossary";

type SpotlightRect = {
  top: number;
  left: number;
  width: number;
  height: number;
};

type TooltipPlacement = {
  top?: number;
  bottom?: number;
  left: number;
  width: number;
  pinned: boolean;
  placement: "above" | "below" | "pinned" | "center";
  beam?: { x1: number; y1: number; x2: number; y2: number };
};

const DESKTOP_MQ = "(min-width: 1024px)";
const PAD = 8;
const EDGE_MARGIN = 16;
const FLIP_MARGIN = 30;
const COMPACT_VIEWPORT_H = 800;
const SCROLL_SETTLE_MS = 250;
const PREPARE_DELAY_MS = 80;
const DEFAULT_CARD_H = 320;
const DEFAULT_CARD_W = 400;

function readHasSeen(): boolean {
  if (typeof window === "undefined") return false;
  try {
    return localStorage.getItem(EXPLAINER_STORAGE_KEY) === "1";
  } catch {
    return false;
  }
}

function markSeen() {
  try {
    localStorage.setItem(EXPLAINER_STORAGE_KEY, "1");
  } catch {
    // ignore quota / private mode
  }
}

function measureTarget(testId: string): SpotlightRect | null {
  const el = document.querySelector(`[data-testid="${testId}"]`);
  if (!el) return null;
  const r = el.getBoundingClientRect();
  if (r.width < 2 && r.height < 2) return null;
  return {
    top: Math.max(0, r.top - PAD),
    left: Math.max(0, r.left - PAD),
    width: Math.min(window.innerWidth - Math.max(0, r.left - PAD), r.width + PAD * 2),
    height: Math.min(
      window.innerHeight - Math.max(0, r.top - PAD),
      r.height + PAD * 2,
    ),
  };
}

function waitForScrollSettle(ms: number, reduceMotion: boolean): Promise<void> {
  return new Promise((resolve) => {
    if (reduceMotion) {
      window.setTimeout(resolve, 40);
      return;
    }
    let settled: number | null = null;
    let done = false;
    const finish = () => {
      if (done) return;
      done = true;
      window.removeEventListener("scroll", onScroll, true);
      if (settled !== null) window.clearTimeout(settled);
      resolve();
    };
    const onScroll = () => {
      if (settled !== null) window.clearTimeout(settled);
      settled = window.setTimeout(finish, ms);
    };
    window.addEventListener("scroll", onScroll, true);
    settled = window.setTimeout(finish, ms);
  });
}

function pinnedCardBox(cardW: number) {
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  const width = Math.min(cardW, 380, vw - EDGE_MARGIN * 2);
  const left = Math.max(
    EDGE_MARGIN,
    Math.min((vw - width) / 2, vw - width - EDGE_MARGIN),
  );
  // Anchor to bottom so height growth never clips controls.
  return { bottom: EDGE_MARGIN, left, width };
}

function pinnedFallbackPlacement(
  cardW: number,
  target?: SpotlightRect | null,
): TooltipPlacement {
  const box = pinnedCardBox(cardW);
  const beam = target
    ? {
        x1: box.left + box.width / 2,
        y1: window.innerHeight - EDGE_MARGIN,
        x2: target.left + target.width / 2,
        y2: target.top + target.height / 2,
      }
    : undefined;
  return {
    bottom: box.bottom,
    left: box.left,
    width: box.width,
    pinned: true,
    placement: "pinned",
    beam,
  };
}

function centerClampPlacement(cardH: number, cardW: number): TooltipPlacement {
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  const width = Math.min(cardW, 420, vw - EDGE_MARGIN * 2);
  const maxCardH = Math.min(cardH, vh * 0.85, vh - EDGE_MARGIN * 2);
  return {
    top: Math.max(EDGE_MARGIN, (vh - maxCardH) / 2),
    left: Math.max(EDGE_MARGIN, (vw - width) / 2),
    width,
    pinned: false,
    placement: "center",
  };
}

function computeTooltipPlacement(
  rect: SpotlightRect,
  cardH: number,
  cardW: number,
): TooltipPlacement {
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  const width = Math.min(cardW, vw - EDGE_MARGIN * 2);
  const maxCardH = Math.min(cardH, vh * 0.85, vh - EDGE_MARGIN * 2);
  const targetCenterX = rect.left + rect.width / 2;
  const targetCenterY = rect.top + rect.height / 2;

  // Compact laptop / short viewport: pin card so controls never clip
  if (vh < COMPACT_VIEWPORT_H) {
    return pinnedFallbackPlacement(cardW, rect);
  }

  const spaceBelow = vh - (rect.top + rect.height) - FLIP_MARGIN;
  const spaceAbove = rect.top - FLIP_MARGIN;
  const needs = maxCardH + 12;

  let placement: "above" | "below" = "below";
  if (spaceBelow >= needs) {
    placement = "below";
  } else if (spaceAbove >= needs) {
    placement = "above";
  } else {
    placement = spaceBelow >= spaceAbove ? "below" : "above";
  }

  let top =
    placement === "below"
      ? rect.top + rect.height + 12
      : rect.top - 12 - maxCardH;

  top = Math.max(EDGE_MARGIN, Math.min(top, vh - maxCardH - EDGE_MARGIN));

  let left = targetCenterX - width / 2;
  left = Math.max(EDGE_MARGIN, Math.min(left, vw - width - EDGE_MARGIN));

  return {
    top,
    left,
    width,
    pinned: false,
    placement,
  };
}

async function waitForTarget(
  testId: string,
  attempts = 12,
  delayMs = 80,
): Promise<Element | null> {
  for (let i = 0; i < attempts; i++) {
    const el = document.querySelector(`[data-testid="${testId}"]`);
    if (el) {
      const r = el.getBoundingClientRect();
      if (r.width >= 2 && r.height >= 2) return el;
    }
    await new Promise((resolve) => window.setTimeout(resolve, delayMs));
  }
  return document.querySelector(`[data-testid="${testId}"]`);
}

export function WtfExplainerTrigger({
  hasSeen,
  onOpen,
}: {
  hasSeen: boolean;
  onOpen: () => void;
}) {
  return (
    <button
      type="button"
      data-testid="wtf-explainer-trigger"
      title="Interactive Prototype Walkthrough & Architecture Guide"
      aria-label="How this works: interactive walkthrough"
      onClick={onOpen}
      className={cn(
        "relative inline-flex items-center gap-1.5 rounded-lg border border-white/20 bg-white/10 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-white/15",
        !hasSeen && "wtf-pulse-invite",
      )}
    >
      {!hasSeen ? (
        <span
          aria-hidden
          className="absolute -top-1 -right-1 size-2.5 rounded-full bg-[#5EEAD4] shadow-[0_0_10px_#5EEAD4]"
        />
      ) : null}
      <Lightbulb className="size-3.5 text-[#5EEAD4]" />
      <span className="hidden sm:inline">How this works</span>
      <span className="sm:hidden">Help</span>
    </button>
  );
}

export function useWtfExplainer() {
  const [open, setOpen] = useState(false);
  const [hasSeen, setHasSeen] = useState(true);

  useEffect(() => {
    setHasSeen(readHasSeen());
  }, []);

  const openExplainer = useCallback(() => {
    setOpen(true);
    markSeen();
    setHasSeen(true);
  }, []);

  const closeExplainer = useCallback(() => setOpen(false), []);

  return { open, hasSeen, openExplainer, closeExplainer };
}

export function WtfExplainerOverlay({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const { setMode, setTelemetryOpen, theme } = useFeedEngine();
  const reduceMotion = useReducedMotion();
  const [stepIndex, setStepIndex] = useState(0);
  const [tab, setTab] = useState<Tab>("guide");
  const [isDesktop, setIsDesktop] = useState(false);
  const [rect, setRect] = useState<SpotlightRect | null>(null);
  const [placement, setPlacement] = useState<TooltipPlacement | null>(null);
  const cardRef = useRef<HTMLDivElement | null>(null);
  const measureGen = useRef(0);

  const step = explainerSteps[stepIndex]!;
  const total = explainerSteps.length;

  useEffect(() => {
    const mq = window.matchMedia(DESKTOP_MQ);
    const sync = () => setIsDesktop(mq.matches);
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);

  const prepareStep = useCallback(
    (s: ExplainerStep) => {
      setMode(s.mode);
      if (s.openTelemetry) {
        setTelemetryOpen(true);
      } else if (s.mode === "candidate") {
        setTelemetryOpen(false);
      }
    },
    [setMode, setTelemetryOpen],
  );

  useEffect(() => {
    if (!open) return;
    prepareStep(step);
  }, [open, step, prepareStep]);

  const measureAndPlace = useCallback(async () => {
    if (!open || !isDesktop || tab !== "guide") {
      setRect(null);
      setPlacement(null);
      return;
    }

    const gen = ++measureGen.current;
    const estimateH =
      cardRef.current?.getBoundingClientRect().height || DEFAULT_CARD_H;
    const estimateW =
      cardRef.current?.getBoundingClientRect().width ||
      Math.min(DEFAULT_CARD_W, window.innerWidth - 32);

    // Safe interim placement while the target mounts (mode switches).
    setPlacement(
      window.innerHeight < COMPACT_VIEWPORT_H
        ? pinnedFallbackPlacement(estimateW)
        : centerClampPlacement(estimateH, estimateW),
    );

    const el = await waitForTarget(step.targetTestId);
    if (gen !== measureGen.current) return;

    if (el) {
      el.scrollIntoView({
        behavior: reduceMotion ? "auto" : "smooth",
        block: "center",
        inline: "nearest",
      });
      await waitForScrollSettle(SCROLL_SETTLE_MS, !!reduceMotion);
    }
    if (gen !== measureGen.current) return;

    const target = measureTarget(step.targetTestId);
    setRect(target);
    if (!target) {
      setPlacement(
        window.innerHeight < COMPACT_VIEWPORT_H
          ? pinnedFallbackPlacement(estimateW)
          : centerClampPlacement(estimateH, estimateW),
      );
      return;
    }

    const first = computeTooltipPlacement(target, estimateH, estimateW);
    setPlacement(first);

    requestAnimationFrame(() => {
      if (gen !== measureGen.current) return;
      const measuredH =
        cardRef.current?.getBoundingClientRect().height || estimateH;
      const measuredW =
        cardRef.current?.getBoundingClientRect().width || estimateW;
      const refreshed = measureTarget(step.targetTestId) ?? target;
      setRect(refreshed);
      setPlacement(computeTooltipPlacement(refreshed, measuredH, measuredW));
    });
  }, [open, isDesktop, tab, step.targetTestId, reduceMotion]);

  useLayoutEffect(() => {
    if (!open) return;
    const t = window.setTimeout(() => {
      void measureAndPlace();
    }, PREPARE_DELAY_MS);
    return () => {
      window.clearTimeout(t);
      measureGen.current += 1;
    };
  }, [open, stepIndex, tab, isDesktop, measureAndPlace]);

  useEffect(() => {
    if (!open || !isDesktop) return;
    const onResize = () => {
      void measureAndPlace();
    };
    window.addEventListener("resize", onResize);
    return () => {
      window.removeEventListener("resize", onResize);
    };
  }, [open, isDesktop, measureAndPlace]);

  const goTo = useCallback(
    (index: number) => {
      const next = Math.max(0, Math.min(total - 1, index));
      setStepIndex(next);
      setTab("guide");
      prepareStep(explainerSteps[next]!);
    },
    [total, prepareStep],
  );

  const next = useCallback(() => goTo(stepIndex + 1), [goTo, stepIndex]);
  const prev = useCallback(() => goTo(stepIndex - 1), [goTo, stepIndex]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        onClose();
        return;
      }
      if (tab !== "guide") return;
      if (e.key === "ArrowRight") {
        e.preventDefault();
        next();
      } else if (e.key === "ArrowLeft") {
        e.preventDefault();
        prev();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose, next, prev, tab]);

  useEffect(() => {
    if (!open) return;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prevOverflow;
    };
  }, [open]);

  const onSwipeEnd = (_: unknown, info: PanInfo) => {
    if (Math.abs(info.offset.x) < 60) return;
    if (info.offset.x < 0) next();
    else prev();
  };

  const Icon = step.icon;

  return (
    <AnimatePresence>
      {open ? (
        <motion.div
          key="wtf-explainer"
          data-testid="wtf-explainer-overlay"
          className="fixed inset-0 z-[9999]"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: reduceMotion ? 0 : 0.2 }}
        >
          {/* Backdrop / spotlight */}
          {isDesktop && tab === "guide" && rect ? (
            <>
              <button
                type="button"
                aria-label="Close explainer backdrop"
                className="absolute inset-0 z-0 cursor-default bg-transparent"
                onClick={onClose}
              />
              <motion.div
                className="pointer-events-none absolute z-[1] rounded-2xl ring-2 ring-[#5EEAD4] ring-offset-2 ring-offset-transparent"
                animate={{
                  top: rect.top,
                  left: rect.left,
                  width: rect.width,
                  height: rect.height,
                }}
                transition={{ type: "spring", stiffness: 320, damping: 30 }}
                style={{
                  boxShadow:
                    "0 0 0 9999px rgba(0,0,0,0.55), 0 0 28px rgba(94,234,212,0.35)",
                }}
              />
              {placement?.pinned && placement.beam ? (
                <svg
                  className="pointer-events-none absolute inset-0 z-[1]"
                  width="100%"
                  height="100%"
                  aria-hidden
                  data-testid="wtf-explainer-beam"
                >
                  <line
                    x1={placement.beam.x1}
                    y1={placement.beam.y1}
                    x2={placement.beam.x2}
                    y2={placement.beam.y2}
                    stroke="#5EEAD4"
                    strokeWidth="2"
                    strokeDasharray="6 6"
                    opacity="0.85"
                  />
                  <circle
                    cx={placement.beam.x2}
                    cy={placement.beam.y2}
                    r="5"
                    fill="#5EEAD4"
                    opacity="0.9"
                  />
                </svg>
              ) : null}
            </>
          ) : (
            <button
              type="button"
              aria-label="Close explainer backdrop"
              className="absolute inset-0 bg-black/55 backdrop-blur-sm"
              onClick={onClose}
            />
          )}

          {isDesktop ? (
            <DesktopCard
              cardRef={cardRef}
              step={step}
              stepIndex={stepIndex}
              total={total}
              tab={tab}
              setTab={setTab}
              Icon={Icon}
              placement={placement}
              themeAccent={theme.accent}
              onClose={onClose}
              onPrev={prev}
              onNext={next}
              onJump={goTo}
              reduceMotion={!!reduceMotion}
            />
          ) : (
            <MobileSheet
              step={step}
              stepIndex={stepIndex}
              total={total}
              tab={tab}
              setTab={setTab}
              Icon={Icon}
              themeAccent={theme.accent}
              onClose={onClose}
              onPrev={prev}
              onNext={next}
              onJump={goTo}
              onSwipeEnd={onSwipeEnd}
              reduceMotion={!!reduceMotion}
            />
          )}
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}

function StepControls({
  stepIndex,
  total,
  onPrev,
  onNext,
  onClose,
  accent,
  sticky,
}: {
  stepIndex: number;
  total: number;
  onPrev: () => void;
  onNext: () => void;
  onClose: () => void;
  accent: string;
  sticky?: boolean;
}) {
  return (
    <div
      data-testid="wtf-explainer-controls"
      className={cn(
        "flex flex-wrap items-center justify-between gap-2",
        sticky
          ? "sticky bottom-0 z-[1] -mx-4 mt-auto border-t border-[#E8EEF3] bg-white px-4 pt-3 pb-1"
          : "mt-4",
      )}
    >
      <button
        type="button"
        onClick={onPrev}
        disabled={stepIndex === 0}
        className="inline-flex items-center gap-1 rounded-lg border px-2.5 py-1.5 text-xs font-semibold disabled:opacity-40"
        style={{ borderColor: "rgba(15,37,55,0.12)" }}
      >
        <ChevronLeft className="size-3.5" />
        Previous
      </button>
      <span className="text-[11px] font-semibold tracking-wide text-[#5A6B7A]">
        Step {stepIndex + 1} of {total}
      </span>
      {stepIndex < total - 1 ? (
        <button
          type="button"
          onClick={onNext}
          className="inline-flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-white"
          style={{ background: accent }}
        >
          Next
          <ChevronRight className="size-3.5" />
        </button>
      ) : (
        <button
          type="button"
          onClick={onClose}
          className="inline-flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-white"
          style={{ background: accent }}
        >
          Exit Guide
        </button>
      )}
    </div>
  );
}

function TabBar({
  tab,
  setTab,
}: {
  tab: Tab;
  setTab: (t: Tab) => void;
}) {
  return (
    <div className="mb-3 flex gap-1 rounded-lg bg-[#F0F4F8] p-1">
      {(
        [
          { id: "guide" as const, label: "Guide", icon: Lightbulb },
          { id: "glossary" as const, label: "Glossary", icon: BookOpen },
        ] as const
      ).map((t) => {
        const I = t.icon;
        const active = tab === t.id;
        return (
          <button
            key={t.id}
            type="button"
            data-testid={t.id === "glossary" ? "wtf-glossary-tab" : "wtf-guide-tab"}
            onClick={() => setTab(t.id)}
            className={cn(
              "flex flex-1 items-center justify-center gap-1.5 rounded-md px-2 py-1.5 text-[11px] font-semibold transition",
              active ? "bg-white text-[#0F2537] shadow-sm" : "text-[#5A6B7A]",
            )}
          >
            <I className="size-3.5" />
            {t.label}
          </button>
        );
      })}
    </div>
  );
}

function GlossaryList({
  activeId,
  onJump,
}: {
  activeId: string;
  onJump: (i: number) => void;
}) {
  return (
    <ul className="space-y-1.5" data-testid="wtf-glossary-list">
      {explainerSteps.map((s, i) => {
        const I = s.icon;
        const active = s.id === activeId;
        return (
          <li key={s.id}>
            <button
              type="button"
              onClick={() => onJump(i)}
              className={cn(
                "flex w-full items-start gap-2.5 rounded-xl border px-3 py-2.5 text-left transition",
                active ? "border-[#0F2537]/20 bg-[#F0F7F5]" : "border-transparent hover:bg-[#F5F7FA]",
              )}
            >
              <I className="mt-0.5 size-4 shrink-0 text-[#0F2537]" />
              <span>
                <span className="block text-xs font-semibold text-[#0F2537]">
                  {i + 1}. {s.glossaryLabel}
                </span>
                <span className="mt-0.5 block text-[11px] text-[#5A6B7A]">
                  {s.summary}
                </span>
              </span>
            </button>
          </li>
        );
      })}
    </ul>
  );
}

function StepBody({ step, Icon }: { step: ExplainerStep; Icon: ExplainerStep["icon"] }) {
  return (
    <>
      <div className="mb-2 flex items-start gap-2.5">
        <span className="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-xl bg-[#0F2537] text-white">
          <Icon className="size-4" />
        </span>
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[#00A88F]">
            Architecture guide
          </p>
          <h2 className="text-base font-semibold tracking-tight text-[#0F2537]">
            {step.title}
          </h2>
        </div>
      </div>
      <p className="text-sm leading-relaxed text-[#3D4F5F]">{step.body}</p>
      <ul className="mt-3 space-y-1.5">
        {step.bullets.map((b) => (
          <li
            key={b}
            className="flex gap-2 text-[12px] leading-snug text-[#5A6B7A]"
          >
            <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-[#00A88F]" />
            {b}
          </li>
        ))}
      </ul>
    </>
  );
}

function DesktopCard({
  cardRef,
  step,
  stepIndex,
  total,
  tab,
  setTab,
  Icon,
  placement,
  themeAccent,
  onClose,
  onPrev,
  onNext,
  onJump,
  reduceMotion,
}: {
  cardRef: RefObject<HTMLDivElement | null>;
  step: ExplainerStep;
  stepIndex: number;
  total: number;
  tab: Tab;
  setTab: (t: Tab) => void;
  Icon: ExplainerStep["icon"];
  placement: TooltipPlacement | null;
  themeAccent: string;
  onClose: () => void;
  onPrev: () => void;
  onNext: () => void;
  onJump: (i: number) => void;
  reduceMotion: boolean;
}) {
  const style = (() => {
    if (tab === "guide" && placement) {
      return {
        position: "fixed" as const,
        top: placement.top ?? "auto",
        bottom: placement.bottom ?? "auto",
        left: placement.left,
        width: placement.width,
      };
    }
    // Glossary / missing placement: centered without CSS transform
    // (framer-motion owns transform).
    const vw = typeof window !== "undefined" ? window.innerWidth : 1280;
    const vh = typeof window !== "undefined" ? window.innerHeight : 800;
    const width = Math.min(420, vw - 32);
    const height =
      cardRef.current?.getBoundingClientRect().height || DEFAULT_CARD_H;
    const maxH = Math.min(height, vh * 0.85, vh - EDGE_MARGIN * 2);
    return {
      position: "fixed" as const,
      top: Math.max(EDGE_MARGIN, (vh - maxH) / 2),
      left: Math.max(EDGE_MARGIN, (vw - width) / 2),
      width,
    };
  })();

  return (
    <motion.div
      ref={cardRef}
      role="dialog"
      aria-modal="true"
      aria-labelledby="wtf-explainer-title"
      data-testid="wtf-explainer-desktop"
      data-placement={placement?.placement ?? "center"}
      initial={reduceMotion ? false : { opacity: 0, y: 12, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 8, scale: 0.98 }}
      transition={{ type: "spring", stiffness: 360, damping: 28 }}
      className="z-[2] flex max-h-[min(85vh,calc(100vh-32px))] flex-col overflow-hidden rounded-2xl border border-[#D5DEE6] bg-white shadow-2xl"
      style={style}
      onClick={(e) => e.stopPropagation()}
    >
      <div className="flex shrink-0 items-center gap-2 border-b border-[#E8EEF3] px-4 pt-3 pb-1">
        <div className="min-w-0 flex-1">
          <TabBar tab={tab} setTab={setTab} />
        </div>
        <button
          type="button"
          aria-label="Exit Guide"
          onClick={onClose}
          className="mb-3 shrink-0 rounded-lg p-1.5 text-[#5A6B7A] hover:bg-[#F0F4F8]"
        >
          <X className="size-4" />
        </button>
      </div>

      {tab === "guide" ? (
        <div key={step.id} className="flex min-h-0 flex-1 flex-col">
          <div className="min-h-0 flex-1 overflow-y-auto px-4 py-3">
            <h2 id="wtf-explainer-title" className="sr-only">
              {step.title}
            </h2>
            <StepBody step={step} Icon={Icon} />
            {stepIndex < total - 1 ? (
              <button
                type="button"
                onClick={onClose}
                className="mt-3 w-full text-center text-[11px] font-semibold text-[#5A6B7A] hover:underline"
              >
                Exit Guide
              </button>
            ) : null}
          </div>
          <StepControls
            stepIndex={stepIndex}
            total={total}
            onPrev={onPrev}
            onNext={onNext}
            onClose={onClose}
            accent={themeAccent || "#0F2537"}
            sticky
          />
        </div>
      ) : (
        <div className="min-h-0 flex-1 overflow-y-auto px-4 py-3">
          <GlossaryList activeId={step.id} onJump={onJump} />
        </div>
      )}
    </motion.div>
  );
}

function MobileSheet({
  step,
  stepIndex,
  total,
  tab,
  setTab,
  Icon,
  themeAccent,
  onClose,
  onPrev,
  onNext,
  onJump,
  onSwipeEnd,
  reduceMotion,
}: {
  step: ExplainerStep;
  stepIndex: number;
  total: number;
  tab: Tab;
  setTab: (t: Tab) => void;
  Icon: ExplainerStep["icon"];
  themeAccent: string;
  onClose: () => void;
  onPrev: () => void;
  onNext: () => void;
  onJump: (i: number) => void;
  onSwipeEnd: (e: unknown, info: PanInfo) => void;
  reduceMotion: boolean;
}) {
  return (
    <motion.div
      role="dialog"
      aria-modal="true"
      aria-labelledby="wtf-explainer-title-mobile"
      data-testid="wtf-explainer-mobile"
      initial={reduceMotion ? false : { y: "100%" }}
      animate={{ y: 0 }}
      exit={{ y: "100%" }}
      transition={{ type: "spring", stiffness: 340, damping: 32 }}
      drag={tab === "guide" ? "x" : false}
      dragConstraints={{ left: 0, right: 0 }}
      dragElastic={0.18}
      onDragEnd={onSwipeEnd}
      className="absolute inset-x-0 bottom-0 z-[2] max-h-[88vh] overflow-y-auto rounded-t-3xl border border-[#D5DEE6] bg-white px-4 pt-3 pb-6 shadow-2xl"
      onClick={(e) => e.stopPropagation()}
    >
      <div className="mx-auto mb-3 h-1 w-10 rounded-full bg-[#D5DEE6]" />
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1">
          <TabBar tab={tab} setTab={setTab} />
        </div>
        <button
          type="button"
          aria-label="Exit Guide"
          onClick={onClose}
          className="rounded-lg p-1.5 text-[#5A6B7A] hover:bg-[#F0F4F8]"
        >
          <X className="size-4" />
        </button>
      </div>

      {tab === "guide" ? (
        <AnimatePresence mode="wait">
          <motion.div
            key={step.id}
            initial={reduceMotion ? false : { opacity: 0, x: 24 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -24 }}
            transition={{ duration: 0.2 }}
          >
            <h2 id="wtf-explainer-title-mobile" className="sr-only">
              {step.title}
            </h2>
            <StepBody step={step} Icon={Icon} />
            <div
              className="mt-4 rounded-xl border border-dashed border-[#D5DEE6] bg-[#F8FAFC] px-3 py-2.5 text-[11px] font-medium text-[#5A6B7A]"
              data-testid="wtf-mobile-preview"
            >
              Preview · {step.mobilePreview}
            </div>
            <a
              href={`#${step.targetTestId}`}
              className="mt-2 inline-block text-[11px] font-semibold text-[#00A88F] underline-offset-2 hover:underline"
              onClick={(e) => {
                e.preventDefault();
                onClose();
                window.setTimeout(() => {
                  document
                    .querySelector(`[data-testid="${step.targetTestId}"]`)
                    ?.scrollIntoView({ behavior: "smooth", block: "center" });
                }, 280);
              }}
            >
              Inspect in UI →
            </a>
            <StepControls
              stepIndex={stepIndex}
              total={total}
              onPrev={onPrev}
              onNext={onNext}
              onClose={onClose}
              accent={themeAccent || "#0F2537"}
            />
          </motion.div>
        </AnimatePresence>
      ) : (
        <GlossaryList activeId={step.id} onJump={onJump} />
      )}
    </motion.div>
  );
}
