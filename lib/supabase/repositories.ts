import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "@/lib/supabase/database.types";
import type {
  MockProfileSession,
  MockUserRole,
  RequestedRole,
} from "@/lib/types";

type DbClient = SupabaseClient;

export type DbProfile = Database["public"]["Tables"]["profiles"]["Row"];
type ModerationStatus = "approved" | "rejected";

function isValidUrl(value: string): boolean {
  try {
    const u = new URL(value);
    return u.protocol === "https:" || u.protocol === "http:";
  } catch {
    return false;
  }
}

export async function getProfileById(client: DbClient, userId: string) {
  const { data, error } = await client
    .from("profiles")
    .select("*")
    .eq("id", userId)
    .single();
  if (error) return null;
  return data;
}

export async function upsertProfile(
  client: DbClient,
  profile: Database["public"]["Tables"]["profiles"]["Insert"]
) {
  return client.from("profiles").upsert(profile).select("*").single();
}

export async function setProfileRole(
  client: DbClient,
  userId: string,
  role: MockUserRole
) {
  return client.from("profiles").update({ role }).eq("id", userId);
}

export async function updateProfileVerification(
  client: DbClient,
  userId: string,
  input: {
    role?: MockUserRole;
    requestedRole?: RequestedRole;
    verificationStatus?: "none" | "pending" | "approved" | "rejected";
    verificationNotes?: string | null;
  }
) {
  return client
    .from("profiles")
    .update({
      role: input.role,
      requested_role: input.requestedRole,
      verification_status: input.verificationStatus,
      verification_notes: input.verificationNotes ?? null,
    })
    .eq("id", userId);
}

export async function listSavedEventIds(client: DbClient, userId: string) {
  const { data } = await client
    .from("saved_events")
    .select("event_id")
    .eq("user_id", userId);
  return (data ?? []).map((x) => x.event_id);
}

export async function listRsvpEventIds(client: DbClient, userId: string) {
  const { data } = await client.from("rsvps").select("event_id").eq("user_id", userId);
  return (data ?? []).map((x) => x.event_id);
}

export async function listFollowedVenueIds(client: DbClient, userId: string) {
  const { data } = await client
    .from("venue_follows")
    .select("venue_id")
    .eq("user_id", userId);
  return (data ?? []).map((x) => x.venue_id);
}

export async function listInterests(client: DbClient, userId: string) {
  const { data } = await client
    .from("interest_preferences")
    .select("interest")
    .eq("user_id", userId);
  return (data ?? []).map((x) => x.interest);
}

export async function listVenues(client: DbClient) {
  const { data, error } = await client
    .from("venues")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) return [];
  return data;
}

export async function listApprovedEvents(client: DbClient) {
  const { data, error } = await client
    .from("events")
    .select("*")
    .eq("status", "approved")
    .order("starts_at", { ascending: true });
  if (error) return [];
  return data;
}

export async function listApprovedDeals(client: DbClient) {
  const { data, error } = await client
    .from("deals")
    .select("*")
    .eq("status", "approved")
    .order("valid_until", { ascending: true });
  if (error) return [];
  return data;
}

export async function toggleSavedEvent(
  client: DbClient,
  userId: string,
  eventId: string,
  shouldSave: boolean
) {
  if (shouldSave) {
    return client.from("saved_events").upsert({ user_id: userId, event_id: eventId });
  }
  return client.from("saved_events").delete().eq("user_id", userId).eq("event_id", eventId);
}

export async function toggleRsvp(
  client: DbClient,
  userId: string,
  eventId: string,
  shouldRsvp: boolean
) {
  if (shouldRsvp) {
    return client.from("rsvps").upsert({ user_id: userId, event_id: eventId });
  }
  return client.from("rsvps").delete().eq("user_id", userId).eq("event_id", eventId);
}

export async function toggleVenueFollow(
  client: DbClient,
  userId: string,
  venueId: string,
  shouldFollow: boolean
) {
  if (shouldFollow) {
    return client.from("venue_follows").upsert({ user_id: userId, venue_id: venueId });
  }
  return client.from("venue_follows").delete().eq("user_id", userId).eq("venue_id", venueId);
}

export async function replaceInterests(
  client: DbClient,
  userId: string,
  interests: Database["public"]["Tables"]["interest_preferences"]["Insert"]["interest"][]
) {
  await client.from("interest_preferences").delete().eq("user_id", userId);
  if (interests.length === 0) return { error: null };
  return client
    .from("interest_preferences")
    .insert(interests.map((interest) => ({ user_id: userId, interest })));
}

export async function createAccessRequest(
  client: DbClient,
  userId: string,
  requestedRole: Exclude<RequestedRole, "none">,
  note: string,
  metadata?: Database["public"]["Tables"]["access_requests"]["Insert"]["metadata"]
) {
  return client.from("access_requests").insert({
    user_id: userId,
    requested_role: requestedRole,
    note: note || null,
    metadata: metadata ?? null,
  });
}

export async function moderateAccessRequest(
  client: DbClient,
  requestId: string,
  reviewerUserId: string,
  status: "approved" | "rejected",
  moderationNotes?: string
) {
  return client
    .from("access_requests")
    .update({
      status,
      reviewed_by: reviewerUserId,
      reviewed_at: new Date().toISOString(),
      moderation_notes: moderationNotes ?? null,
    })
    .eq("id", requestId)
    .select("*")
    .single();
}

export async function listPendingAccessRequests(client: DbClient) {
  const { data, error } = await client
    .from("access_requests")
    .select("*")
    .eq("status", "pending")
    .order("created_at", { ascending: false });
  if (error) return [] as Database["public"]["Tables"]["access_requests"]["Row"][];
  return data ?? [];
}

