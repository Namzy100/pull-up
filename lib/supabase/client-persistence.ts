"use client";

import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { hasSupabaseEnv } from "@/lib/supabase/env";
import {
  publishBusinessSubmissionForApproval,
  publishHostSubmissionToEvent,
} from "@/lib/supabase/cms-publish";
import { formatSupabasePostgrestError } from "@/lib/supabase/postgrest-error";
import type { Database, Json } from "@/lib/supabase/database.types";
import {
  createAccessRequest,
  createConsentEvent,
  createBusinessSubmission,
  createHostSubmission,
  getProfileById,
  insertEngagementEvent,
  listFollowedVenueIds,
  listInterests,
  listRsvpEventIds,
  listSavedEventIds,
  moderateAccessRequest,
  moderateBusinessSubmission,
  moderateHostSubmission,
  profileRowToMockSession,
  replaceInterests,
  toggleRsvp,
  toggleSavedEvent,
  toggleVenueFollow,
  updateProfileVerification,
  upsertProfile,
} from "@/lib/supabase/repositories";
import type { MockProfileSession, PuInterestId } from "@/lib/types";

async function getAuthedUserId() {
  const supabase = createSupabaseBrowserClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user?.id ?? null;
}

export async function syncProfileStateFromSupabase() {
  const supabase = createSupabaseBrowserClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;
  const userId = user.id;
  const profile = await getProfileById(supabase, userId);
  const savedEventIds = await listSavedEventIds(supabase, userId);
  const rsvpedEventIds = await listRsvpEventIds(supabase, userId);
  const followedVenueIds = await listFollowedVenueIds(supabase, userId);
  const interests = await listInterests(supabase, userId);
  const fallbackProfile: MockProfileSession = {
    username: user.email?.split("@")[0] ?? "new_user",
    fullName: "",
    campus: "",
    avatarUrl:
      "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&q=80",
    role: "regular_user",
    requestedRole: "none",
    verificationStatus: "none",
    businessName: "",
    businessType: "",
    businessWebsite: "",
    businessContact: "",
    organizationName: "",
    organizationType: "",
    verificationNotes: "",
    memberSince: new Date().toISOString(),
    onboardingComplete: false,
    interests: [],
    consentAnalytics: false,
    consentPersonalization: false,
    consentLocation: false,
    consentMarketing: false,
  };
  return {
    profile: profile ? profileRowToMockSession(profile) : fallbackProfile,
    savedEventIds,
    rsvpedEventIds,
    followedVenueIds,
    interests: interests as PuInterestId[],
  };
}

export async function recordEventSurfaceView(eventId: string) {
  const userId = await getAuthedUserId();
  if (!userId || !hasSupabaseEnv()) return;
  const supabase = createSupabaseBrowserClient();
  void insertEngagementEvent(supabase, {
    user_id: userId,
    subject_type: "event",
    subject_id: eventId,
    action: "view",
  });
}

export async function persistSavedEvent(eventId: string, shouldSave: boolean) {
  const userId = await getAuthedUserId();
  if (!userId) return { error: null };
  const supabase = createSupabaseBrowserClient();
  const result = await toggleSavedEvent(supabase, userId, eventId, shouldSave);
  if (result.error) console.error("persistSavedEvent failed", result.error.message);
  else if (hasSupabaseEnv()) {
    void insertEngagementEvent(supabase, {
      user_id: userId,
      subject_type: "event",
      subject_id: eventId,
      action: shouldSave ? "save" : "unsave",
    });
  }
  return result;
}

export async function persistRsvp(eventId: string, shouldRsvp: boolean) {
  const userId = await getAuthedUserId();
  if (!userId) return { error: null };
  const supabase = createSupabaseBrowserClient();
  const result = await toggleRsvp(supabase, userId, eventId, shouldRsvp);
  if (result.error) console.error("persistRsvp failed", result.error.message);
  else if (hasSupabaseEnv()) {
    void insertEngagementEvent(supabase, {
      user_id: userId,
      subject_type: "event",
      subject_id: eventId,
      action: shouldRsvp ? "rsvp" : "unrsvp",
    });
  }
  return result;
}

export async function persistVenueFollow(venueId: string, shouldFollow: boolean) {
  const userId = await getAuthedUserId();
  if (!userId) return { error: null };
  const supabase = createSupabaseBrowserClient();
  const result = await toggleVenueFollow(supabase, userId, venueId, shouldFollow);
  if (result.error) console.error("persistVenueFollow failed", result.error.message);
  else if (hasSupabaseEnv()) {
    void insertEngagementEvent(supabase, {
      user_id: userId,
      subject_type: "venue",
      subject_id: venueId,
      action: shouldFollow ? "follow" : "unfollow",
    });
  }
  return result;
}

export async function persistInterests(interests: PuInterestId[]) {
  const userId = await getAuthedUserId();
  if (!userId) return { error: null };
  const supabase = createSupabaseBrowserClient();
  const result = await replaceInterests(supabase, userId, interests);
  if (result.error) console.error("persistInterests failed", result.error.message);
  return result;
}

