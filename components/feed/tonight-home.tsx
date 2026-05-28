"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState, useSyncExternalStore } from "react";
import { motion } from "framer-motion";
import { Bookmark, Search, X } from "lucide-react";

import { LiveAmbient } from "@/components/feed/live-ambient";
import { DealCard } from "@/components/deals/deal-card";
import { EventCard } from "@/components/events/event-card";
import { useCampusLiveSubscription } from "@/hooks/use-campus-live-subscription";
import type { PuDeal, PuEvent } from "@/lib/types";
import {
  filterEventsByInterests,
  getRecommendedEvents,
  INTEREST_OPTIONS,
} from "@/lib/recommendations";
import { filterEventsBySearch } from "@/lib/event-search";
import { buildLiveFeedBuckets } from "@/lib/trending-engine";
import { hasSupabaseEnv } from "@/lib/supabase/env";
import { getCampusPulseTotals, getHotEvents } from "@/lib/mock-data";
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
  feedEvents: PuEvent[];
  campusPulse: CampusPulse;
  deals: PuDeal[];
  /** Public preview (`/?demo=1`) — not a signed-in session. */
  demoMode?: boolean;
};

const INTEREST_PROMPT_LS = "pu_has_seen_interest_prompt";

function readInterestPromptSeen(): boolean {
  if (typeof window === "undefined") return false;
  return window.localStorage.getItem(INTEREST_PROMPT_LS) === "1";
}

function writeInterestPromptSeen() {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(INTEREST_PROMPT_LS, "1");
}

