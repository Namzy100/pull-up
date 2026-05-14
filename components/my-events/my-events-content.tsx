"use client";

import Link from "next/link";
import { useMemo } from "react";
import { motion } from "framer-motion";
import { ArrowLeft, Flame, Sparkles, Tag } from "lucide-react";

import { DealCard } from "@/components/deals/deal-card";
import { LiveAmbient } from "@/components/feed/live-ambient";
import { EventCard } from "@/components/events/event-card";
import { MOCK_DEALS } from "@/lib/deals-data";
import { MOCK_EVENTS } from "@/lib/mock-data";
import { useAppStore } from "@/store/use-app-store";

function sortByStart(a: (typeof MOCK_EVENTS)[0], b: (typeof MOCK_EVENTS)[0]) {
  return new Date(a.startsAt).getTime() - new Date(b.startsAt).getTime();
}

export function MyEventsContent() {
  const rsvpedEventIds = useAppStore((s) => s.rsvpedEventIds);
  const savedEventIds = useAppStore((s) => s.savedEventIds);
  const savedDealIds = useAppStore((s) => s.savedDealIds);

  const rsvpedEvents = useMemo(() => {
    const set = new Set(rsvpedEventIds);
    return MOCK_EVENTS.filter((e) => set.has(e.id)).sort(sortByStart);
  }, [rsvpedEventIds]);

  const savedEvents = useMemo(() => {
    const set = new Set(savedEventIds);
    return MOCK_EVENTS.filter((e) => set.has(e.id)).sort(sortByStart);
  }, [savedEventIds]);

  const savedDeals = useMemo(() => {
    const set = new Set(savedDealIds);
    return MOCK_DEALS.filter((d) => set.has(d.id));
  }, [savedDealIds]);

  const fullyEmpty =
    rsvpedEvents.length === 0 &&
    savedEvents.length === 0 &&
    savedDeals.length === 0;

  return (
    <div className="pu-screen">
      <LiveAmbient />
      <div className="pointer-events-none absolute inset-x-0 top-0 h-[380px] bg-[radial-gradient(ellipse_82%_54%_at_50%_-6%,oklch(0.55_0.22_328/0.2),transparent_56%)]" />

      <div className="relative mx-auto flex w-full max-w-lg flex-col px-4 pb-6 pt-7 sm:pt-9">
        <div className="mb-6 flex items-center gap-3">
          <Link
            href="/"
            className="inline-flex size-10 shrink-0 items-center justify-center rounded-xl border border-pu-border bg-black/50 text-white transition-colors hover:border-pu-magenta/45 hover:bg-pu-surface"
            aria-label="Back to Tonight"
          >
            <ArrowLeft className="size-5" aria-hidden />
          </Link>
          <div className="min-w-0 flex-1 space-y-1">
            <motion.p
              initial={{ opacity: 0, x: -6 }}
              animate={{ opacity: 1, x: 0 }}
              className="pu-eyebrow text-[0.625rem]"
            >
              Locked in
            </motion.p>
            <h1 className="pu-section-title-lg text-balance">Your moves</h1>
          </div>
        </div>

        {fullyEmpty ? (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
            className="pu-empty-panel flex flex-col items-center py-12"
          >
            <div className="mb-4 flex size-12 items-center justify-center rounded-2xl border border-white/[0.08] bg-gradient-to-br from-pu-magenta/15 to-pu-amber/10">
              <Sparkles className="size-6 text-pu-amber/90" aria-hidden />
            </div>
            <p className="pu-empty-panel-title">Nothing saved yet</p>
            <p className="pu-empty-panel-hint">
              Save events and deals from Tonight so your plan stays one tap away.
            </p>
            <Link
              href="/"
              className="mt-8 inline-flex min-h-11 items-center justify-center rounded-xl border border-white/[0.12] bg-white/[0.06] px-6 text-sm font-bold text-white transition hover:border-pu-magenta/35 hover:bg-white/[0.09] active:scale-[0.99]"
            >
              Browse Tonight
            </Link>
          </motion.div>
        ) : (
          <div className="flex flex-col gap-8">
            <section aria-labelledby="rsvp-heading" className="space-y-3">
              <div className="space-y-0.5">
                <div className="flex items-center gap-2">
                  <Flame className="size-5 shrink-0 text-pu-amber/85" aria-hidden />
                  <h2
                    id="rsvp-heading"
                    className="pu-section-title text-lg sm:text-xl"
                  >
                    RSVP&apos;d
                  </h2>
                </div>
                <p className="pu-meta-strong text-pu-magenta/90">
                  Don&apos;t lose the plan.
                </p>
              </div>
              {rsvpedEvents.length === 0 ? (
                <p className="rounded-2xl border border-dashed border-white/[0.1] bg-black/35 px-4 py-4 text-center text-sm font-medium leading-relaxed text-white/55">
                  No RSVPs yet — lock one in on anything that needs it.
                </p>
              ) : (
                <ul className="pu-feed-stack">
                  {rsvpedEvents.map((event, i) => (
                    <li key={event.id}>
                      <EventCard event={event} layout="feed" index={i} />
                    </li>
                  ))}
                </ul>
              )}
            </section>

            <section aria-labelledby="saved-events-heading" className="space-y-3">
              <div className="space-y-0.5">
                <h2
                  id="saved-events-heading"
                  className="pu-section-title text-lg sm:text-xl"
                >
                  Saved events
                </h2>
                <p className="pu-meta-strong text-pu-amber/95">
                  Saved before it disappears.
                </p>
              </div>
              {savedEvents.length === 0 ? (
                <p className="rounded-2xl border border-dashed border-white/[0.1] bg-black/35 px-4 py-4 text-center text-sm font-medium leading-relaxed text-white/55">
                  No saved events — tap Save on the moves you might pull up to.
                </p>
              ) : (
                <ul className="pu-feed-stack">
                  {savedEvents.map((event, i) => (
                    <li key={event.id}>
                      <EventCard event={event} layout="feed" index={i} />
                    </li>
                  ))}
                </ul>
              )}
            </section>

            <section aria-labelledby="deals-heading" className="space-y-3">
              <div className="space-y-0.5">
                <div className="flex items-center gap-2">
                  <Tag className="size-5 text-pu-amber" />
                  <h2
                    id="deals-heading"
                    className="pu-section-title text-lg sm:text-xl"
                  >
                    Saved deals
                  </h2>
                </div>
                <p className="pu-meta">
                  Cheap shots at the night — don&apos;t sleep on it.
                </p>
              </div>
              {savedDeals.length === 0 ? (
                <div className="pu-empty-panel border-white/[0.08] py-8">
                  <p className="text-sm font-semibold text-white/80">No deals locked yet</p>
                  <p className="pu-empty-panel-hint mt-1 text-white/48">
                    Save a deal from the feed before the window resets.
                  </p>
                </div>
              ) : (
                <ul className="m-0 flex list-none flex-col gap-3 p-0">
                  {savedDeals.map((deal, i) => (
                    <li key={deal.id}>
                      <DealCard deal={deal} layout="saved" index={i} />
                    </li>
                  ))}
                </ul>
              )}
            </section>
          </div>
        )}
      </div>
    </div>
  );
}
