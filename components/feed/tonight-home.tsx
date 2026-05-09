"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Bookmark, Eye, Flame, Radio, Search, X, Zap } from "lucide-react";

import { LiveAmbient } from "@/components/feed/live-ambient";
import { EventCard } from "@/components/events/event-card";
import type { PuEvent } from "@/lib/types";
import { formatCompactCount } from "@/lib/event-utils";
import {
  filterEventsByInterests,
  getRecommendedEvents,
  INTEREST_OPTIONS,
} from "@/lib/recommendations";
import { filterEventsBySearch } from "@/lib/event-search";
import { useAppStore } from "@/store/use-app-store";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";

type CampusPulse = {
  liveVenues: number;
  pullUpsLastHour: number;
  spottingLive: number;
};

type TonightHomeProps = {
  hotEvents: PuEvent[];
  feedEvents: PuEvent[];
  campusPulse: CampusPulse;
};

export function TonightHome({
  hotEvents,
  feedEvents,
  campusPulse,
}: TonightHomeProps) {
  const selectedInterests = useAppStore((s) => s.selectedInterests);
  const toggleInterest = useAppStore((s) => s.toggleInterest);
  const [sheetDismissed, setSheetDismissed] = useState(
    selectedInterests.length > 0
  );
  const [sheetOpen, setSheetOpen] = useState(
    !sheetDismissed && selectedInterests.length === 0
  );

  const [searchQuery, setSearchQuery] = useState("");
  const searchActive = searchQuery.trim().length > 0;

  const filteredBySearch = useMemo(
    () => filterEventsBySearch(feedEvents, searchQuery),
    [feedEvents, searchQuery]
  );

  const filteredFeed = useMemo(
    () => filterEventsByInterests(filteredBySearch, selectedInterests),
    [filteredBySearch, selectedInterests]
  );

  const recommended = useMemo(
    () => getRecommendedEvents(feedEvents, selectedInterests, 4),
    [feedEvents, selectedInterests]
  );

  const openChanged = (open: boolean) => {
    setSheetOpen(open);
    if (!open) setSheetDismissed(true);
  };

  return (
    <div className="pu-screen">
      <LiveAmbient />
      <div className="pointer-events-none absolute inset-x-0 top-0 h-[420px] bg-[radial-gradient(ellipse_88%_62%_at_50%_-14%,oklch(0.55_0.22_328/0.26),transparent_58%)]" />

      <div className="relative mx-auto flex w-full max-w-lg flex-col gap-7 px-4 pb-3 pt-9 sm:gap-8 sm:pt-11">
        <motion.header
          initial={{ opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          className="space-y-4"
        >
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0 flex-1 space-y-2.5">
              <p className="pu-eyebrow text-pu-magenta/95">UIUC tonight</p>
              <div className="space-y-1.5">
                <h1 className="pu-display">Pull Up</h1>
                <div className="h-1 w-[min(56%,12rem)] rounded-full bg-gradient-to-r from-pu-magenta via-pu-amber to-transparent opacity-90" />
              </div>
              <p className="pu-meta-strong max-w-[18rem] text-[0.8125rem] leading-relaxed">
                Campus is moving. Stay on the pulse or miss it.
              </p>
            </div>

            <div className="flex shrink-0 flex-col items-end gap-2">
              <motion.div
                animate={{ scale: [1, 1.04, 1] }}
                transition={{
                  repeat: Infinity,
                  duration: 2.8,
                  ease: "easeInOut",
                }}
                className="rounded-2xl border border-pu-live/40 bg-pu-surface-deep/95 px-3 py-2.5 shadow-[0_0_26px_-6px_oklch(0.86_0.22_145/0.45)]"
              >
                <span className="relative flex justify-center">
                  <span className="absolute inline-flex size-3 animate-ping rounded-full bg-pu-live/70" />
                  <span className="relative inline-flex size-3 rounded-full bg-pu-live shadow-[0_0_14px_oklch(0.86_0.22_145/0.85)]" />
                </span>
                <span className="mt-2 flex items-center justify-center gap-1 text-[10px] font-black uppercase tracking-[0.16em] text-pu-live">
                  <Radio className="size-3.5 text-pu-live" aria-hidden />
                  Live
                </span>
              </motion.div>
              <Link
                href="/my-events"
                className="inline-flex items-center gap-1.5 rounded-xl border border-pu-border bg-black/50 px-3 py-2 text-[10px] font-black uppercase tracking-[0.14em] text-white/92 shadow-[inset_0_1px_0_rgba(255,255,255,0.06)] transition active:scale-[0.98] hover:border-pu-magenta/40 hover:text-white"
              >
                <Bookmark className="size-3.5 text-pu-magenta" aria-hidden />
                My Events
              </Link>
            </div>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1, duration: 0.4 }}
            className="flex flex-wrap gap-2"
          >
            <span className="inline-flex items-center gap-1.5 rounded-xl border border-pu-border bg-pu-surface-deep/90 px-3 py-2 text-[11px] font-bold tabular-nums text-white/92 shadow-[inset_0_1px_0_rgba(255,255,255,0.05)]">
              <span className="size-1.5 shrink-0 rounded-full bg-pu-urgent shadow-[0_0_10px_oklch(0.64_0.22_28/0.75)]" />
              {campusPulse.liveVenues} live scenes
            </span>
            <motion.span
              className="inline-flex items-center gap-1.5 rounded-xl border border-pu-magenta/30 bg-pu-magenta-dim/25 px-3 py-2 text-[11px] font-bold tabular-nums text-white"
              animate={{
                boxShadow: [
                  "0 0 0 0 oklch(0.7 0.29 328 / 0)",
                  "0 0 20px -6px oklch(0.7 0.29 328 / 0.35)",
                  "0 0 0 0 oklch(0.7 0.29 328 / 0)",
                ],
              }}
              transition={{ duration: 2.6, repeat: Infinity, ease: "easeInOut" }}
            >
              <motion.span
                animate={{ rotate: [0, -10, 8, 0] }}
                transition={{
                  duration: 2.4,
                  repeat: Infinity,
                  ease: "easeInOut",
                  repeatDelay: 0.8,
                }}
              >
                <Zap className="size-3.5 text-pu-amber" aria-hidden />
              </motion.span>
              {formatCompactCount(campusPulse.pullUpsLastHour)} pulls / hr
            </motion.span>
            <span className="inline-flex items-center gap-1.5 rounded-xl border border-pu-border bg-pu-surface/80 px-3 py-2 text-[11px] font-bold tabular-nums text-white/85">
              <Eye className="size-3.5 shrink-0 text-pu-amber" aria-hidden />
              {formatCompactCount(campusPulse.spottingLive)} watching live
            </span>
          </motion.div>

          <div className="relative">
            <Search
              className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-pu-magenta/85"
              aria-hidden
            />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search parties, food, frats, dates…"
              aria-label="Search events"
              className="h-11 rounded-2xl border-pu-border bg-black/50 py-2 pl-10 pr-11 text-[0.9375rem] font-semibold text-white placeholder:text-white/38 focus-visible:border-pu-magenta/50 focus-visible:ring-pu-magenta/25"
            />
            {searchActive ? (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="absolute right-2 top-1/2 flex size-8 -translate-y-1/2 items-center justify-center rounded-xl text-white/60 transition hover:bg-white/10 hover:text-white"
                aria-label="Clear search"
              >
                <X className="size-4" aria-hidden />
              </button>
            ) : null}
          </div>

          <div className="flex flex-wrap gap-2">
            {INTEREST_OPTIONS.map((interest) => {
              const active = selectedInterests.includes(interest.id);
              return (
                <button
                  key={interest.id}
                  type="button"
                  onClick={() => toggleInterest(interest.id)}
                  className={
                    active
                      ? "rounded-full border border-pu-magenta/55 bg-pu-magenta-dim/35 px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.1em] text-white shadow-[0_0_18px_-8px_oklch(0.7_0.29_328/0.5)]"
                      : "rounded-full border border-pu-border bg-black/45 px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.1em] text-white/58 transition active:scale-[0.98] hover:border-white/22 hover:text-white/90"
                  }
                  aria-pressed={active}
                >
                  {interest.label}
                </button>
              );
            })}
          </div>
        </motion.header>

        {searchActive ? (
          <section aria-labelledby="search-results-heading" className="space-y-3">
            <div className="flex flex-wrap items-end justify-between gap-2">
              <div>
                <h2 id="search-results-heading" className="pu-section-title-lg">
                  Search results
                </h2>
                <p className="pu-meta mt-1">
                  {selectedInterests.length > 0
                    ? "Matching your search + active lanes."
                    : "Matching your search across campus tonight."}
                </p>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-8 px-2 text-[11px] font-bold uppercase tracking-wide text-pu-magenta hover:bg-pu-magenta/10 hover:text-white"
                onClick={() => setSearchQuery("")}
              >
                Clear search
              </Button>
            </div>

            {filteredFeed.length === 0 ? (
              <div className="rounded-[1.25rem] border border-dashed border-white/15 bg-black/35 px-5 py-12 text-center">
                <p className="font-heading text-xl font-black tracking-tight text-white">
                  No move found. Try another search.
                </p>
              </div>
            ) : (
              <ul className="pu-feed-stack">
                {filteredFeed.map((event, index) => (
                  <li key={event.id}>
                    <EventCard event={event} layout="feed" index={index} />
                  </li>
                ))}
              </ul>
            )}
          </section>
        ) : null}

        <section aria-labelledby="recommended-heading" className="space-y-3">
          <div className="flex items-end justify-between gap-2">
            <div>
              <h2 id="recommended-heading" className="pu-section-title-lg">
                Recommended for you
              </h2>
              <p className="pu-meta mt-1">
                Personalized from your lanes + live campus momentum.
              </p>
            </div>
            <span className="rounded-lg border border-pu-magenta/35 bg-pu-magenta-dim/25 px-2 py-1 text-[10px] font-black uppercase tracking-[0.12em] text-white">
              Your vibe
            </span>
          </div>

          <div className="pu-strip-scroll gap-3">
            {recommended.map(({ event, reasons }, index) => (
              <div key={event.id} className="w-[min(82vw,300px)] shrink-0 snap-start">
                <div className="mb-2 flex flex-wrap gap-1">
                  {(reasons.length > 0 ? reasons : ["Live right now"]).map((reason) => (
                    <Badge
                      key={reason}
                      variant="outline"
                      className="border-pu-amber/35 bg-black/50 text-[10px] font-bold text-pu-amber"
                    >
                      {reason}
                    </Badge>
                  ))}
                </div>
                <EventCard
                  event={event}
                  layout="carousel"
                  index={index}
                />
              </div>
            ))}
          </div>
        </section>

        <section aria-labelledby="hot-heading" className="space-y-3">
          <div className="rounded-[1.25rem] border border-pu-border bg-gradient-to-b from-pu-surface-raised/95 via-pu-surface to-black p-px shadow-[0_0_40px_-14px_oklch(0.7_0.29_328/0.32)]">
            <div className="rounded-[1.2rem] bg-gradient-to-br from-pu-surface/95 via-pu-surface-deep to-black px-3.5 pb-3.5 pt-3.5 sm:px-4 sm:pb-4 sm:pt-4">
              <div className="flex flex-wrap items-end justify-between gap-2.5">
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <motion.span
                      animate={{ scale: [1, 1.08, 1] }}
                      transition={{
                        duration: 2.2,
                        repeat: Infinity,
                        ease: "easeInOut",
                      }}
                    >
                      <Flame className="size-6 text-pu-amber drop-shadow-[0_0_14px_oklch(0.82_0.17_72/0.45)]" />
                    </motion.span>
                    <h2 id="hot-heading" className="pu-section-title-lg">
                      Hot right now
                    </h2>
                  </div>
                  <p className="pu-meta">Heat-ranked · switches fast tonight</p>
                </div>
                <motion.span
                  className="rounded-xl border border-pu-amber/45 bg-gradient-to-r from-pu-amber/18 to-pu-magenta/18 px-2.5 py-1.5 text-[10px] font-black uppercase tracking-[0.14em] text-pu-amber"
                  animate={{
                    boxShadow: [
                      "0 0 16px -8px oklch(0.82 0.17 72 / 0.2)",
                      "0 0 24px -6px oklch(0.7 0.29 328 / 0.35)",
                      "0 0 16px -8px oklch(0.82 0.17 72 / 0.2)",
                    ],
                  }}
                  transition={{ duration: 2.6, repeat: Infinity, ease: "easeInOut" }}
                >
                  Miss it = L
                </motion.span>
              </div>

              <div className="relative mt-3">
                <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-7 bg-gradient-to-r from-pu-surface-deep to-transparent sm:w-9" />
                <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-7 bg-gradient-to-l from-pu-surface-deep to-transparent sm:w-9" />
                <div className="-mx-1 flex gap-3 overflow-x-auto overscroll-x-contain px-1 pb-1.5 pt-0.5 [-ms-overflow-style:none] [scrollbar-width:none] snap-x snap-mandatory [&::-webkit-scrollbar]:hidden">
                  {hotEvents.map((event, index) => (
                    <EventCard
                      key={event.id}
                      event={event}
                      layout="carousel"
                      index={index}
                      hotRank={index + 1}
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        {!searchActive ? (
          <section aria-labelledby="feed-heading" className="space-y-3">
            <div className="space-y-1">
              <h2 id="feed-heading" className="pu-section-title-lg">
                Tonight feed
              </h2>
              <p className="pu-meta max-w-[18rem] leading-relaxed">
                Full pulse — pull up before it peaks.
              </p>
            </div>

            {filteredFeed.length === 0 ? (
              <div className="rounded-[1.25rem] border border-dashed border-pu-magenta/35 bg-black/35 px-5 py-12 text-center">
                <p className="font-heading text-xl font-black tracking-tight text-white">
                  Nothing hot in this lane right now.
                </p>
              </div>
            ) : (
              <ul className="pu-feed-stack">
                {filteredFeed.map((event, index) => (
                  <li key={event.id}>
                    <EventCard event={event} layout="feed" index={index} />
                  </li>
                ))}
              </ul>
            )}
          </section>
        ) : null}
      </div>

      <Sheet open={sheetOpen} onOpenChange={openChanged}>
        <SheetContent
          side="bottom"
          className="rounded-t-3xl border-t border-pu-border bg-pu-surface-deep p-0 pb-[env(safe-area-inset-bottom)] text-white"
          showCloseButton={selectedInterests.length > 0}
        >
          <SheetHeader className="px-5 pt-5">
            <p className="pu-eyebrow mb-2 text-[0.625rem]">Tune your feed</p>
            <SheetTitle className="font-heading text-[1.375rem] font-extrabold leading-tight tracking-[-0.03em] text-white sm:text-2xl">
              What are you trying to pull up to?
            </SheetTitle>
            <SheetDescription className="pt-2 text-[0.8125rem] font-semibold leading-snug text-white/55">
              Pick your lanes. We&apos;ll tune your feed and recommendations.
            </SheetDescription>
          </SheetHeader>

          <div className="grid grid-cols-2 gap-2 px-5 pb-2">
            {INTEREST_OPTIONS.map((interest) => {
              const active = selectedInterests.includes(interest.id);
              return (
                <button
                  key={interest.id}
                  type="button"
                  onClick={() => toggleInterest(interest.id)}
                  className={
                    active
                      ? "rounded-xl border border-pu-magenta/55 bg-pu-magenta-dim/30 px-3 py-3 text-left text-sm font-bold text-white shadow-[0_0_20px_-10px_oklch(0.7_0.29_328/0.45)]"
                      : "rounded-xl border border-pu-border bg-black/40 px-3 py-3 text-left text-sm font-semibold text-white/72 transition active:scale-[0.99] hover:border-white/18 hover:text-white/92"
                  }
                  aria-pressed={active}
                >
                  {interest.label}
                </button>
              );
            })}
          </div>

          <SheetFooter className="px-5 pb-5">
            <Button
              type="button"
              className="h-11 w-full rounded-xl border-0 bg-gradient-to-r from-pu-magenta to-pu-amber font-black uppercase tracking-[0.1em] text-white shadow-[0_0_24px_-8px_oklch(0.7_0.29_328/0.45)] disabled:opacity-40"
              onClick={() => setSheetOpen(false)}
              disabled={selectedInterests.length === 0}
            >
              Save interests
            </Button>
            <Button
              type="button"
              variant="ghost"
              className="h-9 w-full text-white/60 hover:text-white"
              onClick={() => setSheetOpen(false)}
            >
              Skip for now
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    </div>
  );
}
