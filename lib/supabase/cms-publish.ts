import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "@/lib/supabase/database.types";
import {
  coerceDealCategoryTag,
  DEFAULT_BUSINESS_EVENT_IMAGE,
  isBusinessPromoDealLike,
  parseBusinessDealPayload,
  promoTypeToDealCategoryTag,
  promoTypeToEventCategory,
  type BusinessDealPayloadJson,
} from "@/lib/supabase/business-deal-payload";
import {
  coerceEntryType,
  coerceEventCategory,
  computeEventPublicationStatus,
  isoFromDateAndTime,
  parseHostEventPayload,
} from "@/lib/supabase/host-event-payload";
import { formatSupabasePostgrestError } from "@/lib/supabase/postgrest-error";
import type { EntryType } from "@/lib/types";

type DbClient = SupabaseClient;

export type CmsPublishResult<T> =
  | { ok: true; data: T }
  | { ok: false; error: string };

function err(message: string): { ok: false; error: string } {
  return { ok: false, error: message };
}

export async function publishHostSubmissionToEvent(
  client: DbClient,
  clientSubmissionId: string,
  reviewerId: string,
  moderationNotes?: string
): Promise<CmsPublishResult<{ eventId: string }>> {
  const { data: row, error: fetchErr } = await client
    .from("host_submissions")
    .select("*")
    .eq("client_submission_id", clientSubmissionId)
    .maybeSingle();
  if (fetchErr) return err(formatSupabasePostgrestError(fetchErr));
  if (!row) return err("Submission not found.");
  if (row.status !== "pending") return err("Submission is not pending.");

  const payload = parseHostEventPayload(row.event_payload);
  if (!payload) return err("Invalid event payload.");

  const title = String(payload.title ?? "").trim();
  const dateStr = String(payload.date ?? "").trim();
  const startTime = String(payload.startTime ?? "").trim();
  const endTime = String(payload.endTime ?? "").trim();
  const area = String(payload.area ?? "").trim();
  const venueName = String(payload.venue ?? "").trim();
  if (!title || !dateStr || !startTime || !endTime || !area || !venueName) {
    return err("Event payload is missing required fields.");
  }

  let startsAt: string;
  let endsAt: string;
  try {
    startsAt = isoFromDateAndTime(dateStr, startTime);
    endsAt = isoFromDateAndTime(dateStr, endTime);
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Invalid date/time in payload.";
    return err(msg);
  }

  const category = coerceEventCategory(payload.category);
  const entryType = coerceEntryType(payload.entryType);
  const stagRule = String(payload.stagRule ?? "Ask at door").trim() || "Ask at door";
  const ageRestriction = String(payload.ageRestriction ?? "18+").trim() || "18+";
  const vibeMusic = String(payload.vibeMusic ?? "Open format").trim() || "Open format";
  const description = String(payload.description ?? "").trim() || title;
  const imageUrl = String(payload.imageUrl ?? "").trim();
  if (!imageUrl) return err("Event image URL is required.");

  const coverDollars = payload.coverDollars;
  const coverCents =
    entryType === "free"
      ? 0
      : typeof coverDollars === "number" && Number.isFinite(coverDollars)
        ? Math.round(coverDollars * 100)
        : null;

  const externalUrl = String(payload.externalUrl ?? "").trim() || null;
  const categoryLabel =
    String(payload.categoryLabel ?? "").trim() || category.replaceAll("_", " ");
  const ageRule = ageRestriction;
  const vibe = vibeMusic;
  const hostLabel = venueName;
  const pub = computeEventPublicationStatus(startsAt, endsAt);
  const urgencyLabels =
    pub.status === "live" ? ["Live now", "Verified listing"] : ["Verified listing"];

  const nowIso = new Date().toISOString();

  let venueId: string;
  if (row.published_event_id) {
    const { data: existing, error: exErr } = await client
      .from("events")
      .select("venue_id")
      .eq("id", row.published_event_id)
      .maybeSingle();
    if (exErr) return err(formatSupabasePostgrestError(exErr));
    if (!existing?.venue_id) return err("Published event is missing a venue.");
    venueId = existing.venue_id;
    const { error: vUpd } = await client
      .from("venues")
      .update({ name: venueName, area })
      .eq("id", venueId);
    if (vUpd) return err(formatSupabasePostgrestError(vUpd));
  } else {
    const { data: venueRow, error: venueErr } = await client
      .from("venues")
      .insert({
        name: venueName,
        area,
        kind: "bar_club",
      })
      .select("id")
      .single();
    if (venueErr || !venueRow) {
      return err(formatSupabasePostgrestError(venueErr) || "Could not create venue.");
    }
    venueId = venueRow.id;
  }

  const eventInsert: Database["public"]["Tables"]["events"]["Insert"] = {
    venue_id: venueId,
    title,
    category,
    starts_at: startsAt,
    ends_at: endsAt,
    cover_cents: coverCents,
    entry_type: entryType,
    stag_rule: stagRule,
    age_restriction: ageRestriction,
    vibe_music: vibeMusic,
    description,
    image_url: imageUrl,
    external_url: externalUrl,
    created_by: row.user_id,
    host_user_id: row.user_id,
    category_label: categoryLabel,
    image_alt: title,
    area,
    venue_name: venueName,
    host_label: hostLabel,
    age_rule: ageRule,
    vibe,
    urgency_labels: urgencyLabels,
    live_now: pub.live_now,
    status: pub.status === "ended" ? "ended" : pub.status,
    saves_count: 0,
    rsvps_count: 0,
    watching_count: 0,
    pull_ups_last_hour: 0,
    updated_at: nowIso,
  };

  let eventId = row.published_event_id;

  if (eventId) {
    const { error: updEvErr } = await client
      .from("events")
      .update({
        ...eventInsert,
        venue_id: venueId,
        updated_at: nowIso,
      })
      .eq("id", eventId);
    if (updEvErr) return err(formatSupabasePostgrestError(updEvErr));
  } else {
    const { data: ev, error: insErr } = await client
      .from("events")
      .insert(eventInsert)
      .select("id")
      .single();
    if (insErr || !ev) return err(formatSupabasePostgrestError(insErr) || "Could not create event.");
    eventId = ev.id;
  }

  const { error: subErr } = await client
    .from("host_submissions")
    .update({
      status: "approved",
      reviewed_at: nowIso,
      reviewed_by: reviewerId,
      moderation_notes: moderationNotes ?? null,
      published_event_id: eventId,
    })
    .eq("client_submission_id", clientSubmissionId);
  if (subErr) return err(formatSupabasePostgrestError(subErr));

  return { ok: true, data: { eventId } };
}

