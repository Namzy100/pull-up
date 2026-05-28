"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { Bookmark, CalendarCheck, MapPin, Ticket } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { CrowdIndicator } from "@/components/events/crowd-indicator";
import { SocialProofRow } from "@/components/events/social-proof-row";
import { UrgencyChip } from "@/components/events/urgency-chip";
import { cn } from "@/lib/utils";
import type { PuEvent } from "@/lib/types";
import {
  formatCurrencyFromCents,
  formatEventTimeRange,
} from "@/lib/event-utils";
import { recordEventSurfaceView } from "@/lib/supabase/client-persistence";
import { useAppStore } from "@/store/use-app-store";

export type EventCardLayout = "feed" | "carousel";

type EventCardProps = {
  event: PuEvent;
  layout?: EventCardLayout;
  className?: string;
  index?: number;
  /** 1-based rank in Hot carousel */
  hotRank?: number;
};

export function EventCard({
  event,
  layout = "feed",
  className,
  index = 0,
  hotRank,
}: EventCardProps) {
  const isCarousel = layout === "carousel";
  const saved = useAppStore((s) => s.savedEventIds.includes(event.id));
  const rsvped = useAppStore((s) => s.rsvpedEventIds.includes(event.id));
  const toggleSaveEvent = useAppStore((s) => s.toggleSaveEvent);
  const toggleRsvpEvent = useAppStore((s) => s.toggleRsvpEvent);
  const rootRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const el = rootRef.current;
    if (!el) return;
    const key = `pu_view_${event.id}`;
    if (window.sessionStorage.getItem(key)) return;
    const obs = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting && entry.intersectionRatio >= 0.32) {
            window.sessionStorage.setItem(key, "1");
            void recordEventSurfaceView(event.id);
            obs.disconnect();
            break;
          }
        }
      },
      { threshold: [0, 0.32, 0.55] }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [event.id]);

  const coverLabel =
    event.entryType === "cover"
      ? formatCurrencyFromCents(event.coverCents)
      : event.entryType === "rsvp"
        ? "RSVP"
        : "Free";

  return (
    <motion.div
      ref={rootRef}
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        type: "spring",
        stiffness: 420,
        damping: 32,
        delay: Math.min(index * 0.04, 0.22),
      }}
      whileHover={!isCarousel ? { y: -3 } : { y: -2 }}
      whileTap={{ scale: 0.985 }}
      className={cn(
        isCarousel && "w-[min(82vw,300px)] shrink-0 snap-start",
        className
      )}
    >
      <motion.div className="rounded-[inherit]">
        <Card
          className={cn(
            "relative gap-0 overflow-hidden border border-white/[0.1] bg-pu-surface-deep/55 py-0 shadow-[0_14px_42px_-28px_rgba(0,0,0,0.92)] ring-0 transition-[transform,box-shadow,border-color] duration-300 hover:border-white/[0.16] hover:shadow-[0_20px_44px_-24px_rgba(0,0,0,0.9)] active:scale-[0.998]",
            isCarousel ? "rounded-2xl" : "rounded-3xl",
            event.liveNow && "border-white/[0.22]"
          )}
        >
          <Link
            href={`/event/${event.id}`}
            className={cn(
              "relative block w-full cursor-pointer overflow-hidden rounded-t-3xl rounded-b-none [-webkit-tap-highlight-color:transparent] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pu-magenta/65 focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-950",
              isCarousel && "rounded-t-2xl"
            )}
            prefetch
            aria-labelledby={`evt-card-title-${event.id}`}
          >
            <div
              className={cn(
                "relative w-full overflow-hidden",
                isCarousel ? "aspect-[4/5]" : "aspect-[16/10]"
              )}
            >
              <motion.div
                className="absolute inset-0"
                animate={
                  event.liveNow
                    ? { scale: [1, 1.025, 1] }
                    : { scale: 1 }
                }
                transition={{
                  duration: 12,
                  repeat: event.liveNow ? Infinity : 0,
                  ease: "easeInOut",
                }}
              >
                <Image
                  src={event.imageUrl}
                  alt=""
                  fill
                  className="object-cover"
                  sizes={isCarousel ? "300px" : "(max-width:768px) 100vw, 520px"}
                  priority={index < 2}
                  aria-hidden
                />
              </motion.div>

              <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/95 via-black/45 to-black/15" />
              <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_10%,rgba(255,255,255,0.12),transparent_56%)] opacity-20 mix-blend-soft-light" />

              {event.liveNow && (
                <div className="pointer-events-none absolute left-1/2 top-3 z-10 flex -translate-x-1/2 items-center gap-1.5 rounded-full bg-black/65 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-white">
                  <span className="relative flex size-2">
                    <span className="absolute inline-flex size-full animate-ping rounded-full bg-red-500 opacity-70" />
                    <span className="relative inline-flex size-2 rounded-full bg-red-500" />
                  </span>
                  Live
                </div>
              )}

              <div
                className={cn(
                  "absolute left-3 right-3 z-10 flex flex-wrap items-start justify-between gap-2",
                  event.liveNow ? "top-11" : "top-3"
                )}
              >
                <div className="flex flex-wrap items-center gap-2">
                  {hotRank !== undefined && (
                    <span className="pointer-events-none flex h-7 min-w-7 items-center justify-center rounded-full bg-gradient-to-br from-pu-amber to-pu-magenta px-2 text-[11px] font-black tabular-nums text-zinc-950 shadow-[0_2px_12px_-4px_oklch(0.82_0.17_72/0.35)]">
                      #{hotRank}
                    </span>
                  )}
                  <Badge className="pointer-events-none border-0 bg-black/55 text-[11px] font-semibold uppercase tracking-wide text-white/95 backdrop-blur-sm">
                    {event.categoryLabel}
                  </Badge>
                </div>
                <div className="pointer-events-none">
                  <CrowdIndicator
                    status={event.crowdStatus}
                    compact={isCarousel}
                    labelOverride={event.momentumLabel}
                  />
                </div>
              </div>

              <div className="absolute bottom-0 left-0 right-0 z-10 space-y-2.5 px-3 pb-3 pt-12 sm:space-y-3 sm:px-4 sm:pb-4">
                <div className="flex flex-wrap gap-1.5">
                  {event.urgencyLabels.slice(0, 2).map((label) => (
                    <UrgencyChip key={label} emphasize={false} className="border-0 bg-black/55 font-semibold tracking-[0.08em]">
                      <span className="inline-flex items-center gap-1">{label}</span>
                    </UrgencyChip>
                  ))}
                </div>
                <h3
                  id={`evt-card-title-${event.id}`}
                  className={cn(
                    "min-w-0 font-heading font-bold tracking-[-0.028em] text-balance text-white break-words",
                    isCarousel
                      ? "text-[1.15rem] leading-[1.12] sm:text-[1.22rem]"
                      : "text-[1.38rem] leading-[1.08] sm:text-[1.52rem]"
                  )}
                  style={{
                    textShadow:
                      "0 2px 20px rgba(0,0,0,0.9), 0 1px 2px rgba(0,0,0,0.5)",
                  }}
                >
                  {event.title}
                </h3>
                <p className="sr-only">{event.imageAlt}</p>
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[13px] font-semibold text-white/82 sm:text-sm">
                  <span className="inline-flex items-center gap-1.5">
                    <MapPin
                      className="size-4 shrink-0 text-pu-magenta/90"
                      aria-hidden
                    />
                    {event.area}
                    <span className="text-white/35">·</span>
                    {event.venueName}
                  </span>
                </div>
              </div>
            </div>
          </Link>

          <div
            className={cn(
              "relative grid gap-3 rounded-b-3xl bg-gradient-to-b from-zinc-900/92 to-black p-3.5 sm:gap-3.5 sm:p-4",
              "before:pointer-events-none before:absolute before:inset-x-0 before:top-0 before:h-px before:bg-gradient-to-r before:from-transparent before:via-white/[0.08] before:to-transparent",
              isCarousel && "rounded-b-2xl"
            )}
          >
            <SocialProofRow
              key={event.id}
              event={event}
              compact={isCarousel}
            />

            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                size={isCarousel ? "xs" : "sm"}
                variant="outline"
                aria-pressed={saved}
                aria-label={saved ? "Saved, tap to remove" : "Save event"}
                title={saved ? "Remove from saved" : "Save event"}
                className={cn(
                  "shrink-0 border-white/10 font-semibold transition-colors",
                  saved &&
                    "border-pu-magenta/40 bg-pu-magenta-dim/28 text-white hover:bg-pu-magenta-dim/38",
                  isCarousel && "min-w-0 px-2"
                )}
                onClick={(e) => {
                  e.stopPropagation();
                  toggleSaveEvent(event.id);
                }}
              >
                <Bookmark
                  className={cn(
                    !isCarousel && "mr-1",
                    saved ? "fill-pu-magenta text-pu-magenta" : "text-white/78"
                  )}
                  aria-hidden
                />
                {!isCarousel && (saved ? "Saved" : "Save")}
              </Button>
              <Button
                type="button"
                size={isCarousel ? "xs" : "sm"}
                variant="outline"
                aria-pressed={rsvped}
                aria-label={
                  event.entryType === "rsvp"
                    ? rsvped
                      ? "RSVP confirmed, tap to undo"
                      : "RSVP to event"
                    : rsvped
                      ? "Marked going, tap to undo"
                      : "Mark going"
                }
                title={
                  event.entryType === "rsvp"
                    ? rsvped
                      ? "Withdraw RSVP"
                      : "RSVP"
                    : rsvped
                      ? "Not going"
                      : "Going"
                }
                className={cn(
                  "shrink-0 border-white/10 font-semibold transition-colors",
                  rsvped &&
                    "border-pu-live/40 bg-pu-live-dim/32 text-pu-live hover:bg-pu-live-dim/45",
                  isCarousel && "min-w-0 px-2"
                )}
                onClick={(e) => {
                  e.stopPropagation();
                  toggleRsvpEvent(event.id);
                }}
              >
                <CalendarCheck
                  className={cn(
                    !isCarousel && "mr-1",
                    rsvped ? "text-pu-live" : "text-white/78"
                  )}
                  aria-hidden
                />
                {!isCarousel &&
                  (event.entryType === "rsvp"
                    ? rsvped
                      ? "RSVP'd"
                      : "RSVP"
                    : rsvped
                      ? "In"
                      : "Going")}
              </Button>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
              <span className="text-[13px] font-semibold tabular-nums text-white/55">
                {formatEventTimeRange(event.startsAt, event.endsAt)}
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-white/[0.08] px-2.5 py-1 text-xs font-semibold text-white">
                <Ticket className="size-3.5 text-white/85" aria-hidden />
                {coverLabel}
                {event.entryType === "cover" && event.coverCents !== null && (
                  <span className="font-semibold text-muted-foreground">
                    cover
                  </span>
                )}
              </span>
            </div>

            <p className="text-[13px] font-medium leading-snug text-white/86 sm:text-sm">
              <span className="text-white/60">Sound:</span> <span className="text-white/92">{event.vibeMusic}</span>
            </p>

            <div className="flex flex-wrap gap-1.5">
              <span className="rounded-full bg-white/[0.06] px-2.5 py-1 text-[11px] font-medium text-white/82">
                Stag {event.stagRule}
              </span>
              <span className="rounded-full bg-white/[0.06] px-2.5 py-1 text-[11px] font-medium text-white/82">
                {event.ageRestriction}
              </span>
            </div>
          </div>
        </Card>
      </motion.div>
    </motion.div>
  );
}
