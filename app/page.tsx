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

  if (!user) {
    return <PublicLanding />;
  }

  const { data: profileRow } = await supabase
    .from("profiles")
    .select("onboarding_complete")
    .eq("id", user.id)
    .maybeSingle();

  if (!profileRow?.onboarding_complete) {
    redirect("/onboarding");
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
    />
  );
}