function parseCoverDollarsFromFreeform(text: string): number | null {
  const t = text.trim();
  if (!t) return null;
  const m = t.match(/\$(\d+(?:\.\d+)?)/);
  if (m) {
    const n = Number(m[1]);
    return Number.isFinite(n) ? n : null;
  }
  return null;
}

function businessEntryInfoToEventFields(
  entryInfo: string,
  studentOnly: boolean
): {
  entryType: EntryType;
  coverCents: number | null;
  stagRule: string;
  ageRestriction: string;
} {
  const t = entryInfo.trim();
  const lower = t.toLowerCase();
  let entryType: EntryType = "free";
  let coverCents: number | null = 0;
  let stagRule = "Ask at door";

  if (t && (lower.includes("rsvp") || lower.includes("registration"))) {
    entryType = "rsvp";
    coverCents = null;
    stagRule = t.length > 80 ? `${t.slice(0, 77)}…` : t || "RSVP required";
  } else if (!t || lower.includes("free") || lower.includes("no cover")) {
    entryType = "free";
    coverCents = 0;
  } else {
    const dollars = parseCoverDollarsFromFreeform(t);
    entryType = "cover";
    coverCents = dollars != null ? Math.round(dollars * 100) : null;
    if (t.length > 0 && t.length <= 120) stagRule = t;
  }

  const ageRestriction = studentOnly ? "Students" : "18+";
  return { entryType, coverCents, stagRule, ageRestriction };
}

