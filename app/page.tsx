import { TonightHome } from "@/components/feed/tonight-home";
import { getCampusPulseTotals } from "@/lib/mock-data";
import { loadDeals, loadFeedEvents } from "@/lib/supabase/public-feed";

export default async function Home() {
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
