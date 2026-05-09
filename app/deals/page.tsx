import type { Metadata } from "next";

import { DealsPageContent } from "@/components/deals/deals-page-content";
import { loadDeals } from "@/lib/supabase/public-feed";

export const metadata: Metadata = {
  title: "Deals near campus — Pull Up",
  description:
    "Food, bars, drops, and student steals near UIUC tonight — grab them before they're gone.",
};

export default async function DealsPage() {
  const deals = await loadDeals();
  return <DealsPageContent deals={deals} />;
}