async function publishBusinessEventPromoAsEvent(
  client: DbClient,
  row: Database["public"]["Tables"]["business_submissions"]["Row"],
  payload: BusinessDealPayloadJson,
  reviewerId: string,
  moderationNotes?: string
): Promise<CmsPublishResult<{ eventId: string }>> {
  const businessName = String(payload.businessName ?? "").trim();
  const title = String(payload.dealTitle ?? "").trim();
  const dateStr = String(payload.eventDate ?? payload.validFrom ?? "").trim();
  const startTime = String(payload.startTime ?? "").trim();
  const endTime = String(payload.endTime ?? "").trim();
  const area = String(payload.area ?? "").trim();
  const venueName = businessName || title;
  if (!title || !dateStr || !startTime || !endTime || !area || !businessName) {
    return err("Promo payload is missing required fields.");
  }

  let startsAt: string;
  let endsAt: string;
  try {
    startsAt = isoFromDateAndTime(dateStr, startTime);
    endsAt = isoFromDateAndTime(dateStr, endTime);
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Invalid date/time in payload.";
    return err(msg);
  }

  const category = promoTypeToEventCategory(payload.promoType);
  const vibeFrom = String(payload.expectedVibe ?? "").trim();
  const promoLabel = String(payload.promoTypeLabel ?? "").trim() || String(payload.promoType ?? "");
  const vibeMusic = vibeFrom || promoLabel || "Business promo";

  const { entryType, coverCents, stagRule, ageRestriction } = businessEntryInfoToEventFields(
    String(payload.entryInfo ?? ""),
    Boolean(payload.studentOnly)
  );

  const description = String(payload.description ?? "").trim() || title;
  let imageUrl = String(payload.imageUrl ?? "").trim();
  if (!imageUrl) imageUrl = DEFAULT_BUSINESS_EVENT_IMAGE;

  const categoryLabel =
    String(payload.promoTypeLabel ?? "").trim() || category.replaceAll("_", " ");
  const externalUrl = String(payload.externalUrl ?? "").trim() || null;
  const ageRule = ageRestriction;
  const hostLabel = businessName;
  const pub = computeEventPublicationStatus(startsAt, endsAt);
  const urgencyLabels =
    pub.status === "live" ? ["Live now", "Verified partner"] : ["Verified partner"];

  const nowIso = new Date().toISOString();

  let venueId: string;
  if (row.published_event_id) {
    const { data: existing, error: exErr } = await client
      .from("events")
      .select("venue_id")
      .eq("id", row.published_event_id)
      .maybeSingle();
    if (exErr) return err(formatSupabasePostgrestError(exErr));
    if (!existing?.venue_id) return err("Published event is missing a venue.");
    venueId = existing.venue_id;
    const { error: vUpd } = await client
      .from("venues")
      .update({ name: venueName, area })
      .eq("id", venueId);
    if (vUpd) return err(formatSupabasePostgrestError(vUpd));
  } else {
    const { data: venueRow, error: venueErr } = await client
      .from("venues")
      .insert({
        name: venueName,
        area,
        kind: "restaurant",
      })
      .select("id")
      .single();
    if (venueErr || !venueRow) {
      return err(formatSupabasePostgrestError(venueErr) || "Could not create venue.");
    }
    venueId = venueRow.id;
  }

  const eventInsert: Database["public"]["Tables"]["events"]["Insert"] = {
    venue_id: venueId,
    title,
    category,
    starts_at: startsAt,
    ends_at: endsAt,
    cover_cents: coverCents,
    entry_type: entryType,
    stag_rule: stagRule,
    age_restriction: ageRestriction,
    vibe_music: vibeMusic,
    description,
    image_url: imageUrl,
    external_url: externalUrl,
    created_by: row.user_id,
    host_user_id: row.user_id,
    category_label: categoryLabel,
    image_alt: title,
    area,
    venue_name: venueName,
    host_label: hostLabel,
    age_rule: ageRule,
    vibe: vibeMusic,
    urgency_labels: urgencyLabels,
    live_now: pub.live_now,
    status: pub.status === "ended" ? "ended" : pub.status,
    saves_count: 0,
    rsvps_count: 0,
    watching_count: 0,
    pull_ups_last_hour: 0,
    updated_at: nowIso,
  };

  let eventId = row.published_event_id;

  if (eventId) {
    const { error: updEvErr } = await client
      .from("events")
      .update({
        ...eventInsert,
        venue_id: venueId,
        updated_at: nowIso,
      })
      .eq("id", eventId);
    if (updEvErr) return err(formatSupabasePostgrestError(updEvErr));
  } else {
    const { data: ev, error: insErr } = await client
      .from("events")
      .insert(eventInsert)
      .select("id")
      .single();
    if (insErr || !ev) return err(formatSupabasePostgrestError(insErr) || "Could not create event.");
    eventId = ev.id;
  }

  const { error: subErr } = await client
    .from("business_submissions")
    .update({
      status: "approved",
      reviewed_at: nowIso,
      reviewed_by: reviewerId,
      moderation_notes: moderationNotes ?? null,
      published_event_id: eventId,
    })
    .eq("client_submission_id", row.client_submission_id);
  if (subErr) return err(formatSupabasePostgrestError(subErr));

  if (!eventId) return err("Could not resolve published event id.");

  return { ok: true, data: { eventId } };
}

