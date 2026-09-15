import type { EnginePersistedState, FeedCard } from "@/types/cardEngine";

export const STORAGE_KEY = "bold-daily-feed-engine-v2";
export const STORAGE_VERSION = 2;

function hasSupabaseEnv() {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  );
}

export function isSupabaseConfigured() {
  return hasSupabaseEnv();
}

/** Client-side LocalStorage read (safe in browser only). */
export function loadFromLocalStorage(): Partial<EnginePersistedState> | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as Partial<EnginePersistedState>;
  } catch {
    return null;
  }
}

export function saveToLocalStorage(state: EnginePersistedState) {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

export function clearLocalStorage() {
  if (typeof window === "undefined") return;
  localStorage.removeItem(STORAGE_KEY);
}

/** Optional Supabase sync — no-ops when env is missing. */
export async function syncCampaignsToSupabase(cards: FeedCard[]): Promise<{
  ok: boolean;
  mode: "supabase" | "local" | "api";
  error?: string;
}> {
  if (!hasSupabaseEnv()) {
    return { ok: true, mode: "local" };
  }

  try {
    const { createClient } = await import("@supabase/supabase-js");
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    );
    const custom = cards.filter((c) => c.custom || c.campaignId);
    const { error } = await supabase.from("campaigns").upsert(
      custom.map((c) => ({
        id: c.campaignId ?? c.id,
        payload: c,
        updated_at: new Date().toISOString(),
      })),
      { onConflict: "id" },
    );
    if (error) {
      // Fall back to API handler
      const res = await fetch("/api/campaigns", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cards: custom }),
      });
      if (!res.ok) {
        return { ok: false, mode: "api", error: error.message };
      }
      return { ok: true, mode: "api" };
    }
    return { ok: true, mode: "supabase" };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown sync error";
    try {
      await fetch("/api/campaigns", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cards: cards.filter((c) => c.custom || c.campaignId) }),
      });
      return { ok: true, mode: "api" };
    } catch {
      return { ok: false, mode: "local", error: message };
    }
  }
}

export async function fetchSharedCampaigns(): Promise<FeedCard[]> {
  try {
    if (hasSupabaseEnv()) {
      const { createClient } = await import("@supabase/supabase-js");
      const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      );
      const { data, error } = await supabase.from("campaigns").select("payload");
      if (!error && data) {
        return data.map((row) => row.payload as FeedCard);
      }
    }
    const res = await fetch("/api/campaigns");
    if (res.ok) {
      const json = (await res.json()) as { cards?: FeedCard[] };
      return json.cards ?? [];
    }
  } catch {
    // ignore — local seed is enough
  }
  return [];
}
