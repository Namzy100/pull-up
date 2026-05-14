import type { Metadata } from "next";

import { CampusRadarMap } from "@/components/map/campus-radar-map";
import { loadDeals, loadFeedEvents } from "@/lib/supabase/public-feed";

export const metadata: Metadata = {
  title: "Campus radar — Pull Up",
  description:
    "Mock UIUC / Champaign-Urbana heat map — see where the night is heating up before you pull up.",
};

export default async function MapPage() {
  const [events, deals] = await Promise.all([loadFeedEvents(), loadDeals()]);
  return <CampusRadarMap mapEvents={events} mapDeals={deals} />;
}