async function publishBusinessEventPromoAsDeal(
  client: DbClient,
  row: Database["public"]["Tables"]["business_submissions"]["Row"],
  payload: BusinessDealPayloadJson,
  reviewerId: string,
  moderationNotes?: string
): Promise<CmsPublishResult<{ dealId: string }>> {
  const businessName = String(payload.businessName ?? "").trim();
  const dealTitle = String(payload.dealTitle ?? "").trim();
  const eventDate = String(payload.eventDate ?? payload.validFrom ?? "").trim();
  const area = String(payload.area ?? "").trim();
  const description = String(payload.description ?? "").trim() || dealTitle;
  let imageUrl = String(payload.imageUrl ?? "").trim();
  if (!imageUrl) imageUrl = DEFAULT_BUSINESS_EVENT_IMAGE;
  const perk =
    String(payload.entryInfo ?? "").trim() ||
    String(payload.perk ?? "").trim() ||
    "Limited-time partner offer";
  if (!businessName || !dealTitle || !eventDate || !area) {
    return err("Promo payload is missing required fields.");
  }

  const categoryTag = promoTypeToDealCategoryTag(String(payload.promoType));
  const categoryLabel =
    String(payload.promoTypeLabel ?? "").trim() || categoryTag.replaceAll("_", " ");
  const studentOnly = Boolean(payload.studentOnly);
  const externalUrl = String(payload.externalUrl ?? "").trim() || null;
  const offer = perk;
  const urgencyLabel = "Verified deal";
  const nowIso = new Date().toISOString();

  let venueId: string;
  if (row.published_deal_id) {
    const { data: existing, error: exErr } = await client
      .from("deals")
      .select("venue_id")
      .eq("id", row.published_deal_id)
      .maybeSingle();
    if (exErr) return err(formatSupabasePostgrestError(exErr));
    if (!existing?.venue_id) return err("Published deal is missing a venue.");
    venueId = existing.venue_id;
    const { error: vUpd } = await client
      .from("venues")
      .update({ name: businessName, area })
      .eq("id", venueId);
    if (vUpd) return err(formatSupabasePostgrestError(vUpd));
  } else {
    const { data: venueRow, error: venueErr } = await client
      .from("venues")
      .insert({
        name: businessName,
        area,
        kind: "restaurant",
      })
      .select("id")
      .single();
    if (venueErr || !venueRow) {
      return err(formatSupabasePostgrestError(venueErr) || "Could not create venue.");
    }
    venueId = venueRow.id;
  }

  const dealInsert: Database["public"]["Tables"]["deals"]["Insert"] = {
    venue_id: venueId,
    title: dealTitle,
    category_tag: categoryTag,
    perk,
    valid_from: eventDate,
    valid_until: eventDate,
    description,
    image_url: imageUrl,
    external_url: externalUrl,
    student_only: studentOnly,
    created_by: row.user_id,
    business_user_id: row.user_id,
    business_name: businessName,
    category: categoryTag,
    category_label: categoryLabel,
    image_alt: dealTitle,
    offer,
    area,
    urgency_label: urgencyLabel,
    status: "approved",
    saves_count: 0,
    claims_count: 0,
    watching_count: 0,
    updated_at: nowIso,
  };

  let dealId = row.published_deal_id;

  if (dealId) {
    const { error: updDealErr } = await client
      .from("deals")
      .update({
        ...dealInsert,
        venue_id: venueId,
        updated_at: nowIso,
      })
      .eq("id", dealId);
    if (updDealErr) return err(formatSupabasePostgrestError(updDealErr));
  } else {
    const { data: dRow, error: insErr } = await client
      .from("deals")
      .insert(dealInsert)
      .select("id")
      .single();
    if (insErr || !dRow) return err(formatSupabasePostgrestError(insErr) || "Could not create deal.");
    dealId = dRow.id;
  }

  const { error: subErr } = await client
    .from("business_submissions")
    .update({
      status: "approved",
      reviewed_at: nowIso,
      reviewed_by: reviewerId,
      moderation_notes: moderationNotes ?? null,
      published_deal_id: dealId,
    })
    .eq("client_submission_id", row.client_submission_id);
  if (subErr) return err(formatSupabasePostgrestError(subErr));

  if (!dealId) return err("Could not resolve published deal id.");

  return { ok: true, data: { dealId } };
}

