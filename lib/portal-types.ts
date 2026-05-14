import type { BusinessPromoTypeId } from "@/lib/supabase/business-deal-payload";
import type { DealFilterId, EntryType, EventCategory } from "@/lib/types";

/** Local-only queue item for admin moderation */
export type PortalSubmissionStatus = "pending" | "approved" | "rejected";

export interface PendingHostEventSubmission {
  id: string;
  submittedAt: string;
  status: PortalSubmissionStatus;
  title: string;
  category: EventCategory;
  categoryLabel: string;
  /** YYYY-MM-DD */
  date: string;
  startTime: string;
  endTime: string;
  area: string;
  venue: string;
  /** Whole dollars for display; null = free/no cover field */
  coverDollars: number | null;
  entryType: EntryType;
  stagRule: string;
  ageRestriction: string;
  vibeMusic: string;
  description: string;
  imageUrl: string;
  externalUrl: string;
}

export interface PendingBusinessDealSubmission {
  id: string;
  submittedAt: string;
  status: PortalSubmissionStatus;
  /** Omitted or `"deal"` = classic deal submission. */
  submissionKind?: "deal" | "event_promo";
  businessName: string;
  dealTitle: string;
  categoryLabel: string;
  categoryTag: DealFilterId;
  perk: string;
  validFrom: string;
  validUntil: string;
  area: string;
  studentOnly: boolean;
  description: string;
  imageUrl: string;
  externalUrl: string;
  /** Event/promo bundle fields (when `submissionKind === "event_promo"`). */
  promoType?: string;
  promoTypeLabel?: string;
  eventDate?: string;
  eventStartTime?: string;
  eventEndTime?: string;
  entryInfo?: string;
  expectedVibe?: string;
}

/** Host form — maps cleanly to a future Supabase insert */
export type HostEventFormValues = {
  title: string;
  category: EventCategory;
  date: string;
  startTime: string;
  endTime: string;
  area: string;
  venue: string;
  coverDollars: string;
  entryType: EntryType;
  stagRule: string;
  ageRestriction: string;
  vibeMusic: string;
  description: string;
  imageUrl: string;
  externalUrl: string;
};

/** Business form — maps cleanly to a future Supabase insert */
export type BusinessDealFormValues = {
  businessName: string;
  dealTitle: string;
  categoryTag: DealFilterId;
  perk: string;
  validFrom: string;
  validUntil: string;
  area: string;
  studentOnly: boolean;
  description: string;
  imageUrl: string;
  externalUrl: string;
};

export type BusinessEventPromoFormValues = {
  businessName: string;
  promoTitle: string;
  promoType: BusinessPromoTypeId;
  description: string;
  eventDate: string;
  startTime: string;
  endTime: string;
  area: string;
  imageUrl: string;
  entryInfo: string;
  studentOnly: boolean;
  expectedVibe: string;
  externalUrl: string;
};
