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

      <div className="relative mx-auto flex w-full max-w-lg flex-col px-4 pb-4 pt-7 sm:pt-9">
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
            <h1 className="pu-display text-[2.15rem] sm:text-[2.5rem]">Your moves</h1>
          </div>
        </div>

        {fullyEmpty ? (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
            className="flex flex-col items-center rounded-[1.25rem] border border-pu-border bg-gradient-to-b from-pu-surface/95 to-black px-6 py-12 text-center shadow-[0_0_48px_-18px_oklch(0.7_0.29_328/0.32)]"
          >
            <motion.div
              animate={{ rotate: [0, 5, -5, 0] }}
              transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
              className="mb-4 flex size-14 items-center justify-center rounded-2xl bg-gradient-to-br from-pu-magenta/28 to-pu-amber/18 ring-1 ring-pu-magenta/35"
            >
              <Sparkles className="size-7 text-pu-amber" aria-hidden />
            </motion.div>
            <p className="max-w-[17rem] font-heading text-xl font-extrabold leading-snug tracking-tight text-balance text-white">
              Nothing saved yet.
            </p>
            <p className="pu-meta mt-3 max-w-[19rem] text-[0.875rem] leading-relaxed">
              Find the move before it disappears.
            </p>
            <Link
              href="/"
              className="mt-7 inline-flex items-center justify-center rounded-xl border border-pu-magenta/45 bg-gradient-to-r from-pu-magenta/35 to-pu-amber/22 px-6 py-3 text-sm font-black uppercase tracking-[0.12em] text-white shadow-[0_0_24px_-8px_oklch(0.7_0.29_328/0.45)] transition hover:border-pu-magenta/65 active:scale-[0.99]"
            >
              Tonight feed
            </Link>
          </motion.div>
        ) : (
          <div className="flex flex-col gap-7">
            <section aria-labelledby="rsvp-heading" className="space-y-3">
              <div className="space-y-0.5">
                <div className="flex items-center gap-2">
                  <Flame className="size-5 text-pu-amber drop-shadow-[0_0_12px_oklch(0.82_0.17_72/0.4)]" />
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
                <p className="rounded-2xl border border-dashed border-pu-border bg-black/30 px-4 py-4 text-center text-sm font-medium text-white/48">
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
                <p className="rounded-2xl border border-dashed border-pu-border bg-black/30 px-4 py-4 text-center text-sm font-medium text-white/48">
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
                <div className="rounded-2xl border border-pu-border bg-gradient-to-br from-pu-surface/85 to-black px-5 py-7 text-center">
                  <p className="text-sm font-semibold text-white/78">
                    No deals locked yet.
                  </p>
                  <p className="pu-meta mt-2 leading-relaxed">
                    Deals land in the feed soon — save one before the window
                    resets.
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
