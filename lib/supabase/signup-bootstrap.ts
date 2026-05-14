import type { SupabaseClient } from "@supabase/supabase-js";

import type { SignupAccountPath, SignupBusinessType, SignupOrgType } from "@/lib/account-signup-types";
import { usernameFromOrgOrBusiness } from "@/lib/account-slug";
import type { Database } from "@/lib/supabase/database.types";
import { formatSupabasePostgrestError } from "@/lib/supabase/postgrest-error";
import {
  createAccessRequest,
  createConsentEvent,
  replaceInterests,
  upsertProfile,
} from "@/lib/supabase/repositories";
import type { PuInterestId, RequestedRole } from "@/lib/types";

type DbClient = SupabaseClient;

export type StudentSignupFields = {
  displayName: string;
  username: string;
  campus: string;
  interests: PuInterestId[];
  consentAnalytics: boolean;
  consentPersonalization: boolean;
  consentLocation: boolean;
  consentMarketing: boolean;
};

export type HostSignupFields = {
  organizationName: string;
  organizationType: SignupOrgType;
  contactPersonName: string;
  contactChannel: string;
  campus: string;
  affiliationProofUrl: string;
  socialUrl: string;
  explanation: string;
  consentPostingStorage: boolean;
  consentEventAnalytics: boolean;
  consentVerificationContact: boolean;
  consentHostMarketing: boolean;
};

export type BusinessSignupFields = {
  businessName: string;
  businessType: SignupBusinessType;
  contactPerson: string;
  contactChannel: string;
  websiteOrSocial: string;
  area: string;
  explanation: string;
  consentVerificationStorage: boolean;
  consentPerformanceAnalytics: boolean;
  consentVerificationContact: boolean;
  consentPromotionalOutreach: boolean;
  consentPublicListing: boolean;
};

function logProfileFailure(
  ctx: {
    authUserId: string;
    email: string | null;
    targetProfileId: string;
    phase: string;
  },
  err: { message: string; code?: string; details?: string | null; hint?: string | null }
) {
  const safeEmail = ctx.email
    ? `${ctx.email.slice(0, 2)}***@${ctx.email.split("@")[1] ?? "hidden"}`
    : null;
  console.error("[signup/profile]", {
    phase: ctx.phase,
    authUserId: ctx.authUserId,
    targetProfileId: ctx.targetProfileId,
    email: safeEmail,
    error: formatSupabasePostgrestError(err),
    code: err.code,
  });
}

async function pendingAccessRequestExists(
  client: DbClient,
  userId: string,
  role: Exclude<RequestedRole, "none">
): Promise<boolean> {
  const { data } = await client
    .from("access_requests")
    .select("id")
    .eq("user_id", userId)
    .eq("requested_role", role)
    .eq("status", "pending")
    .maybeSingle();
  return Boolean(data?.id);
}

