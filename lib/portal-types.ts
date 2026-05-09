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
