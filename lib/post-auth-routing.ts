/**
 * Pure post-auth destination rules (browser + server).
 * Keeps login, OAuth callback, and onboarding aligned.
 */

import type { Database } from "@/lib/supabase/database.types";

export type PostAuthProfileSlice = {
  role: string;
  onboarding_complete: boolean;
  requested_role: string;
  verification_status: string;
};

type ProfileRow = Database["public"]["Tables"]["profiles"]["Row"];

export function profileRowToPostAuthSlice(row: ProfileRow): PostAuthProfileSlice {
  return {
    role: row.role,
    onboarding_complete: row.onboarding_complete,
    requested_role: row.requested_role,
    verification_status: row.verification_status,
  };
}

function normalizeNextPath(nextPath: string): string {
  const t = nextPath.trim();
  if (!t || t === "") return "/";
  try {
    const u = new URL(t, "https://placeholder.local");
    return u.pathname + u.search;
  } catch {
    return t.startsWith("/") ? t : `/${t}`;
  }
}

/**
 * Where to send the user immediately after auth, given their profile row.
 * `nextPath` is used only for safe overrides (admin previews, public deep links).
 */
export function computePostAuthDestination(
  nextPath: string,
  profile: PostAuthProfileSlice | null,
  options?: { profileReadFailed?: boolean }
): { destination: string; decision: string } {
  if (options?.profileReadFailed) {
    const np = normalizeNextPath(nextPath);
    const qs = new URLSearchParams();
    qs.set("profile_read_failed", "1");
    if (np && np !== "/") qs.set("next", np);
    return { destination: `/login?${qs.toString()}`, decision: "profile_read_failed" };
  }

  const np = normalizeNextPath(nextPath);

  if (!profile) {
    return { destination: "/onboarding", decision: "profile_missing_placeholder" };
  }

  if (profile.role === "admin") {
    const allowConsumerSurface =
      np.startsWith("/admin") ||
      np.includes("previewAs=") ||
      np.includes("preview=user") ||
      np.includes("preview%3Duser");
    if (allowConsumerSurface) {
      return { destination: np, decision: "admin_consumer_next" };
    }
    return { destination: "/admin", decision: "admin_home" };
  }

  if (profile.role !== "regular_user") {
    return { destination: "/profile", decision: "non_student_role" };
  }

  if (
    (profile.requested_role === "host" || profile.requested_role === "business") &&
    profile.verification_status === "pending"
  ) {
    return { destination: "/onboarding/pending", decision: "verification_pending" };
  }

  if (
    (profile.requested_role === "host" || profile.requested_role === "business") &&
    profile.verification_status === "rejected"
  ) {
    return { destination: "/onboarding/rejected", decision: "verification_rejected" };
  }

  if (profile.onboarding_complete) {
    if (np.startsWith("/onboarding")) {
      return { destination: "/", decision: "onboarding_done_override_next_onboarding" };
    }
    if (
      ["/map", "/deals", "/privacy", "/terms", "/event", "/login", "/signup"].some((p) =>
        np.startsWith(p)
      )
    ) {
      return { destination: np, decision: "completed_user_respect_next" };
    }
    return { destination: "/", decision: "tonight_home" };
  }

  return { destination: "/onboarding", decision: "student_onboarding_incomplete" };
}
