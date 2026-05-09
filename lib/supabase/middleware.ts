import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";

import { getSupabasePublicEnv, hasSupabaseEnv } from "@/lib/supabase/env";

function isProtectedPath(pathname: string): boolean {
  return pathname.startsWith("/submit") || pathname.startsWith("/admin") || pathname.startsWith("/host");
}

function requiredRolesForPath(pathname: string): string[] | null {
  if (pathname.startsWith("/admin")) return ["admin"];
  if (pathname.startsWith("/host")) return ["host", "admin"];
  if (pathname.startsWith("/submit")) return ["host", "business", "admin"];
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
  if (isProtectedPath(pathname) && !user) {
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = "/login";
    redirectUrl.searchParams.set("next", pathname);
    return NextResponse.redirect(redirectUrl);
  }

  if (user && isProtectedPath(pathname)) {
    const { data: profileData } = await supabase
      .from("profiles")
      .select("role, onboarding_complete")
      .eq("id", user.id)
      .maybeSingle();
    const profile = profileData as { role: string; onboarding_complete: boolean } | null;
    if (profile && profile.onboarding_complete === false && pathname !== "/onboarding") {
      const redirectUrl = request.nextUrl.clone();
      redirectUrl.pathname = "/onboarding";
      return NextResponse.redirect(redirectUrl);
    }
    const requiredRoles = requiredRolesForPath(pathname);
    if (requiredRoles && profile && !requiredRoles.includes(profile.role)) {
      const redirectUrl = request.nextUrl.clone();
      redirectUrl.pathname = "/profile";
      return NextResponse.redirect(redirectUrl);
    }
  }

  if (isAuthPath(pathname) && user) {
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = "/profile";
    return NextResponse.redirect(redirectUrl);
  }

  return response;
}
