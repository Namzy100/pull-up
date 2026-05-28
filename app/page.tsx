import { redirect } from "next/navigation";

import { PublicLanding } from "@/components/landing/public-landing";
import { TonightHome } from "@/components/feed/tonight-home";
import { getCampusPulseTotals } from "@/lib/mock-data";
import { hasSupabaseEnv } from "@/lib/supabase/env";
import { loadDeals, loadFeedEvents } from "@/lib/supabase/public-feed";
import { createSupabaseServerClient } from "@/lib/supabase/server";

type HomeSearchParams = Promise<{ demo?: string }>;

export default async function Home({ searchParams }: { searchParams: HomeSearchParams }) {
  const { demo } = await searchParams;
  const isDemoUrl = demo === "1";
  const path = "/";

  if (isDemoUrl) {
    if (hasSupabaseEnv()) {
      const supabase = await createSupabaseServerClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user) {
        redirect("/");
      }
    }
    const [allEvents, deals] = await Promise.all([loadFeedEvents(), loadDeals()]);
    const feedEvents = [...allEvents].sort(
      (a, b) =>
        new Date(a.startsAt).getTime() - new Date(b.startsAt).getTime()
    );
    const campusPulse = getCampusPulseTotals(allEvents);
    return (
      <TonightHome
        feedEvents={feedEvents}
        campusPulse={campusPulse}
        deals={deals}
        demoMode
      />
    );
  }

  if (!hasSupabaseEnv()) {
    return <PublicLanding />;
  }

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  console.info(
    "[auth-routing]",
    JSON.stringify({
      event: "supabase_session_result",
      path,
      hasSession: Boolean(user),
      authUserId: user?.id ?? null,
    })
  );

  if (!user) {
    console.info(
      "[auth-routing]",
      JSON.stringify({
        event: "route_decision",
        path,
        hasSession: false,
        authUserId: null,
        profileExists: false,
        onboarding_complete: null,
        destination: "/login",
        reason: "no_session_public_landing",
      })
    );
    return <PublicLanding />;
  }

  const { data: profileRow, error: profileError } = await supabase
    .from("profiles")
    .select("onboarding_complete")
    .eq("id", user.id)
    .maybeSingle();

  if (profileError) {
    const destination = "/login?profile_read_failed=1&next=%2F";
    console.info(
      "[auth-routing]",
      JSON.stringify({
        event: "route_decision",
        path,
        hasSession: true,
        authUserId: user.id,
        profileExists: false,
        onboarding_complete: null,
        destination,
        reason: "profile_read_failed",
        code: profileError.code ?? null,
      })
    );
    redirect(destination);
  }

  if (!profileRow) {
    console.info(
      "[auth-routing]",
      JSON.stringify({
        event: "route_decision",
        path,
        hasSession: true,
        authUserId: user.id,
        profileExists: false,
        onboarding_complete: null,
        destination: "/onboarding",
        reason: "profile_missing_needs_onboarding",
      })
    );
    redirect("/onboarding");
  }

  if (!profileRow.onboarding_complete) {
    console.info(
      "[auth-routing]",
      JSON.stringify({
        event: "route_decision",
        path,
        hasSession: true,
        authUserId: user.id,
        profileExists: true,
        onboarding_complete: false,
        destination: "/onboarding",
        reason: "onboarding_incomplete",
      })
    );
    redirect("/onboarding");
  }
  console.info(
    "[auth-routing]",
    JSON.stringify({
      event: "route_decision",
      path,
      hasSession: true,
      authUserId: user.id,
      profileExists: true,
      onboarding_complete: true,
      destination: "/",
      reason: "home_ready",
    })
  );

  const [allEvents, deals] = await Promise.all([loadFeedEvents(), loadDeals()]);
  const feedEvents = [...allEvents].sort(
    (a, b) =>
      new Date(a.startsAt).getTime() - new Date(b.startsAt).getTime()
  );
  const campusPulse = getCampusPulseTotals(allEvents);

  return (
    <TonightHome
      feedEvents={feedEvents}
      campusPulse={campusPulse}
      deals={deals}
    />
  );
}
