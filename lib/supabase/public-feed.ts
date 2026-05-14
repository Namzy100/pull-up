/**
 * Server-only data loaders for the Tonight feed, deals, and event detail routes.
 * Client components and hooks must not import this module — use `browser-feed.ts` with
 * `createSupabaseBrowserClient` (see `hooks/use-campus-live-subscription.ts`).
 */
import { MOCK_DEALS } from "@/lib/deals-data";
import { MOCK_EVENTS } from "@/lib/mock-data";
import { mapDbDealToPuDeal, mapDbEventToPuEvent } from "@/lib/supabase/feed-mappers";
import { hasSupabaseEnv } from "@/lib/supabase/env";
import {
  getEventById,
  listApprovedDeals,
  listApprovedEvents,
  listVenues,
} from "@/lib/supabase/repositories";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { PuDeal, PuEvent } from "@/lib/types";

export { mapDbDealToPuDeal, mapDbEventToPuEvent } from "@/lib/supabase/feed-mappers";

export async function loadFeedEvents(): Promise<PuEvent[]> {
  if (!hasSupabaseEnv()) return MOCK_EVENTS;
  const supabase = await createSupabaseServerClient();
  const [rows, venues] = await Promise.all([
    listApprovedEvents(supabase),
    listVenues(supabase),
  ]);
  if (rows.length === 0) return MOCK_EVENTS;
  const venueMap = new Map(venues.map((v) => [v.id, v]));
  const now = Date.now();
  return rows
    .filter((row) => new Date(row.ends_at).getTime() > now)
    .map((row) => mapDbEventToPuEvent(row, venueMap.get(row.venue_id)));
}

export async function loadDeals(): Promise<PuDeal[]> {
  if (!hasSupabaseEnv()) return MOCK_DEALS;
  const supabase = await createSupabaseServerClient();
  const [rows, venues] = await Promise.all([
    listApprovedDeals(supabase),
    listVenues(supabase),
  ]);
  if (rows.length === 0) return MOCK_DEALS;
  const venueMap = new Map(venues.map((v) => [v.id, v]));
  const today = new Date().toISOString().slice(0, 10);
  return rows
    .filter((row) => String(row.valid_until) >= today)
    .map((row) => mapDbDealToPuDeal(row, venueMap.get(row.venue_id)));
}

export async function loadEventDetail(id: string): Promise<PuEvent | null> {
  if (!hasSupabaseEnv()) {
    return MOCK_EVENTS.find((e) => e.id === id) ?? null;
  }
  const supabase = await createSupabaseServerClient();
  const row = await getEventById(supabase, id);
  if (!row) {
    return MOCK_EVENTS.find((e) => e.id === id) ?? null;
  }
  const venues = await listVenues(supabase);
  const venueMap = new Map(venues.map((v) => [v.id, v]));
  return mapDbEventToPuEvent(row, venueMap.get(row.venue_id));
}
