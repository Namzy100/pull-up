import type { Metadata } from "next";

import { EventDetailView } from "@/components/events/event-detail-view";
import { MoveDisappeared } from "@/components/events/move-disappeared";
import { MOCK_EVENTS } from "@/lib/mock-data";
import { loadFeedEvents } from "@/lib/supabase/public-feed";

type PageProps = {
  params: Promise<{ id: string }>;
};

export function generateStaticParams() {
  return MOCK_EVENTS.map(({ id }) => ({ id }));
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { id } = await params;
  const events = await loadFeedEvents();
  const event = events.find((x) => x.id === id);
  if (!event) {
    return { title: "Move disappeared — Pull Up" };
  }
  return {
    title: `${event.title} · Pull Up`,
    description:
      `${event.area} tonight — ${event.venueName}. Decide if you're pulling up before the window shuts.`,
    applicationName: "Pull Up",
  };
}

export default async function EventDetailPage({ params }: PageProps) {
  const { id } = await params;
  const events = await loadFeedEvents();
  const event = events.find((x) => x.id === id);
  if (!event) return <MoveDisappeared />;
  return <EventDetailView event={event} />;
}
