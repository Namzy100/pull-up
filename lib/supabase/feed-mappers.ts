import { crowdMomentumFromEvent, crowdStatusForMomentum, type CrowdMomentumLabel } from "@/lib/momentum";
import { coerceDealCategoryTag } from "@/lib/supabase/business-deal-payload";
import type { Database } from "@/lib/supabase/database.types";
import type { CrowdStatus, PuDeal, PuEvent } from "@/lib/types";

type EventRow = Database["public"]["Tables"]["events"]["Row"];
type DealRow = Database["public"]["Tables"]["deals"]["Row"];
type VenueRow = Database["public"]["Tables"]["venues"]["Row"];

function crowdFromRow(row: EventRow): CrowdStatus {
  if (row.live_now) return "packed";
  if (row.saves_count >= 12) return "active";
  if (row.saves_count >= 4) return "warming_up";
  return "chill";
}

export function mapDbEventToPuEvent(row: EventRow, venue: VenueRow | undefined): PuEvent {
  const start = new Date(row.starts_at);
  const end = new Date(row.ends_at);
  const coverCents = row.cover_cents ?? (row.entry_type === "free" ? 0 : null);
  const categoryLabel =
    row.category_label?.trim() || row.category.replaceAll("_", " ");
  const area = row.area?.trim() || venue?.area || "Campus";
  const venueName = row.venue_name?.trim() || venue?.name || "Campus Venue";
  const imageAlt = row.image_alt?.trim() || row.title;
  const hostLabel = row.host_label?.trim() || venueName;
  const ageRestriction = row.age_rule?.trim() || row.age_restriction;
  const vibeMusic = row.vibe?.trim() || row.vibe_music;
  const urgencyLabels =
    row.urgency_labels && row.urgency_labels.length > 0
      ? row.urgency_labels
      : ["Verified listing"];
  const liveNow =
    row.live_now || (start.getTime() <= Date.now() && end.getTime() >= Date.now());
  const heatScore = Math.min(
    99,
    38 + row.saves_count + row.pull_ups_last_hour + Math.floor(row.rsvps_count / 2)
  );

  const base: PuEvent = {
    id: row.id,
    venueId: row.venue_id,
    title: row.title,
    category: row.category,
    categoryLabel,
    area,
    venueName,
    startsAt: start.toISOString(),
    endsAt: end.toISOString(),
    coverCents,
    entryType: row.entry_type,
    stagRule: row.stag_rule,
    ageRestriction,
    vibeMusic,
    crowdStatus: crowdFromRow(row),
    urgencyLabels,
    imageUrl: row.image_url,
    imageAlt,
    heatScore,
    liveNow,
    savesCount: row.saves_count,
    rsvpsCount: row.rsvps_count,
    spottingCount: row.watching_count,
    pullUpsLastHour: row.pull_ups_last_hour,
    description: row.description,
    hostLabel,
    externalUrl: row.external_url ?? undefined,
    updatedAt: row.updated_at,
  };

  const momentumLabel: CrowdMomentumLabel = crowdMomentumFromEvent(base, Date.now());
  return {
    ...base,
    momentumLabel,
    crowdStatus: crowdStatusForMomentum(momentumLabel, crowdFromRow(row)),
  };
}

export function mapDbDealToPuDeal(row: DealRow, venue: VenueRow | undefined): PuDeal {
  const categoryLabel =
    row.category_label?.trim() || row.category_tag.replaceAll("_", " ");
  const area = row.area?.trim() || venue?.area || "Campus";
  const venueLabel = venue?.name || row.business_name?.trim() || "Campus Venue";
  const imageAlt = row.image_alt?.trim() || row.title;
  const urgencyLabel = row.urgency_label?.trim() || "Verified deal";
  const urgencyScore = Math.min(99, 40 + row.saves_count + row.claims_count);
  return {
    id: row.id,
    venueId: row.venue_id,
    title: row.title,
    venueLabel,
    area,
    perk: row.perk,
    windowLabel: `${row.valid_from} – ${row.valid_until}`,
    urgencyLabel,
    imageUrl: row.image_url,
    imageAlt,
    categoryLabel,
    filterTags: [coerceDealCategoryTag(row.category_tag)],
    urgencyScore,
    savesCount: row.saves_count,
    claimsLastHour: row.claims_count,
    watchingCount: row.watching_count,
    studentOnly: row.student_only,
    validUntil: row.valid_until,
  };
}
