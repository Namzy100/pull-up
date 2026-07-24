import { sql } from "drizzle-orm";
import { index, integer, real, sqliteTable, text } from "drizzle-orm/sqlite-core";

export const campuses = sqliteTable("campuses", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  city: text("city").notNull(),
  timezone: text("timezone").notNull().default("America/Chicago"),
  createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
});

export const profiles = sqliteTable(
  "profiles",
  {
    id: text("id").primaryKey(),
    email: text("email").notNull().unique(),
    displayName: text("display_name").notNull(),
    campusId: text("campus_id").references(() => campuses.id),
    role: text("role", { enum: ["student", "host", "admin"] }).notNull().default("student"),
    avatarUrl: text("avatar_url"),
    bio: text("bio").notNull().default(""),
    classYear: text("class_year"),
    createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
    updatedAt: text("updated_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  },
  (table) => [index("profiles_campus_idx").on(table.campusId)],
);

export const hostOrganizations = sqliteTable(
  "host_organizations",
  {
    id: text("id").primaryKey(),
    campusId: text("campus_id").notNull().references(() => campuses.id),
    ownerProfileId: text("owner_profile_id").notNull().references(() => profiles.id),
    name: text("name").notNull(),
    kind: text("kind", { enum: ["frat", "bar", "pub", "club", "student_org", "house"] }).notNull(),
    verificationStatus: text("verification_status", {
      enum: ["pending", "verified", "restricted"],
    })
      .notNull()
      .default("pending"),
    createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  },
  (table) => [
    index("host_orgs_campus_idx").on(table.campusId),
    index("host_orgs_owner_idx").on(table.ownerProfileId),
  ],
);

export const venues = sqliteTable(
  "venues",
  {
    id: text("id").primaryKey(),
    campusId: text("campus_id").notNull().references(() => campuses.id),
    hostOrganizationId: text("host_organization_id").references(() => hostOrganizations.id),
    name: text("name").notNull(),
    kind: text("kind", { enum: ["frat_house", "bar", "pub", "club", "apartment", "campus_space"] })
      .notNull(),
    address: text("address"),
    latitude: real("latitude"),
    longitude: real("longitude"),
    ageRule: text("age_rule").notNull().default("Unknown"),
    defaultCover: text("default_cover").notNull().default("Unknown"),
    visibility: text("visibility", { enum: ["public", "invite_only", "admin_hidden"] })
      .notNull()
      .default("public"),
    createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  },
  (table) => [
    index("venues_campus_idx").on(table.campusId),
    index("venues_host_idx").on(table.hostOrganizationId),
  ],
);

export const events = sqliteTable(
  "events",
  {
    id: text("id").primaryKey(),
    campusId: text("campus_id").notNull().references(() => campuses.id),
    venueId: text("venue_id").notNull().references(() => venues.id),
    hostOrganizationId: text("host_organization_id").notNull().references(() => hostOrganizations.id),
    title: text("title").notNull(),
    description: text("description").notNull().default(""),
    startsAt: text("starts_at").notNull(),
    endsAt: text("ends_at").notNull(),
    status: text("status", { enum: ["draft", "submitted", "approved", "live", "ended", "rejected"] })
      .notNull()
      .default("draft"),
    cover: text("cover").notNull().default("Unknown"),
    ageRule: text("age_rule").notNull().default("Unknown"),
    capacityEstimate: integer("capacity_estimate"),
    inviteMode: text("invite_mode", { enum: ["open", "invite_link", "friends_of_friends"] })
      .notNull()
      .default("open"),
    createdByProfileId: text("created_by_profile_id").notNull().references(() => profiles.id),
    createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
    updatedAt: text("updated_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  },
  (table) => [
    index("events_campus_status_idx").on(table.campusId, table.status),
    index("events_host_idx").on(table.hostOrganizationId),
    index("events_starts_at_idx").on(table.startsAt),
  ],
);

export const attendances = sqliteTable(
  "attendances",
  {
    id: text("id").primaryKey(),
    eventId: text("event_id").notNull().references(() => events.id),
    profileId: text("profile_id").notNull().references(() => profiles.id),
    status: text("status", { enum: ["interested", "going", "arrived", "left", "not_going"] })
      .notNull()
      .default("interested"),
    visibility: text("visibility", { enum: ["private", "friends", "host_aggregate"] })
      .notNull()
      .default("friends"),
    createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
    updatedAt: text("updated_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  },
  (table) => [
    index("attendance_event_idx").on(table.eventId),
    index("attendance_profile_idx").on(table.profileId),
  ],
);

export const hostReports = sqliteTable(
  "host_reports",
  {
    id: text("id").primaryKey(),
    eventId: text("event_id").notNull().references(() => events.id),
    submittedByProfileId: text("submitted_by_profile_id").notNull().references(() => profiles.id),
    lineState: text("line_state", { enum: ["quiet", "moving", "building", "at_capacity"] }).notNull(),
    capacityPressure: integer("capacity_pressure").notNull(),
    note: text("note").notNull().default(""),
    reviewStatus: text("review_status", { enum: ["pending", "approved", "downweighted", "rejected"] })
      .notNull()
      .default("pending"),
    createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  },
  (table) => [
    index("host_reports_event_idx").on(table.eventId),
    index("host_reports_status_idx").on(table.reviewStatus),
  ],
);

export const signalEvents = sqliteTable(
  "signal_events",
  {
    id: text("id").primaryKey(),
    eventId: text("event_id").notNull().references(() => events.id),
    profileId: text("profile_id").references(() => profiles.id),
    source: text("source", {
      enum: ["attendance", "checkin", "friend_intent", "host_report", "ambassador", "admin_adjustment"],
    }).notNull(),
    weight: real("weight").notNull(),
    verificationLevel: real("verification_level").notNull(),
    trustScore: real("trust_score").notNull(),
    expiresAt: text("expires_at").notNull(),
    metadataJson: text("metadata_json").notNull().default("{}"),
    createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  },
  (table) => [
    index("signals_event_idx").on(table.eventId),
    index("signals_source_idx").on(table.source),
    index("signals_expires_idx").on(table.expiresAt),
  ],
);

export const eventScores = sqliteTable(
  "event_scores",
  {
    eventId: text("event_id").primaryKey().references(() => events.id),
    state: text("state", { enum: ["rising", "stable", "uncertain"] }).notNull(),
    confidence: integer("confidence").notNull(),
    demandQuality: integer("demand_quality").notNull(),
    manipulationRisk: text("manipulation_risk", { enum: ["low", "watch", "high"] }).notNull(),
    explanation: text("explanation").notNull(),
    computedAt: text("computed_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  },
);

export const moderationReviews = sqliteTable(
  "moderation_reviews",
  {
    id: text("id").primaryKey(),
    eventId: text("event_id").notNull().references(() => events.id),
    reviewerProfileId: text("reviewer_profile_id").references(() => profiles.id),
    severity: text("severity", { enum: ["low", "watch", "high"] }).notNull(),
    status: text("status", { enum: ["open", "approved", "abstained", "escalated", "closed"] })
      .notNull()
      .default("open"),
    reason: text("reason").notNull(),
    decision: text("decision").notNull().default(""),
    createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
    updatedAt: text("updated_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  },
  (table) => [
    index("moderation_event_idx").on(table.eventId),
    index("moderation_status_idx").on(table.status),
  ],
);
