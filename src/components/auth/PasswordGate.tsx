"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Check, Eye, EyeOff, Lock, Loader2 } from "lucide-react";
import { useEffect, useId, useState, type FormEvent } from "react";
import {
  PROTOTYPE_PASSKEY,
  useAuth,
} from "@/context/AuthContext";

export function PasswordGate() {
  const { isAuthenticated, isLoading, login } = useAuth();
  const [passkey, setPasskey] = useState("");
  const [showPasskey, setShowPasskey] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [shake, setShake] = useState(false);
  const [success, setSuccess] = useState(false);
  const inputId = useId();

  useEffect(() => {
    if (!shake) return;
    const t = window.setTimeout(() => setShake(false), 480);
    return () => window.clearTimeout(t);
  }, [shake]);

  useEffect(() => {
    if (!success) return;
    const t = window.setTimeout(() => {
      login(passkey);
    }, 720);
    return () => window.clearTimeout(t);
  }, [success, passkey, login]);

  if (isLoading) {
    return (
      <div
        className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950"
        aria-busy="true"
        aria-label="Checking session"
      >
        <Loader2 className="size-8 animate-spin text-teal-300" />
      </div>
    );
  }

  if (isAuthenticated) return null;

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (success) return;

    if (passkey !== PROTOTYPE_PASSKEY) {
      setError("Incorrect passkey. Check with the BOLD team and try again.");
      setShake(true);
      return;
    }

    setError(null);
    setSuccess(true);
  }

  return (
    <div
      data-testid="password-gate"
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-md"
      role="dialog"
      aria-modal="true"
      aria-labelledby="password-gate-title"
    >
      <motion.div
        initial={{ opacity: 0, y: 16, scale: 0.98 }}
        animate={
          shake
            ? { opacity: 1, y: 0, scale: 1, x: [0, -10, 10, -8, 8, -4, 4, 0] }
            : { opacity: 1, y: 0, scale: 1, x: 0 }
        }
        transition={
          shake
            ? { duration: 0.45, ease: "easeInOut" }
            : { duration: 0.32, ease: [0.22, 1, 0.36, 1] }
        }
        className="w-full max-w-md rounded-2xl border border-slate-700/50 bg-slate-900 p-6 shadow-2xl sm:p-8"
      >
        <div className="mb-6 flex flex-col items-center text-center">
          <div className="mb-4 inline-flex size-12 items-center justify-center rounded-full bg-teal-400/15 ring-1 ring-teal-400/30">
            <AnimatePresence mode="wait" initial={false}>
              {success ? (
                <motion.span
                  key="ok"
                  initial={{ scale: 0.4, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.4, opacity: 0 }}
                  transition={{ type: "spring", stiffness: 420, damping: 22 }}
                >
                  <Check className="size-5 text-teal-300" aria-hidden />
                </motion.span>
              ) : (
                <motion.span
                  key="lock"
                  initial={{ scale: 0.4, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.4, opacity: 0 }}
                >
                  <Lock className="size-5 text-teal-300" aria-hidden />
                </motion.span>
              )}
            </AnimatePresence>
          </div>
          <h1
            id="password-gate-title"
            className="font-display text-2xl font-bold tracking-tight text-white"
          >
            BOLD Internal Access
          </h1>
          <p className="mt-2 max-w-sm text-sm leading-relaxed text-slate-400">
            This Daily Feed Card Engine prototype is for internal review only.
            Enter the passkey to unlock Candidate Feed and PM Studio.
          </p>
        </div>

        <AnimatePresence mode="wait">
          {success ? (
            <motion.div
              key="success"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="rounded-xl border border-teal-500/30 bg-teal-500/10 px-4 py-5 text-center"
            >
              <p className="text-sm font-semibold text-teal-200">Access granted</p>
              <p className="mt-1 text-xs text-teal-200/70">Unlocking prototype…</p>
            </motion.div>
          ) : (
            <motion.form
              key="form"
              onSubmit={onSubmit}
              className="space-y-4"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0, y: -6 }}
            >
              <div>
                <label
                  htmlFor={inputId}
                  className="mb-1.5 block text-xs font-semibold uppercase tracking-[0.14em] text-slate-400"
                >
                  Passkey
                </label>
                <div className="relative">
                  <input
                    id={inputId}
                    data-testid="password-gate-input"
                    type={showPasskey ? "text" : "password"}
                    autoComplete="current-password"
                    value={passkey}
                    onChange={(e) => {
                      setPasskey(e.target.value);
                      if (error) setError(null);
                    }}
                    className="w-full rounded-xl border border-slate-700 bg-slate-950/60 px-3.5 py-3 pr-11 text-sm text-white outline-none ring-teal-400/0 transition placeholder:text-slate-600 focus:border-teal-500/60 focus:ring-2 focus:ring-teal-400/30"
                    placeholder="Enter internal passkey"
                    autoFocus
                  />
                  <button
                    type="button"
                    data-testid="password-gate-toggle"
                    onClick={() => setShowPasskey((v) => !v)}
                    className="absolute top-1/2 right-2.5 -translate-y-1/2 rounded-lg p-1.5 text-slate-400 transition hover:bg-slate-800 hover:text-slate-200"
                    aria-label={showPasskey ? "Hide passkey" : "Show passkey"}
                  >
                    {showPasskey ? (
                      <EyeOff className="size-4" />
                    ) : (
                      <Eye className="size-4" />
                    )}
                  </button>
                </div>
              </div>

              {error ? (
                <p
                  data-testid="password-gate-error"
                  role="alert"
                  className="text-sm text-rose-400"
                >
                  {error}
                </p>
              ) : null}

              <button
                type="submit"
                data-testid="password-gate-submit"
                className="w-full rounded-xl bg-teal-500 px-4 py-3 text-sm font-semibold text-slate-950 transition hover:bg-teal-400 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-300"
              >
                Unlock prototype
              </button>
            </motion.form>
          )}
        </AnimatePresence>

        <p className="mt-5 text-center text-[11px] leading-relaxed text-slate-500">
          Lightweight client-side gate for demos — not cryptographic security.
        </p>
      </motion.div>
    </div>
  );
}
