"use client";

import { useCallback, useState } from "react";
import { useCardIndex } from "@/context/CardIndexContext";
import { useFeedEngine } from "@/context/FeedEngineContext";

/** One reset for feed engine + Card Index seed. */
export function useResetDemo() {
  const { resetEngine, showToast } = useFeedEngine();
  const { resetToSeed } = useCardIndex();
  const [confirmOpen, setConfirmOpen] = useState(false);

  const requestReset = useCallback(() => setConfirmOpen(true), []);
  const cancelReset = useCallback(() => setConfirmOpen(false), []);

  const confirmReset = useCallback(() => {
    resetEngine();
    resetToSeed();
    showToast("Demo reset to sample data.");
    setConfirmOpen(false);
  }, [resetEngine, resetToSeed, showToast]);

  return {
    confirmOpen,
    requestReset,
    cancelReset,
    confirmReset,
  };
}
