"use client";

import { MessageSquarePlus } from "lucide-react";
import { useAuth } from "@/context/AuthContext";

export function FeedbackTrigger({
  onOpen,
}: {
  onOpen: () => void;
}) {
  const { isAuthenticated } = useAuth();

  if (!isAuthenticated) return null;

  return (
    <button
      type="button"
      data-testid="feedback-trigger"
      onClick={onOpen}
      aria-label="Share Feedback"
      className="fixed bottom-6 right-6 z-40 inline-flex items-center gap-2 rounded-full px-4 py-3 text-sm font-semibold text-white shadow-lg transition hover:opacity-95 hover:shadow-xl focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#5842F4]"
      style={{
        background: "linear-gradient(135deg, #5842F4, #4338CA)",
        boxShadow:
          "0 10px 28px rgba(88, 66, 244, 0.35), 0 2px 6px rgba(10, 15, 44, 0.12)",
      }}
    >
      <MessageSquarePlus className="size-4 shrink-0" aria-hidden />
      <span className="hidden sm:inline">Share Feedback</span>
      <span className="sm:hidden">Feedback</span>
    </button>
  );
}
