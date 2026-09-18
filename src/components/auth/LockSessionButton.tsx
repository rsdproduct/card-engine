"use client";

import { Lock } from "lucide-react";
import { useAuth } from "@/context/AuthContext";

export function LockSessionButton({
  className,
  tone = "dark",
}: {
  className?: string;
  tone?: "dark" | "light";
}) {
  const { logout, isAuthenticated } = useAuth();

  if (!isAuthenticated) return null;

  const styles =
    tone === "dark"
      ? "border-white/15 bg-white/5 text-white/80 hover:bg-white/10 hover:text-white"
      : "border-[#D5DEE6] bg-white text-[#5A6B7A] hover:border-[#0F2537]/30 hover:text-[#0F2537]";

  return (
    <button
      type="button"
      data-testid="lock-session"
      onClick={logout}
      title="Lock Session — clear local unlock and return to the passkey gate"
      aria-label="Lock Session"
      className={`inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs font-semibold transition ${styles} ${className ?? ""}`}
    >
      <Lock className="size-3.5" aria-hidden />
      <span className="hidden sm:inline">Lock Session</span>
    </button>
  );
}