export async function listHostSubmissions(client: DbClient, pendingOnly = true) {
  let query = client.from("host_submissions").select("*").order("created_at", { ascending: false });
  if (pendingOnly) query = query.eq("status", "pending");
  const { data, error } = await query;
  if (error) return [] as Database["public"]["Tables"]["host_submissions"]["Row"][];
  return data ?? [];
}

export async function listBusinessSubmissions(client: DbClient, pendingOnly = true) {
  let query = client
    .from("business_submissions")
    .select("*")
    .order("created_at", { ascending: false });
  if (pendingOnly) query = query.eq("status", "pending");
  const { data, error } = await query;
  if (error) return [] as Database["public"]["Tables"]["business_submissions"]["Row"][];
  return data ?? [];
}

export async function createHostSubmission(
  client: DbClient,
  userId: string,
  clientSubmissionId: string,
  payload: Database["public"]["Tables"]["host_submissions"]["Insert"]["event_payload"]
) {
  const item = payload as Record<string, string | number | boolean | null | undefined>;
  const requiredFields = [
    "title",
    "date",
    "startTime",
    "endTime",
    "area",
    "venue",
    "description",
    "imageUrl",
  ] as const;
  for (const key of requiredFields) {
    if (!String(item[key] ?? "").trim()) {
      return { error: { message: `Missing required field: ${key}` } };
    }
  }
  const desc = String(item.description ?? "").trim();
  if (desc.length < 16) {
    return { error: { message: "Description is too short." } };
  }
  const cover = item.coverDollars;
  if (typeof cover === "number" && (cover < 0 || cover > 300)) {
    return { error: { message: "Cover price must be between $0 and $300." } };
  }
  const imageUrl = String(item.imageUrl ?? "");
  if (!isValidUrl(imageUrl)) {
    return { error: { message: "Image URL must be a valid http(s) URL." } };
  }
  const externalUrl = String(item.externalUrl ?? "").trim();
  if (externalUrl && !isValidUrl(externalUrl)) {
    return { error: { message: "External URL must be a valid http(s) URL." } };
  }
  return client.from("host_submissions").insert({
    user_id: userId,
    client_submission_id: clientSubmissionId,
    event_payload: payload,
  });
}

export async function createBusinessSubmission(
  client: DbClient,
  userId: string,
  clientSubmissionId: string,
  payload: Database["public"]["Tables"]["business_submissions"]["Insert"]["deal_payload"]
) {
  const item = payload as Record<string, string | number | boolean | null | undefined>;
  const requiredFields = [
    "businessName",
    "dealTitle",
    "perk",
    "validFrom",
    "validUntil",
    "area",
    "description",
    "imageUrl",
  ] as const;
  for (const key of requiredFields) {
    if (!String(item[key] ?? "").trim()) {
      return { error: { message: `Missing required field: ${key}` } };
    }
  }
  const desc = String(item.description ?? "").trim();
  if (desc.length < 12) {
    return { error: { message: "Description is too short." } };
  }
  const imageUrl = String(item.imageUrl ?? "");
  if (!isValidUrl(imageUrl)) {
    return { error: { message: "Image URL must be a valid http(s) URL." } };
  }
  const externalUrl = String(item.externalUrl ?? "").trim();
  if (externalUrl && !isValidUrl(externalUrl)) {
    return { error: { message: "External URL must be a valid http(s) URL." } };
  }
  return client.from("business_submissions").insert({
    user_id: userId,
    client_submission_id: clientSubmissionId,
    deal_payload: payload,
  });
}

export async function moderateHostSubmission(
  client: DbClient,
  clientSubmissionId: string,
  reviewedBy: string,
  status: ModerationStatus,
  moderationNotes?: string
) {
  return client
    .from("host_submissions")
    .update({
      status,
      reviewed_at: new Date().toISOString(),
      reviewed_by: reviewedBy,
      moderation_notes: moderationNotes ?? null,
    })
    .eq("client_submission_id", clientSubmissionId);
}

export async function moderateBusinessSubmission(
  client: DbClient,
  clientSubmissionId: string,
  reviewedBy: string,
  status: ModerationStatus,
  moderationNotes?: string
) {
  return client
    .from("business_submissions")
    .update({
      status,
      reviewed_at: new Date().toISOString(),
      reviewed_by: reviewedBy,
      moderation_notes: moderationNotes ?? null,
    })
    .eq("client_submission_id", clientSubmissionId);
}

export async function createConsentEvent(
  client: DbClient,
  userId: string,
  consentType: Database["public"]["Tables"]["consent_events"]["Insert"]["consent_type"],
  value: boolean,
  source: Database["public"]["Tables"]["consent_events"]["Insert"]["source"]
) {
  return client.from("consent_events").insert({
    user_id: userId,
    consent_type: consentType,
    value,
    source,
  });
}

export function profileRowToMockSession(profile: DbProfile): MockProfileSession {
  return {
    username: profile.username,
    fullName: profile.full_name ?? "",
    campus: profile.campus ?? "",
    avatarUrl:
      profile.avatar_url ??
      "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&q=80",
    role: profile.role,
    requestedRole: profile.requested_role,
    verificationStatus: profile.verification_status,
    businessName: profile.business_name ?? "",
    businessType: profile.business_type ?? "",
    businessWebsite: profile.business_website ?? "",
    businessContact: profile.business_contact ?? "",
    organizationName: profile.organization_name ?? "",
    organizationType: profile.organization_type ?? "",
    verificationNotes: profile.verification_notes ?? "",
    memberSince: profile.created_at,
    onboardingComplete: profile.onboarding_complete,
    interests: profile.interests,
    consentAnalytics: profile.consent_analytics,
    consentPersonalization: profile.consent_personalization,
    consentLocation: profile.consent_location,
    consentMarketing: profile.consent_marketing,
  };
}
