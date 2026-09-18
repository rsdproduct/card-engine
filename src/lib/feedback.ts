import {
  DEFAULT_FEEDBACK_WEBHOOK_URL,
  FEEDBACK_STORAGE_KEY,
  type FeedbackSubmission,
} from "@/types/feedback";

export function loadFeedbackLog(): FeedbackSubmission[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(FEEDBACK_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    return Array.isArray(parsed) ? (parsed as FeedbackSubmission[]) : [];
  } catch {
    return [];
  }
}

/** Always appends to LocalStorage, even when the webhook later fails. */
export function appendFeedbackLocally(entry: FeedbackSubmission): void {
  if (typeof window === "undefined") return;
  const next = [...loadFeedbackLog(), entry];
  localStorage.setItem(FEEDBACK_STORAGE_KEY, JSON.stringify(next));
}

export type FeedbackSubmitResult =
  | { status: "sent" }
  | { status: "local_only"; error: string };

/**
 * Persist locally first, then fire the Apps Script webhook.
 * Google Apps Script often blocks readable CORS responses, so we use
 * `mode: "no-cors"` with a text/plain body (avoids preflight) and treat
 * a completed opaque request as "sent". Network throws → local_only.
 */
export async function submitFeedback(
  entry: FeedbackSubmission,
  webhookUrl: string = DEFAULT_FEEDBACK_WEBHOOK_URL,
): Promise<FeedbackSubmitResult> {
  appendFeedbackLocally(entry);

  try {
    await fetch(webhookUrl, {
      method: "POST",
      mode: "no-cors",
      headers: { "Content-Type": "text/plain;charset=utf-8" },
      body: JSON.stringify(entry),
    });
    return { status: "sent" };
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Network error reaching webhook";
    return { status: "local_only", error: message };
  }
}

export function createFeedbackId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `fb_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
}
