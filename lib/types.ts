export type EventCategory =
  | "frat_party"
  | "bar_club"
  | "student_org"
  | "food_deal"
  | "campus"
  | "concert"
  | "watch_party"
  | "pop_up"
  | "other";

export type CrowdStatus =
  | "warming_up"
  | "active"
  | "packed"
  | "line_forming"
  | "chill";

export type EntryType = "free" | "cover" | "rsvp";

/** Mock admin/host preview role; swap when auth exists */
export type MockUserRole =
  | "regular_user"
  | "host"
  | "business"
  | "admin";

export type RequestedRole = "none" | "host" | "business";
export type VerificationStatus = "none" | "pending" | "approved" | "rejected";

/**
 * Onboarding / feed personalization chips.
 * Mirrors categories plus product-specific tags — extend freely.
 */
export type PuInterestId =
  | EventCategory
  | "deals"
  | "live_music";

/** Deals hub filter chips — mock-local only */
export type DealFilterId =
  | "food"
  | "bars"
  | "coffee"
  | "late_night"
  | "student_discount"
  | "free_stuff"
  | "local_business";

/** Bars/clubs, restaurants, frats & student orgs — follow target (mock) */
export type FollowableVenueKind = "bar_club" | "restaurant" | "frat_student_org";

export interface PuFollowableVenue {
  id: string;
  name: string;
  kind: FollowableVenueKind;
  area: string;
  /** Short line for profile / lists */
  tagline: string;
  imageUrl: string;
}

/** Mock session fields — replace with auth user row later */
export interface MockProfileSession {
  username: string;
  fullName: string;
  campus: string;
  avatarUrl: string;
  role: MockUserRole;
  requestedRole: RequestedRole;
  verificationStatus: VerificationStatus;
  businessName: string;
  businessType: string;
  businessWebsite: string;
  businessContact: string;
  organizationName: string;
  organizationType: string;
  verificationNotes: string;
  /** ISO — “member since” */
  memberSince: string;
  onboardingComplete: boolean;
  interests: PuInterestId[];
  consentAnalytics: boolean;
  consentPersonalization: boolean;
  consentLocation: boolean;
  consentMarketing: boolean;
}

/** Food / drink / ticket drops — mock catalog */
export interface PuDeal {
  id: string;
  /** Follow / notify target — maps to `PuFollowableVenue.id` */
  venueId: string;
  title: string;
  venueLabel: string;
  area: string;
  perk: string;
  windowLabel: string;
  urgencyLabel: string;
  imageUrl: string;
  imageAlt: string;
  /** Short label shown on cards (Food, Bars, …) */
  categoryLabel: string;
  /** Which filter chips match this deal */
  filterTags: DealFilterId[];
  /** Higher sorts first in “Ending soon” */
  urgencyScore: number;
  savesCount: number;
  claimsLastHour: number;
  watchingCount: number;
  /** Secondary line near CTA, e.g. student ID */
  studentOnly?: boolean;
  /** YYYY-MM-DD end of validity when from Supabase */
  validUntil?: string;
}

export interface PuEvent {
  id: string;
  /** Follow target — maps to `PuFollowableVenue.id` (same id space as deals) */
  venueId: string;
  title: string;
  category: EventCategory;
  categoryLabel: string;
  area: string;
  venueName: string;
  /** ISO 8601 local-friendly string for mock display */
  startsAt: string;
  endsAt: string;
  coverCents: number | null;
  entryType: EntryType;
  stagRule: string;
  ageRestriction: string;
  vibeMusic: string;
  crowdStatus: CrowdStatus;
  urgencyLabels: string[];
  imageUrl: string;
  imageAlt: string;
  /** Higher = more prominent in Hot Right Now */
  heatScore: number;
  /** Mock: happening now — drives LIVE ribbon + pulse */
  liveNow: boolean;
  /** Bookmark-style momentum */
  savesCount: number;
  /** RSVP headcount when synced from Supabase. */
  rsvpsCount?: number;
  /** Eyes on it tonight */
  spottingCount: number;
  /** \"Pulling up\" telemetry (mock) */
  pullUpsLastHour: number;
  /** 0–100 for thin capacity strip; omit when not meaningful */
  fillPressurePct?: number;
  /** Top ranks on campus tonight (mock); omit if not trending */
  campusTrendRank?: number;
  /** Live momentum label (Building, Packed, …) */
  momentumLabel?: string;
  /** Combined trending score for section ordering */
  trendingScore?: number;
  /** Row touch time for velocity decay (ISO) */
  updatedAt?: string;
  /** Narrative vibe + logistics */
  description: string;
  /** Who’s putting it on (chapter, promoter, venue, org) — no public roster */
  hostLabel: string;
  /** Promo / RSVP off-app (mock URL) */
  externalUrl?: string;
}