export async function persistProfile(profile: MockProfileSession) {
  const supabase = createSupabaseBrowserClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const userId = user?.id ?? null;
  if (!userId) return { error: null };
  const result = await upsertProfile(supabase, {
    id: userId,
    username: profile.username,
    full_name: profile.fullName || null,
    avatar_url: profile.avatarUrl || null,
    campus: profile.campus || null,
    role: profile.role,
    requested_role: profile.requestedRole,
    verification_status: profile.verificationStatus,
    business_name: profile.businessName || null,
    business_type: profile.businessType || null,
    business_website: profile.businessWebsite || null,
    business_contact: profile.businessContact || null,
    organization_name: profile.organizationName || null,
    organization_type: profile.organizationType || null,
    verification_notes: profile.verificationNotes || null,
    onboarding_complete: profile.onboardingComplete,
    interests: profile.interests,
    consent_analytics: profile.consentAnalytics,
    consent_personalization: profile.consentPersonalization,
    consent_location: profile.consentLocation,
    consent_marketing: profile.consentMarketing,
  });
  if (result.error) {
    const email = user?.email ?? null;
    const safeEmail = email
      ? `${email.slice(0, 2)}***@${email.split("@")[1] ?? "hidden"}`
      : null;
    console.error("[persistProfile]", {
      authUserId: userId,
      email: safeEmail,
      targetProfileId: userId,
      error: formatSupabasePostgrestError(result.error),
      code: result.error.code,
    });
  }
  return result;
}

export async function persistHostSubmission(payload: Json) {
  const userId = await getAuthedUserId();
  if (!userId) return;
  const supabase = createSupabaseBrowserClient();
  const obj = payload as Record<string, unknown>;
  const clientSubmissionId = String(obj.id ?? "");
  if (!clientSubmissionId) return;
  return createHostSubmission(supabase, userId, clientSubmissionId, payload);
}

export async function persistBusinessSubmission(payload: Json) {
  const userId = await getAuthedUserId();
  if (!userId) return;
  const supabase = createSupabaseBrowserClient();
  const obj = payload as Record<string, unknown>;
  const clientSubmissionId = String(obj.id ?? "");
  if (!clientSubmissionId) return;
  return createBusinessSubmission(supabase, userId, clientSubmissionId, payload);
}

export async function persistHostModeration(
  clientSubmissionId: string,
  status: "approved" | "rejected",
  moderationNotes?: string
) {
  const supabase = createSupabaseBrowserClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: { message: "Not signed in." } };
  return moderateHostSubmission(
    supabase,
    clientSubmissionId,
    user.id,
    status,
    moderationNotes
  );
}

export async function persistBusinessModeration(
  clientSubmissionId: string,
  status: "approved" | "rejected",
  moderationNotes?: string
) {
  const supabase = createSupabaseBrowserClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: { message: "Not signed in." } };
  return moderateBusinessSubmission(
    supabase,
    clientSubmissionId,
    user.id,
    status,
    moderationNotes
  );
}

export async function approveAndPublishHostSubmission(
  clientSubmissionId: string,
  moderationNotes?: string
): Promise<{ error: { message: string } | null }> {
  const supabase = createSupabaseBrowserClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: { message: "Not signed in." } };
  const published = await publishHostSubmissionToEvent(
    supabase,
    clientSubmissionId,
    user.id,
    moderationNotes
  );
  if (!published.ok) return { error: { message: published.error } };
  return { error: null };
}

export async function approveAndPublishBusinessSubmission(
  clientSubmissionId: string,
  moderationNotes?: string
): Promise<{ error: { message: string } | null }> {
  const supabase = createSupabaseBrowserClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: { message: "Not signed in." } };
  const published = await publishBusinessSubmissionForApproval(
    supabase,
    clientSubmissionId,
    user.id,
    moderationNotes
  );
  if (!published.ok) return { error: { message: published.error } };
  return { error: null };
}

export type ConsentEventType =
  Database["public"]["Tables"]["consent_events"]["Insert"]["consent_type"];
export type ConsentEventSource =
  Database["public"]["Tables"]["consent_events"]["Insert"]["source"];

export async function persistConsentEvent(
  consentType: ConsentEventType,
  value: boolean,
  source: ConsentEventSource
) {
  const userId = await getAuthedUserId();
  if (!userId) return;
  const supabase = createSupabaseBrowserClient();
  await createConsentEvent(supabase, userId, consentType, value, source);
}

export async function signOutSupabase() {
  const supabase = createSupabaseBrowserClient();
  return supabase.auth.signOut();
}

export async function moderateAccessRequestAndProfile(
  requestId: string,
  targetUserId: string,
  requestedRole: "host" | "business",
  status: "approved" | "rejected",
  notes?: string
) {
  const supabase = createSupabaseBrowserClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: { message: "Admin session missing." } };
  const moderation = await moderateAccessRequest(
    supabase,
    requestId,
    user.id,
    status,
    notes
  );
  if (moderation.error) return moderation;
  const profileUpdate = await updateProfileVerification(supabase, targetUserId, {
    role: status === "approved" ? requestedRole : "regular_user",
    requestedRole: status === "approved" ? "none" : requestedRole,
    verificationStatus: status === "approved" ? "approved" : "rejected",
    verificationNotes: notes ?? null,
  });
  if (profileUpdate.error) return profileUpdate;
  return { error: null };
}

/** Request host/business access from /submit (updates profile + creates access_requests). */
export async function requestElevatedAccess(
  requestedRole: "host" | "business",
  note: string,
  metadata?: Json | null
) {
  const supabase = createSupabaseBrowserClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: { message: "Not signed in." } };
  const v = await updateProfileVerification(supabase, user.id, {
    role: "regular_user",
    requestedRole: requestedRole,
    verificationStatus: "pending",
    verificationNotes: null,
  });
  if (v.error) return v;
  return createAccessRequest(supabase, user.id, requestedRole, note, metadata ?? undefined);
}

/** Re-submit after rejection (same persistence path as a fresh request). */
export async function resubmitElevatedAccess(
  requestedRole: "host" | "business",
  note: string,
  metadata?: Json | null
) {
  return requestElevatedAccess(requestedRole, note, metadata);
}