export function TonightHome({
  feedEvents,
  campusPulse,
  deals,
  demoMode = false,
}: TonightHomeProps) {
  const router = useRouter();
  const exitDemoMode = useAppStore((s) => s.exitDemoMode);
  const profile = useAppStore((s) => s.mockProfile);
  const selectedInterests = useAppStore((s) => s.selectedInterests);
  const followedVenueIds = useAppStore((s) => s.followedVenueIds);
  const savedEventIds = useAppStore((s) => s.savedEventIds);
  const toggleInterest = useAppStore((s) => s.toggleInterest);
  const liveEnabled = hasSupabaseEnv();
  const { events: liveEvents, deals: liveDeals } = useCampusLiveSubscription({
    initialEvents: feedEvents,
    initialDeals: deals,
    enabled: liveEnabled,
  });

  const pulseLive = useMemo(() => getCampusPulseTotals(liveEvents), [liveEvents]);
  const pulse = liveEnabled ? pulseLive : campusPulse;

  const userAreaHints = useMemo(() => {
    const c = profile.campus || "";
    return c
      .split(/[^a-zA-Z0-9]+/)
      .map((w) => w.trim())
      .filter((w) => w.length > 2)
      .slice(0, 10);
  }, [profile.campus]);

  const buckets = useMemo(
    () =>
      buildLiveFeedBuckets(liveEvents, liveDeals, {
        userAreaHints,
        followedVenueIds,
        interests: selectedInterests,
      }),
    [liveDeals, liveEvents, followedVenueIds, selectedInterests, userAreaHints]
  );

  const hotLive = useMemo(() => getHotEvents(liveEvents, 5), [liveEvents]);
  const mounted = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false
  );
  const [userDismissedInterest, setUserDismissedInterest] = useState(false);

  const interestPromptDismissed =
    userDismissedInterest || (mounted && readInterestPromptSeen());

  const sheetOpen =
    mounted &&
    !profile.onboardingComplete &&
    selectedInterests.length === 0 &&
    !interestPromptDismissed;

  const [searchQuery, setSearchQuery] = useState("");
  const searchActive = searchQuery.trim().length > 0;

  const filteredBySearch = useMemo(
    () => filterEventsBySearch(liveEvents, searchQuery),
    [liveEvents, searchQuery]
  );

  const filteredFeed = useMemo(
    () => filterEventsByInterests(filteredBySearch, selectedInterests),
    [filteredBySearch, selectedInterests]
  );

  const recommended = useMemo(
    () =>
      getRecommendedEvents(liveEvents, selectedInterests, 4, {
        followedVenueIds,
        savedEventIds,
      }),
    [liveEvents, selectedInterests, followedVenueIds, savedEventIds]
  );

  const openChanged = (open: boolean) => {
    if (!open) {
      writeInterestPromptSeen();
      setUserDismissedInterest(true);
    }
  };

  const dismissInterestSheet = () => {
    writeInterestPromptSeen();
    setUserDismissedInterest(true);
  };

  return (
    <div className="pu-screen">
      <LiveAmbient />
      <div className="pointer-events-none absolute inset-x-0 top-0 h-[320px] bg-[radial-gradient(ellipse_85%_58%_at_50%_-14%,oklch(0.55_0.22_328/0.15),transparent_60%)]" />

      <div className="relative mx-auto flex w-full max-w-lg flex-col gap-7 px-4 pb-3 pt-8 sm:gap-8 sm:pt-10">
        {demoMode ? (
          <div className="flex flex-col gap-3 rounded-2xl border border-amber-200/25 bg-amber-500/10 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="space-y-1">
              <p className="text-[10px] font-black uppercase tracking-[0.16em] text-amber-200/90">
                Demo mode
              </p>
              <p className="text-xs font-medium leading-relaxed text-white/75">
                Sample profile and saves stay on this device.{" "}
                <span className="text-white/90">You are not signed in.</span>
              </p>
            </div>
            <div className="flex shrink-0 flex-wrap gap-2">
              <Button
                type="button"
                size="sm"
                variant="outline"
                className="border-white/20 text-xs font-semibold text-white"
                onClick={() => {
                  exitDemoMode();
                  router.replace("/");
                }}
              >
                Exit demo
              </Button>
              <Button
                type="button"
                size="sm"
                className="text-xs font-semibold"
                asChild
              >
                <Link href="/signup">Create account</Link>
              </Button>
            </div>
          </div>
        ) : null}
        <motion.header
          initial={{ opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          className="space-y-5"
        >
          <div className="space-y-2">
            <p className="pu-eyebrow text-white/55">UIUC tonight</p>
            <div className="space-y-2">
              <h1 className="font-heading text-[2rem] font-extrabold leading-[0.95] tracking-[-0.04em] text-white sm:text-[2.2rem]">
                Something&apos;s already happening.
              </h1>
              <p className="max-w-[22rem] text-[0.92rem] font-medium leading-relaxed text-white/70">
                Live scenes across Campustown. Find the move before the line does.
              </p>
            </div>
          </div>

          <div className="flex items-center justify-between gap-3">
            <p className="text-[0.78rem] font-semibold uppercase tracking-[0.13em] text-white/55">
              {pulse.liveVenues} scenes live now
            </p>
            <Link
              href="/my-events"
              className="inline-flex items-center gap-1.5 rounded-full bg-white/[0.06] px-3 py-1.5 text-[0.7rem] font-semibold uppercase tracking-[0.12em] text-white/82 transition hover:bg-white/[0.12]"
            >
              <Bookmark className="size-3.5" aria-hidden />
              My Events
            </Link>
          </div>

          <div className="relative">
            <Search
              className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-white/45"
              aria-hidden
            />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search parties, food, frats, dates…"
              aria-label="Search events"
              className="h-12 rounded-2xl border-white/10 bg-white/[0.04] py-2 pl-10 pr-11 text-[0.95rem] font-medium text-white placeholder:text-white/38 focus-visible:border-white/20 focus-visible:ring-0"
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
                      ? "rounded-full bg-white px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.1em] text-black"
                      : "rounded-full bg-white/[0.06] px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.1em] text-white/65 transition active:scale-[0.98] hover:bg-white/[0.12] hover:text-white/92"
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
              <div className="pu-empty-panel">
                <p className="pu-empty-panel-title">No move found</p>
                <p className="pu-empty-panel-hint">Try another search or clear filters — spelling counts on campus nicknames.</p>
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

        {!searchActive && buckets.trendingTonight.length > 0 ? (
          <section aria-labelledby="trending-tonight-heading" className="space-y-3">
            <div>
              <h2 id="trending-tonight-heading" className="pu-section-title-lg">
                Trending tonight
              </h2>
              <p className="pu-meta mt-1">
                The moves everyone keeps sending in group chats.
              </p>
            </div>
            <div className="pu-strip-scroll gap-3">
              {buckets.trendingTonight.map((event, index) => (
                <div key={event.id} className="w-[min(82vw,300px)] shrink-0 snap-start">
                  <EventCard event={event} layout="carousel" index={index} />
                </div>
              ))}
            </div>
          </section>
        ) : null}

        {!searchActive && buckets.risingNearYou.length > 0 ? (
          <section aria-labelledby="rising-near-heading" className="space-y-3">
            <div>
              <h2 id="rising-near-heading" className="pu-section-title-lg">
                Rising near you
              </h2>
              <p className="pu-meta mt-1">Velocity + your campus lanes — not just raw saves.</p>
              
            </div>
            <div className="pu-strip-scroll gap-3">
              {buckets.risingNearYou.map((event, index) => (
                <div key={event.id} className="w-[min(82vw,300px)] shrink-0 snap-start">
                  <EventCard event={event} layout="carousel" index={index} />
                </div>
              ))}
            </div>
          </section>
        ) : null}

        <section aria-labelledby="recommended-heading" className="space-y-3">
          <div className="flex items-end justify-between gap-2">
            <div>
              <h2 id="recommended-heading" className="pu-section-title-lg">
                Recommended for you
              </h2>
              <p className="pu-meta mt-1">
                Based on your lanes and where energy is building.
              </p>
            </div>
            <span className="rounded-full bg-white/[0.08] px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.12em] text-white/80">
              Your vibe
            </span>
          </div>

          <div className="pu-strip-scroll gap-3">
            {recommended.map(({ event, reasons }, index) => (
              <div key={event.id} className="w-[min(82vw,300px)] shrink-0 snap-start">
                <div className="mb-2 flex flex-wrap gap-1">
                  {(reasons.length > 0 ? reasons : ["Live right now"]).map((reason) => (
                    <Badge key={reason} variant="outline" className="border-white/15 bg-black/30 text-[10px] font-medium text-white/78">
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
          <div className="rounded-[1.25rem] border border-white/10 bg-zinc-950 p-px">
            <div className="rounded-[1.2rem] bg-zinc-950/95 px-3.5 pb-3.5 pt-3.5 sm:px-4 sm:pb-4 sm:pt-4">
              <div className="flex flex-wrap items-end justify-between gap-2.5">
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <h2 id="hot-heading" className="pu-section-title-lg">
                      Hot right now
                    </h2>
                  </div>
                  <p className="pu-meta">Where everyone is pulling up next.</p>
                </div>
                <span className="rounded-full bg-white/[0.08] px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.12em] text-white/80">Tonight</span>
              </div>

              <div className="relative mt-3">
                <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-7 bg-gradient-to-r from-pu-surface-deep to-transparent sm:w-9" />
                <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-7 bg-gradient-to-l from-pu-surface-deep to-transparent sm:w-9" />
                <div className="-mx-1 flex gap-3 overflow-x-auto overscroll-x-contain px-1 pb-1.5 pt-0.5 [-ms-overflow-style:none] [scrollbar-width:none] snap-x snap-mandatory [&::-webkit-scrollbar]:hidden">
                  {hotLive.map((event, index) => (
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

        {!searchActive && buckets.startingSoon.length > 0 ? (
          <section aria-labelledby="starting-soon-heading" className="space-y-3">
            <div>
              <h2 id="starting-soon-heading" className="pu-section-title-lg">
                Starting soon
              </h2>
              <p className="pu-meta mt-1">Doors and lines are about to flip — get ahead of the crowd.</p>
            </div>
            <div className="pu-strip-scroll gap-3">
              {buckets.startingSoon.map((event, index) => (
                <div key={event.id} className="w-[min(82vw,300px)] shrink-0 snap-start">
                  <EventCard event={event} layout="carousel" index={index} />
                </div>
              ))}
            </div>
          </section>
        ) : null}

        {!searchActive && buckets.packedRightNow.length > 0 ? (
          <section aria-labelledby="packed-heading" className="space-y-3">
            <div>
              <h2 id="packed-heading" className="pu-section-title-lg">
                Packed right now
              </h2>
              <p className="pu-meta mt-1">Momentum labels from live engagement — not vibes alone.</p>
            </div>
            <div className="pu-strip-scroll gap-3">
              {buckets.packedRightNow.map((event, index) => (
                <div key={event.id} className="w-[min(82vw,300px)] shrink-0 snap-start">
                  <EventCard event={event} layout="carousel" index={index} />
                </div>
              ))}
            </div>
          </section>
        ) : null}

        {!searchActive && buckets.dealsEndingSoon.length > 0 ? (
          <section aria-labelledby="deals-ending-heading" className="space-y-3">
            <div>
              <h2 id="deals-ending-heading" className="pu-section-title-lg">
                Deals ending soon
              </h2>
              <p className="pu-meta mt-1">Clock&apos;s running on tonight&apos;s steals.</p>
            </div>
            <div className="pu-strip-scroll gap-3">
              {buckets.dealsEndingSoon.map((deal, index) => (
                <div key={deal.id} className="w-[min(82vw,300px)] shrink-0 snap-start">
                  <DealCard deal={deal} index={index} layout="feed" />
                </div>
              ))}
            </div>
          </section>
        ) : null}

        {!searchActive && buckets.mostSavedTonight.length > 0 ? (
          <section aria-labelledby="most-saved-heading" className="space-y-3">
            <div>
              <h2 id="most-saved-heading" className="pu-section-title-lg">
                Most saved tonight
              </h2>
              <p className="pu-meta mt-1">Campus is bookmarking these moves first.</p>
            </div>
            <div className="pu-strip-scroll gap-3">
              {buckets.mostSavedTonight.map((event, index) => (
                <div key={event.id} className="w-[min(82vw,300px)] shrink-0 snap-start">
                  <EventCard event={event} layout="carousel" index={index} />
                </div>
              ))}
            </div>
          </section>
        ) : null}

        {!searchActive &&
        (buckets.underrated.length > 0 || buckets.newAndHeating.length > 0) ? (
          <section aria-labelledby="hidden-gems-heading" className="space-y-3">
            <div>
              <h2 id="hidden-gems-heading" className="pu-section-title-lg">
                Underrated &amp; new heat
              </h2>
              <p className="pu-meta mt-1">Quiet saves with velocity, plus fresh drops catching traction.</p>
            </div>
            <div className="pu-strip-scroll gap-3">
              {[...buckets.newAndHeating, ...buckets.underrated].map((event, index) => (
                <div key={`${event.id}-${index}`} className="w-[min(82vw,300px)] shrink-0 snap-start">
                  <EventCard event={event} layout="carousel" index={index} />
                </div>
              ))}
            </div>
          </section>
        ) : null}

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
              <div className="pu-empty-panel border-pu-magenta/12">
                <p className="pu-empty-panel-title">Nothing hot in this lane</p>
                <p className="pu-empty-panel-hint">
                  Loosen interest filters or check back — the pulse updates live.
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
          showCloseButton={
            selectedInterests.length > 0 ||
            profile.onboardingComplete ||
            interestPromptDismissed
          }
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
              onClick={dismissInterestSheet}
              disabled={selectedInterests.length === 0}
            >
              Save interests
            </Button>
            <Button
              type="button"
              variant="ghost"
              className="h-9 w-full text-white/60 hover:text-white"
              onClick={dismissInterestSheet}
            >
              Skip for now
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    </div>
  );
}
