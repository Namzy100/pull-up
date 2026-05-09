import { TonightHome } from "@/components/feed/tonight-home";
import {
  getCampusPulseTotals,
  getHotEvents,
} from "@/lib/mock-data";
import { loadFeedEvents } from "@/lib/supabase/public-feed";

export default async function Home() {
  const allEvents = await loadFeedEvents();
  const hotEvents = getHotEvents(allEvents, 5);
  const feedEvents = [...allEvents].sort(
    (a, b) =>
      new Date(a.startsAt).getTime() - new Date(b.startsAt).getTime()
  );
  const campusPulse = getCampusPulseTotals(allEvents);

  return (
    <TonightHome
      hotEvents={hotEvents}
      feedEvents={feedEvents}
      campusPulse={campusPulse}
    />
  );
}
