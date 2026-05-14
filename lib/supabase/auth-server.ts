import { redirect } from "next/navigation";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import { hasSupabaseEnv } from "@/lib/supabase/env";
import { getProfileById, profileRowToMockSession } from "@/lib/supabase/repositories";
import { DEFAULT_MOCK_PROFILE } from "@/lib/mock-profile";

export async function getServerSessionUser() {
  if (!hasSupabaseEnv()) {
    return { supabase: null, user: null };
  }
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return { supabase, user };
}

export async function requireAuth(nextPath?: string) {
  const { supabase, user } = await getServerSessionUser();
  if (!supabase) {
    return { supabase: null, user: null };
  }
  if (!user) {
    const nextParam = nextPath ? `?next=${encodeURIComponent(nextPath)}` : "";
    redirect(`/login${nextParam}`);
  }
  return { supabase, user };
}

export async function getAuthedProfileOrFallback(nextPath?: string) {
  const { supabase, user } = await requireAuth(nextPath);
  if (!supabase || !user) {
    return {
      user: null,
      profile: { ...DEFAULT_MOCK_PROFILE },
      hasProfile: false,
    };
  }
  const profile = await getProfileById(supabase, user.id);
  if (!profile) {
    return {
      user,
      profile: { ...DEFAULT_MOCK_PROFILE, username: user.email?.split("@")[0] ?? "new_user" },
      hasProfile: false,
    };
  }
  return {
    user,
    profile: profileRowToMockSession(profile),
    hasProfile: true,
  };
}

export async function getOptionalSessionProfile() {
  if (!hasSupabaseEnv()) return null;
  const { supabase, user } = await getServerSessionUser();
  if (!supabase || !user) return null;
  const profile = await getProfileById(supabase, user.id);
  if (!profile) {
    return {
      user,
      profile: { ...DEFAULT_MOCK_PROFILE, username: user.email?.split("@")[0] ?? "new_user" },
      hasProfile: false,
    };
  }
  return {
    user,
    profile: profileRowToMockSession(profile),
    hasProfile: true,
  };
}

/** Server guard for `/admin`: must be signed in with `profiles.role = admin`. */
export async function requireAdminPageAccess() {
  if (!hasSupabaseEnv()) {
    redirect("/");
  }
  const { supabase, user } = await requireAuth("/admin");
  if (!supabase || !user) {
    redirect("/login?next=%2Fadmin");
  }
  const profile = await getProfileById(supabase, user.id);
  if (!profile || profile.role !== "admin") {
    redirect("/");
  }
  return { supabase, user, profile };
}