async function publishPlainBusinessDealSubmission(
  client: DbClient,
  row: Database["public"]["Tables"]["business_submissions"]["Row"],
  payload: BusinessDealPayloadJson,
  reviewerId: string,
  moderationNotes?: string
): Promise<CmsPublishResult<{ dealId: string }>> {
  const businessName = String(payload.businessName ?? "").trim();
  const dealTitle = String(payload.dealTitle ?? "").trim();
  const perk = String(payload.perk ?? "").trim();
  const validFrom = String(payload.validFrom ?? "").trim();
  const validUntil = String(payload.validUntil ?? "").trim();
  const area = String(payload.area ?? "").trim();
  const description = String(payload.description ?? "").trim() || dealTitle;
  const imageUrl = String(payload.imageUrl ?? "").trim();
  if (!businessName || !dealTitle || !perk || !validFrom || !validUntil || !area || !imageUrl) {
    return err("Deal payload is missing required fields.");
  }

  const categoryTag = coerceDealCategoryTag(payload.categoryTag);
  const categoryLabel =
    String(payload.categoryLabel ?? "").trim() || categoryTag.replaceAll("_", " ");
  const studentOnly = Boolean(payload.studentOnly);
  const externalUrl = String(payload.externalUrl ?? "").trim() || null;
  const offer = perk;
  const urgencyLabel = "Verified deal";
  const nowIso = new Date().toISOString();

  let venueId: string;
  if (row.published_deal_id) {
    const { data: existing, error: exErr } = await client
      .from("deals")
      .select("venue_id")
      .eq("id", row.published_deal_id)
      .maybeSingle();
    if (exErr) return err(formatSupabasePostgrestError(exErr));
    if (!existing?.venue_id) return err("Published deal is missing a venue.");
    venueId = existing.venue_id;
    const { error: vUpd } = await client
      .from("venues")
      .update({ name: businessName, area })
      .eq("id", venueId);
    if (vUpd) return err(formatSupabasePostgrestError(vUpd));
  } else {
    const { data: venueRow, error: venueErr } = await client
      .from("venues")
      .insert({
        name: businessName,
        area,
        kind: "restaurant",
      })
      .select("id")
      .single();
    if (venueErr || !venueRow) {
      return err(formatSupabasePostgrestError(venueErr) || "Could not create venue.");
    }
    venueId = venueRow.id;
  }

  const dealInsert: Database["public"]["Tables"]["deals"]["Insert"] = {
    venue_id: venueId,
    title: dealTitle,
    category_tag: categoryTag,
    perk,
    valid_from: validFrom,
    valid_until: validUntil,
    description,
    image_url: imageUrl,
    external_url: externalUrl,
    student_only: studentOnly,
    created_by: row.user_id,
    business_user_id: row.user_id,
    business_name: businessName,
    category: categoryTag,
    category_label: categoryLabel,
    image_alt: dealTitle,
    offer,
    area,
    urgency_label: urgencyLabel,
    status: "approved",
    saves_count: 0,
    claims_count: 0,
    watching_count: 0,
    updated_at: nowIso,
  };

  let dealId = row.published_deal_id;

  if (dealId) {
    const { error: updDealErr } = await client
      .from("deals")
      .update({
        ...dealInsert,
        venue_id: venueId,
        updated_at: nowIso,
      })
      .eq("id", dealId);
    if (updDealErr) return err(formatSupabasePostgrestError(updDealErr));
  } else {
    const { data: dRow, error: insErr } = await client
      .from("deals")
      .insert(dealInsert)
      .select("id")
      .single();
    if (insErr || !dRow) return err(formatSupabasePostgrestError(insErr) || "Could not create deal.");
    dealId = dRow.id;
  }

  const { error: subErr } = await client
    .from("business_submissions")
    .update({
      status: "approved",
      reviewed_at: nowIso,
      reviewed_by: reviewerId,
      moderation_notes: moderationNotes ?? null,
      published_deal_id: dealId,
    })
    .eq("client_submission_id", row.client_submission_id);
  if (subErr) return err(formatSupabasePostgrestError(subErr));

  if (!dealId) return err("Could not resolve published deal id.");

  return { ok: true, data: { dealId } };
}

