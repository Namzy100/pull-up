"use client";

import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import type { Json } from "@/lib/supabase/database.types";
import {
  createConsentEvent,
  createBusinessSubmission,
  createHostSubmission,
  getProfileById,
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

export async function persistSavedEvent(eventId: string, shouldSave: boolean) {
  const userId = await getAuthedUserId();
  if (!userId) return { error: null };
  const supabase = createSupabaseBrowserClient();
  const result = await toggleSavedEvent(supabase, userId, eventId, shouldSave);
  if (result.error) console.error("persistSavedEvent failed", result.error.message);
  return result;
}

export async function persistRsvp(eventId: string, shouldRsvp: boolean) {
  const userId = await getAuthedUserId();
  if (!userId) return { error: null };
  const supabase = createSupabaseBrowserClient();
  const result = await toggleRsvp(supabase, userId, eventId, shouldRsvp);
  if (result.error) console.error("persistRsvp failed", result.error.message);
  return result;
}

export async function persistVenueFollow(venueId: string, shouldFollow: boolean) {
  const userId = await getAuthedUserId();
  if (!userId) return { error: null };
  const supabase = createSupabaseBrowserClient();
  const result = await toggleVenueFollow(supabase, userId, venueId, shouldFollow);
  if (result.error) console.error("persistVenueFollow failed", result.error.message);
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
  const userId = await getAuthedUserId();
  if (!userId) return { error: null };
  const supabase = createSupabaseBrowserClient();
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
  if (result.error) console.error("persistProfile failed", result.error.message);
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
  if (!user) return;
  await moderateHostSubmission(
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
  if (!user) return;
  await moderateBusinessSubmission(
    supabase,
    clientSubmissionId,
    user.id,
    status,
    moderationNotes
  );
}

export async function persistConsentEvent(
  consentType: "analytics" | "personalization" | "location" | "marketing",
  value: boolean,
  source: "onboarding" | "profile_settings"
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
    requestedRole,
    verificationStatus: status === "approved" ? "approved" : "rejected",
    verificationNotes: notes ?? null,
  });
  if (profileUpdate.error) return profileUpdate;
  return { error: null };
}