export async function completeSignupAfterAuth(
  client: DbClient,
  user: { id: string; email?: string | null },
  path: SignupAccountPath,
  fields: StudentSignupFields | HostSignupFields | BusinessSignupFields
): Promise<{ ok: true } | { ok: false; error: string }> {
  const userId = user.id;
  const email = user.email ?? null;

  if (path === "student") {
    const f = fields as StudentSignupFields;
    const username = f.username.trim().toLowerCase();
    if (username.length < 3) return { ok: false, error: "Username must be at least 3 characters." };
    const row: Database["public"]["Tables"]["profiles"]["Insert"] = {
      id: userId,
      username,
      full_name: f.displayName.trim() || null,
      campus: f.campus,
      role: "regular_user",
      requested_role: "none",
      verification_status: "none",
      onboarding_complete: false,
      interests: f.interests,
      consent_analytics: f.consentAnalytics,
      consent_personalization: f.consentPersonalization,
      consent_location: f.consentLocation,
      consent_marketing: f.consentMarketing,
      business_name: null,
      business_type: null,
      business_website: null,
      business_contact: null,
      organization_name: null,
      organization_type: null,
      verification_notes: null,
    };
    const { error, data } = await upsertProfile(client, row);
    if (error) {
      logProfileFailure(
        { authUserId: userId, email, targetProfileId: userId, phase: "student_bootstrap" },
        error
      );
      return { ok: false, error: formatSupabasePostgrestError(error) };
    }
    if (!data) {
      logProfileFailure(
        { authUserId: userId, email, targetProfileId: userId, phase: "student_bootstrap_empty" },
        { message: "No row returned" }
      );
      return { ok: false, error: "Profile was not saved." };
    }
    const interestResult = await replaceInterests(client, userId, f.interests);
    if (interestResult.error) {
      console.error("[signup/interests]", {
        authUserId: userId,
        error: formatSupabasePostgrestError(interestResult.error),
      });
      return { ok: false, error: formatSupabasePostgrestError(interestResult.error) };
    }
    await Promise.all([
      createConsentEvent(client, userId, "analytics", f.consentAnalytics, "signup"),
      createConsentEvent(client, userId, "personalization", f.consentPersonalization, "signup"),
      createConsentEvent(client, userId, "location", f.consentLocation, "signup"),
      createConsentEvent(client, userId, "marketing", f.consentMarketing, "signup"),
    ]);
    return { ok: true };
  }

  if (path === "host") {
    const f = fields as HostSignupFields;
    const username = usernameFromOrgOrBusiness(f.organizationName, userId);
    const proofOrSocial =
      f.affiliationProofUrl.trim() || f.socialUrl.trim() || null;
    const row: Database["public"]["Tables"]["profiles"]["Insert"] = {
      id: userId,
      username,
      full_name: f.contactPersonName.trim() || null,
      campus: f.campus,
      role: "regular_user",
      requested_role: "host",
      verification_status: "pending",
      onboarding_complete: true,
      interests: [],
      consent_analytics: false,
      consent_personalization: false,
      consent_location: false,
      consent_marketing: false,
      organization_name: f.organizationName.trim(),
      organization_type: f.organizationType,
      business_contact: f.contactChannel.trim(),
      verification_notes: f.explanation.trim() || null,
      business_name: null,
      business_type: null,
      business_website: proofOrSocial,
    };

    const { error, data } = await upsertProfile(client, row);
    if (error) {
      logProfileFailure(
        { authUserId: userId, email, targetProfileId: userId, phase: "host_bootstrap" },
        error
      );
      return { ok: false, error: formatSupabasePostgrestError(error) };
    }
    if (!data) {
      logProfileFailure(
        { authUserId: userId, email, targetProfileId: userId, phase: "host_bootstrap_empty" },
        { message: "No row returned" }
      );
      return { ok: false, error: "Profile was not saved." };
    }

    const hasPending = await pendingAccessRequestExists(client, userId, "host");
    if (!hasPending) {
      const meta = {
        signupPath: "host" as const,
        organizationName: f.organizationName,
        organizationType: f.organizationType,
        contactPersonName: f.contactPersonName,
        contactChannel: f.contactChannel,
        campus: f.campus,
        affiliationProofUrl: f.affiliationProofUrl.trim() || null,
        socialUrl: f.socialUrl.trim() || null,
        explanation: f.explanation.trim() || null,
      };
      const { error: arErr } = await createAccessRequest(
        client,
        userId,
        "host",
        f.explanation.trim() || "Host signup verification",
        meta as Database["public"]["Tables"]["access_requests"]["Insert"]["metadata"]
      );
      if (arErr) {
        console.error("[signup/access_request]", {
          authUserId: userId,
          email: email ? `${email.slice(0, 2)}***` : null,
          error: formatSupabasePostgrestError(arErr),
        });
        return { ok: false, error: formatSupabasePostgrestError(arErr) };
      }
    }
    await Promise.all([
      createConsentEvent(client, userId, "host_posting_storage", f.consentPostingStorage, "signup"),
      createConsentEvent(client, userId, "host_event_analytics", f.consentEventAnalytics, "signup"),
      createConsentEvent(client, userId, "host_verification_contact", f.consentVerificationContact, "signup"),
      createConsentEvent(client, userId, "host_marketing", f.consentHostMarketing, "signup"),
    ]);
    return { ok: true };
  }

  const f = fields as BusinessSignupFields;
  const username = usernameFromOrgOrBusiness(f.businessName, userId);
  const row: Database["public"]["Tables"]["profiles"]["Insert"] = {
    id: userId,
    username,
    full_name: f.contactPerson.trim() || null,
    campus: f.area.trim(),
    role: "regular_user",
    requested_role: "business",
    verification_status: "pending",
    onboarding_complete: true,
    interests: [],
    consent_analytics: false,
    consent_personalization: false,
    consent_location: false,
    consent_marketing: false,
    business_name: f.businessName.trim(),
    business_type: f.businessType,
    business_website: f.websiteOrSocial.trim() || null,
    business_contact: f.contactChannel.trim(),
    organization_name: null,
    organization_type: null,
    verification_notes: f.explanation.trim() || null,
  };
  const { error, data } = await upsertProfile(client, row);
  if (error) {
    logProfileFailure(
      { authUserId: userId, email, targetProfileId: userId, phase: "business_bootstrap" },
      error
    );
    return { ok: false, error: formatSupabasePostgrestError(error) };
  }
  if (!data) {
    logProfileFailure(
      { authUserId: userId, email, targetProfileId: userId, phase: "business_bootstrap_empty" },
      { message: "No row returned" }
    );
    return { ok: false, error: "Profile was not saved." };
  }

  const hasPending = await pendingAccessRequestExists(client, userId, "business");
    if (!hasPending) {
      const meta = {
        signupPath: "business" as const,
        businessName: f.businessName,
        businessType: f.businessType,
        contactPerson: f.contactPerson,
        contactChannel: f.contactChannel,
        websiteOrSocial: f.websiteOrSocial,
        area: f.area,
        explanation: f.explanation.trim() || null,
      };
      const { error: arErr } = await createAccessRequest(
        client,
        userId,
        "business",
        f.explanation.trim() || "Business signup verification",
        meta as Database["public"]["Tables"]["access_requests"]["Insert"]["metadata"]
      );
      if (arErr) {
        console.error("[signup/access_request]", {
          authUserId: userId,
          email: email ? `${email.slice(0, 2)}***` : null,
          error: formatSupabasePostgrestError(arErr),
        });
        return { ok: false, error: formatSupabasePostgrestError(arErr) };
      }
    }
    await Promise.all([
      createConsentEvent(
        client,
        userId,
        "business_verification_storage",
        f.consentVerificationStorage,
        "signup"
      ),
      createConsentEvent(
        client,
        userId,
        "business_performance_analytics",
        f.consentPerformanceAnalytics,
        "signup"
      ),
      createConsentEvent(
        client,
        userId,
        "business_verification_contact",
        f.consentVerificationContact,
        "signup"
      ),
      createConsentEvent(
        client,
        userId,
        "business_promotional_outreach",
        f.consentPromotionalOutreach,
        "signup"
      ),
      createConsentEvent(client, userId, "business_public_listing", f.consentPublicListing, "signup"),
    ]);
    return { ok: true };
  }
