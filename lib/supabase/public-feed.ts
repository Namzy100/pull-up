import { MOCK_DEALS } from "@/lib/deals-data";
import { MOCK_EVENTS } from "@/lib/mock-data";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { hasSupabaseEnv } from "@/lib/supabase/env";
import { listApprovedDeals, listApprovedEvents, listVenues } from "@/lib/supabase/repositories";
import type { PuDeal, PuEvent } from "@/lib/types";

export async function loadFeedEvents(): Promise<PuEvent[]> {
  if (!hasSupabaseEnv()) return MOCK_EVENTS;
  const supabase = await createSupabaseServerClient();
  const [rows, venues] = await Promise.all([
    listApprovedEvents(supabase),
    listVenues(supabase),
  ]);
  if (rows.length === 0) return MOCK_EVENTS;
  const venueMap = new Map(venues.map((v) => [v.id, v]));
  return rows.map((row) => {
    const venue = venueMap.get(row.venue_id);
    const start = new Date(row.starts_at);
    const end = new Date(row.ends_at);
    const coverCents =
      row.cover_cents ?? (row.entry_type === "free" ? 0 : null);
    return {
      id: row.id,
      venueId: row.venue_id,
      title: row.title,
      category: row.category,
      categoryLabel: row.category.replaceAll("_", " "),
      area: venue?.area ?? "Campus",
      venueName: venue?.name ?? "Campus Venue",
      startsAt: start.toISOString(),
      endsAt: end.toISOString(),
      coverCents,
      entryType: row.entry_type,
      stagRule: row.stag_rule,
      ageRestriction: row.age_restriction,
      vibeMusic: row.vibe_music,
      crowdStatus: "active",
      urgencyLabels: ["Verified listing"],
      imageUrl: row.image_url,
      imageAlt: row.title,
      heatScore: 70,
      liveNow: start <= new Date() && end >= new Date(),
      savesCount: 0,
      spottingCount: 0,
      pullUpsLastHour: 0,
      description: row.description,
      hostLabel: venue?.name ?? "Verified host",
      externalUrl: row.external_url ?? undefined,
    };
  });
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
  return rows.map((row) => {
    const venue = venueMap.get(row.venue_id);
    return {
      id: row.id,
      venueId: row.venue_id,
      title: row.title,
      venueLabel: venue?.name ?? "Campus Venue",
      area: venue?.area ?? "Campus",
      perk: row.perk,
      windowLabel: `${row.valid_from} - ${row.valid_until}`,
      urgencyLabel: "Verified deal",
      imageUrl: row.image_url,
      imageAlt: row.title,
      categoryLabel: row.category_tag.replaceAll("_", " "),
      filterTags: [row.category_tag],
      urgencyScore: 70,
      savesCount: 0,
      claimsLastHour: 0,
      watchingCount: 0,
      studentOnly: row.student_only,
    };
  });
}
