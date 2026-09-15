import { NextResponse } from "next/server";
import type { FeedCard } from "@/types/cardEngine";

/**
 * In-memory campaign store for zero-secret demos.
 * When Supabase is configured, clients prefer that path; this remains a fallback.
 */
const memoryStore: { cards: FeedCard[] } = { cards: [] };

export async function GET() {
  return NextResponse.json({
    cards: memoryStore.cards,
    source: "memory",
    supabaseConfigured: Boolean(
      process.env.NEXT_PUBLIC_SUPABASE_URL &&
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    ),
  });
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { cards?: FeedCard[] };
    const incoming = body.cards ?? [];
    const byId = new Map(memoryStore.cards.map((c) => [c.id, c]));
    for (const card of incoming) {
      byId.set(card.id, card);
    }
    memoryStore.cards = Array.from(byId.values());
    return NextResponse.json({ ok: true, count: memoryStore.cards.length });
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid payload" }, { status: 400 });
  }
}
