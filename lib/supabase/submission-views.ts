import type { Database } from "@/lib/supabase/database.types";
import {
  coerceEntryType,
  coerceEventCategory,
  parseHostEventPayload,
} from "@/lib/supabase/host-event-payload";
import {
  coerceDealCategoryTag,
  parseBusinessDealPayload,
} from "@/lib/supabase/business-deal-payload";
import type {
  PendingBusinessDealSubmission,
  PendingHostEventSubmission,
  PortalSubmissionStatus,
} from "@/lib/portal-types";

function mapSubmissionStatus(s: "pending" | "approved" | "rejected"): PortalSubmissionStatus {
  if (s === "pending") return "pending";
  if (s === "approved") return "approved";
  return "rejected";
}

export function hostSubmissionRowToPending(
  row: Database["public"]["Tables"]["host_submissions"]["Row"]
): PendingHostEventSubmission | null {
  const p = parseHostEventPayload(row.event_payload);
  if (!p || !row.client_submission_id) return null;
  const category = coerceEventCategory(p.category);
  const categoryLabel =
    String(p.categoryLabel ?? "").trim() || category.replaceAll("_", " ");
  const cover =
    typeof p.coverDollars === "number" && Number.isFinite(p.coverDollars)
      ? p.coverDollars
      : null;
  return {
    id: row.client_submission_id,
    submittedAt: row.created_at,
    status: mapSubmissionStatus(row.status),
    title: String(p.title ?? ""),
    category,
    categoryLabel,
    date: String(p.date ?? ""),
    startTime: String(p.startTime ?? ""),
    endTime: String(p.endTime ?? ""),
    area: String(p.area ?? ""),
    venue: String(p.venue ?? ""),
    coverDollars: cover,
    entryType: coerceEntryType(p.entryType),
    stagRule: String(p.stagRule ?? ""),
    ageRestriction: String(p.ageRestriction ?? ""),
    vibeMusic: String(p.vibeMusic ?? ""),
    description: String(p.description ?? ""),
    imageUrl: String(p.imageUrl ?? ""),
    externalUrl: String(p.externalUrl ?? ""),
  };
}

export function businessSubmissionRowToPending(
  row: Database["public"]["Tables"]["business_submissions"]["Row"]
): PendingBusinessDealSubmission | null {
  const p = parseBusinessDealPayload(row.deal_payload);
  if (!p || !row.client_submission_id) return null;
  const kind = p.submissionKind === "event_promo" ? "event_promo" : "deal";
  const categoryTag = coerceDealCategoryTag(p.categoryTag);
  const categoryLabel =
    String(p.categoryLabel ?? "").trim() || categoryTag.replaceAll("_", " ");
  const promoType = String(p.promoType ?? "").trim();
  const promoTypeLabel = String(p.promoTypeLabel ?? "").trim() || promoType.replaceAll("_", " ");
  const eventDate = String(p.eventDate ?? "").trim() || String(p.validFrom ?? "").trim();
  const eventStartTime = String(p.startTime ?? "").trim();
  const eventEndTime = String(p.endTime ?? "").trim();
  const entryInfo = String(p.entryInfo ?? "").trim();
  const expectedVibe = String(p.expectedVibe ?? "").trim();
  return {
    id: row.client_submission_id,
    submittedAt: row.created_at,
    status: mapSubmissionStatus(row.status),
    submissionKind: kind,
    businessName: String(p.businessName ?? ""),
    dealTitle: String(p.dealTitle ?? ""),
    categoryLabel,
    categoryTag,
    perk: String(p.perk ?? ""),
    validFrom: String(p.validFrom ?? ""),
    validUntil: String(p.validUntil ?? ""),
    area: String(p.area ?? ""),
    studentOnly: Boolean(p.studentOnly),
    description: String(p.description ?? ""),
    imageUrl: String(p.imageUrl ?? ""),
    externalUrl: String(p.externalUrl ?? ""),
    promoType: kind === "event_promo" ? promoType : undefined,
    promoTypeLabel: kind === "event_promo" ? promoTypeLabel : undefined,
    eventDate: kind === "event_promo" ? eventDate : undefined,
    eventStartTime: kind === "event_promo" ? eventStartTime : undefined,
    eventEndTime: kind === "event_promo" ? eventEndTime : undefined,
    entryInfo: kind === "event_promo" ? entryInfo : undefined,
    expectedVibe: kind === "event_promo" ? expectedVibe : undefined,
  };
}