/** Approve a pending `business_submissions` row: classic deals, or business event/promo bundles. */
export async function publishBusinessSubmissionForApproval(
  client: DbClient,
  clientSubmissionId: string,
  reviewerId: string,
  moderationNotes?: string
): Promise<CmsPublishResult<{ dealId?: string; eventId?: string }>> {
  const { data: row, error: fetchErr } = await client
    .from("business_submissions")
    .select("*")
    .eq("client_submission_id", clientSubmissionId)
    .maybeSingle();
  if (fetchErr) return err(formatSupabasePostgrestError(fetchErr));
  if (!row) return err("Submission not found.");
  if (row.status !== "pending") return err("Submission is not pending.");

  const payload = parseBusinessDealPayload(row.deal_payload);
  if (!payload) return err("Invalid deal payload.");

  if (payload.submissionKind === "event_promo") {
    if (isBusinessPromoDealLike(String(payload.promoType))) {
      const d = await publishBusinessEventPromoAsDeal(
        client,
        row,
        payload,
        reviewerId,
        moderationNotes
      );
      if (!d.ok) return d;
      return { ok: true, data: { dealId: d.data.dealId } };
    }
    const ev = await publishBusinessEventPromoAsEvent(
      client,
      row,
      payload,
      reviewerId,
      moderationNotes
    );
    if (!ev.ok) return ev;
    return { ok: true, data: { eventId: ev.data.eventId } };
  }

  return publishPlainBusinessDealSubmission(client, row, payload, reviewerId, moderationNotes);
}

/** @deprecated Prefer `publishBusinessSubmissionForApproval` (routes event/promo + deals). */
export async function publishBusinessSubmissionToDeal(
  client: DbClient,
  clientSubmissionId: string,
  reviewerId: string,
  moderationNotes?: string
): Promise<CmsPublishResult<{ dealId: string }>> {
  const r = await publishBusinessSubmissionForApproval(
    client,
    clientSubmissionId,
    reviewerId,
    moderationNotes
  );
  if (!r.ok) return r;
  if (!r.data.dealId) return err("This submission publishes as an event, not a deal.");
  return { ok: true, data: { dealId: r.data.dealId } };
}
