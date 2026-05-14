import type { DealFilterId, EventCategory } from "@/lib/types";

export type BusinessSubmissionKind = "deal" | "event_promo";

/** Stored in `business_submissions.deal_payload` for operator-created promos. */
export type BusinessPromoTypeId =
  | "event"
  | "promo"
  | "food_special"
  | "watch_party"
  | "live_music"
  | "limited_drop"
  | "other";

export type BusinessDealPayloadJson = {
  id?: string;
  submissionKind?: BusinessSubmissionKind;
  businessName?: string;
  dealTitle?: string;
  /** When `submissionKind === "event_promo"`, mirrors dealTitle for moderation. */
  promoType?: BusinessPromoTypeId | string;
  promoTypeLabel?: string;
  eventDate?: string;
  startTime?: string;
  endTime?: string;
  entryInfo?: string;
  expectedVibe?: string;
  categoryLabel?: string;
  categoryTag?: string;
  perk?: string;
  validFrom?: string;
  validUntil?: string;
  area?: string;
  studentOnly?: boolean;
  description?: string;
  imageUrl?: string;
  externalUrl?: string;
};

/** Flyer fallback when business leaves image URL empty (events require an image row). */
export const DEFAULT_BUSINESS_EVENT_IMAGE =
  "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=800&q=80";

export function isBusinessPromoDealLike(promoType: string | undefined): boolean {
  const t = String(promoType ?? "").trim();
  return t === "food_special" || t === "limited_drop";
}

export function promoTypeToEventCategory(promoType: string | undefined): EventCategory {
  const t = String(promoType ?? "").trim();
  switch (t) {
    case "event":
      return "campus";
    case "promo":
      return "pop_up";
    case "watch_party":
      return "watch_party";
    case "live_music":
      return "concert";
    case "food_special":
      return "food_deal";
    case "limited_drop":
      return "pop_up";
    default:
      return "other";
  }
}

export function promoTypeToDealCategoryTag(promoType: string | undefined): DealFilterId {
  const t = String(promoType ?? "").trim();
  if (t === "food_special") return "food";
  if (t === "limited_drop") return "free_stuff";
  return "local_business";
}

const DEAL_TAGS: readonly DealFilterId[] = [
  "food",
  "bars",
  "coffee",
  "late_night",
  "student_discount",
  "free_stuff",
  "local_business",
] as const;

function isDealFilterId(v: string): v is DealFilterId {
  return (DEAL_TAGS as readonly string[]).includes(v);
}

export function parseBusinessDealPayload(raw: unknown): BusinessDealPayloadJson | null {
  if (!raw || typeof raw !== "object") return null;
  return raw as BusinessDealPayloadJson;
}

export function coerceDealCategoryTag(raw: string | undefined): DealFilterId {
  if (raw && isDealFilterId(raw)) return raw;
  return "local_business";
}
