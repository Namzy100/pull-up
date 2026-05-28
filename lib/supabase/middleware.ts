import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";

import { getSupabasePublicEnv, hasSupabaseEnv } from "@/lib/supabase/env";

function isProtectedPath(pathname: string): boolean {
  return (
    pathname.startsWith("/submit") ||
    pathname.startsWith("/admin") ||
    pathname.startsWith("/host") ||
    pathname.startsWith("/profile") ||
    pathname.startsWith("/my-events")
  );
}

/** If non-null, user must have one of these `profiles.role` values (not enforced when null). */
function requiredRolesForPath(pathname: string): string[] | null {
  if (pathname.startsWith("/admin")) return ["admin"];
  if (pathname.startsWith("/host")) return ["host", "admin"];
  return null;
}

function isAuthPath(pathname: string): boolean {
  return pathname === "/login" || pathname === "/signup";
}

export async function updateSession(request: NextRequest) {
  if (!hasSupabaseEnv()) return NextResponse.next({ request });
  const { url, anonKey } = getSupabasePublicEnv();

  let response = NextResponse.next({ request });

  const supabase = createServerClient(url, anonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
      },
    },
  });

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const pathname = request.nextUrl.pathname;
  const baseLog = {
    event: "middleware_decision",
    path: pathname,
    hasSession: Boolean(user),
    authUserId: user?.id ?? null,
  };
  if (isProtectedPath(pathname) && !user) {
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = "/login";
    redirectUrl.searchParams.set("next", pathname);
    console.info(
      "[auth-routing]",
      JSON.stringify({ ...baseLog, destination: redirectUrl.pathname, reason: "protected_no_session" })
    );
    return NextResponse.redirect(redirectUrl);
  }

  if (user && isProtectedPath(pathname)) {
    const { data: profileData, error: profileError } = await supabase
      .from("profiles")
      .select("role, onboarding_complete")
      .eq("id", user.id)
      .maybeSingle();
    const profile = profileData as { role: string; onboarding_complete: boolean } | null;
    if (profileError) {
      const redirectUrl = request.nextUrl.clone();
      redirectUrl.pathname = "/login";
      redirectUrl.search = "";
      redirectUrl.searchParams.set("profile_read_failed", "1");
      redirectUrl.searchParams.set("next", pathname);
      console.info(
        "[auth-routing]",
        JSON.stringify({
          ...baseLog,
          profileExists: Boolean(profile),
          onboarding_complete: null,
          destination: redirectUrl.pathname,
          reason: "protected_profile_read_failed",
          code: profileError.code ?? null,
        })
      );
      return NextResponse.redirect(redirectUrl);
    }
    if (profile && profile.onboarding_complete === false && pathname !== "/onboarding") {
      const redirectUrl = request.nextUrl.clone();
      redirectUrl.pathname = "/onboarding";
      console.info(
        "[auth-routing]",
        JSON.stringify({
          ...baseLog,
          profileExists: true,
          onboarding_complete: false,
          destination: redirectUrl.pathname,
          reason: "protected_incomplete_onboarding",
        })
      );
      return NextResponse.redirect(redirectUrl);
    }
    const requiredRoles = requiredRolesForPath(pathname);
    if (requiredRoles && profile && !requiredRoles.includes(profile.role)) {
      const redirectUrl = request.nextUrl.clone();
      redirectUrl.pathname = "/profile";
      console.info(
        "[auth-routing]",
        JSON.stringify({
          ...baseLog,
          profileExists: true,
          onboarding_complete: profile.onboarding_complete,
          destination: redirectUrl.pathname,
          reason: "role_block",
          role: profile.role,
        })
      );
      return NextResponse.redirect(redirectUrl);
    }
  }

  if (isAuthPath(pathname) && user) {
    const { data: prof } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .maybeSingle();
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = prof?.role === "admin" ? "/admin" : "/";
    redirectUrl.search = "";
    console.info(
      "[auth-routing]",
      JSON.stringify({
        ...baseLog,
        profileExists: Boolean(prof),
        onboarding_complete: null,
        destination: redirectUrl.pathname,
        reason: "auth_path_authed",
      })
    );
    return NextResponse.redirect(redirectUrl);
  }

  console.info(
    "[auth-routing]",
    JSON.stringify({
      ...baseLog,
      profileExists: null,
      onboarding_complete: null,
      destination: pathname,
      reason: "pass_through",
    })
  );
  return response;
}
