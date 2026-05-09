"use client";

import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import { Bookmark, CalendarCheck, MapPin, Sparkles, Ticket } from "lucide-react";

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

  const coverLabel =
    event.entryType === "cover"
      ? formatCurrencyFromCents(event.coverCents)
      : event.entryType === "rsvp"
        ? "RSVP"
        : "Free";

  return (
    <motion.div
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
      <motion.div
        animate={
          event.liveNow
            ? {
                boxShadow: [
                  "0 0 0 0 oklch(0.86 0.22 145 / 0)",
                  "0 0 40px -10px oklch(0.86 0.22 145 / 0.4)",
                  "0 0 0 0 oklch(0.86 0.22 145 / 0)",
                ],
              }
            : {}
        }
        transition={{
          duration: 2.6,
          repeat: event.liveNow ? Infinity : 0,
          ease: "easeInOut",
        }}
        className="rounded-[inherit]"
      >
        <Card
          className={cn(
            "relative gap-0 overflow-hidden border border-pu-border bg-pu-surface-deep/50 py-0 shadow-[0_14px_44px_-26px_rgba(0,0,0,0.92)] ring-0 transition-[transform,box-shadow,border-color] duration-300 hover:border-pu-magenta/35 hover:shadow-[0_22px_48px_-22px_oklch(0.7_0.29_328/0.28)] active:scale-[0.998]",
            isCarousel ? "rounded-2xl" : "rounded-3xl",
            event.liveNow && "border-pu-live/35"
          )}
        >
          {event.liveNow && (
            <motion.div
              className="pointer-events-none absolute inset-0 z-[5] rounded-[inherit] ring-1 ring-inset ring-pu-live/40"
              animate={{ opacity: [0.3, 0.75, 0.3] }}
              transition={{
                duration: 2.2,
                repeat: Infinity,
                ease: "easeInOut",
              }}
              aria-hidden
            />
          )}

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

              <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black via-black/55 to-black/10" />
              <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_90%_70%_at_50%_0%,rgba(217,70,239,0.22),transparent_50%)]" />
              <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_60%_50%_at_80%_100%,rgba(251,191,36,0.12),transparent_55%)]" />

              {event.liveNow && (
                <div className="pointer-events-none absolute left-1/2 top-3 z-10 flex -translate-x-1/2 items-center gap-1.5 rounded-full border border-pu-live/55 bg-pu-live-dim/90 px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.18em] text-pu-live shadow-[0_0_22px_-2px_oklch(0.86_0.22_145/0.55)]">
                  <span className="relative flex size-2">
                    <span className="absolute inline-flex size-full animate-ping rounded-full bg-pu-live opacity-70" />
                    <span className="relative inline-flex size-2 rounded-full bg-pu-live shadow-[0_0_10px_oklch(0.86_0.22_145/0.9)]" />
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
                    <span className="pointer-events-none flex h-7 min-w-7 items-center justify-center rounded-full bg-gradient-to-br from-pu-amber to-pu-magenta px-2 text-[11px] font-black tabular-nums text-zinc-950 shadow-[0_0_18px_oklch(0.82_0.17_72/0.45)]">
                      #{hotRank}
                    </span>
                  )}
                  <Badge className="pointer-events-none border border-white/12 bg-black/70 text-[11px] font-bold uppercase tracking-wide text-white/95 backdrop-blur-sm">
                    {event.categoryLabel}
                  </Badge>
                </div>
                <div className="pointer-events-none">
                  <CrowdIndicator status={event.crowdStatus} compact={isCarousel} />
                </div>
              </div>

              <div className="absolute bottom-0 left-0 right-0 z-10 space-y-2.5 px-3 pb-3 pt-12 sm:space-y-3 sm:px-4 sm:pb-4">
                <div className="flex flex-wrap gap-1.5">
                  {event.urgencyLabels.slice(0, 2).map((label, i) => (
                    <UrgencyChip key={label} emphasize={i === 0}>
                      <span className="inline-flex items-center gap-1">
                        {i === 0 ? (
                          <Sparkles
                            className="size-3 shrink-0 text-amber-200"
                            aria-hidden
                          />
                        ) : null}
                        {label}
                      </span>
                    </UrgencyChip>
                  ))}
                </div>
                <h3
                  id={`evt-card-title-${event.id}`}
                  className={cn(
                    "font-heading font-extrabold tracking-[-0.032em] text-balance text-white",
                    isCarousel
                      ? "text-[1.3rem] leading-[1.08]"
                      : "text-[1.55rem] leading-[1.06] sm:text-[1.72rem]"
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
                      className="size-4 shrink-0 text-pu-magenta drop-shadow-[0_0_10px_oklch(0.7_0.29_328/0.45)]"
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
              "relative grid gap-3 rounded-b-3xl bg-gradient-to-br from-pu-surface via-pu-surface-deep to-black p-3 sm:gap-3.5 sm:p-4",
              "before:pointer-events-none before:absolute before:inset-x-0 before:top-0 before:h-px before:bg-gradient-to-r before:from-transparent before:via-pu-magenta/40 before:to-transparent",
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
                  "shrink-0 border-white/15 font-bold transition-colors",
                  saved &&
                    "border-pu-magenta/55 bg-pu-magenta-dim/35 text-white shadow-[0_0_20px_-8px_oklch(0.7_0.29_328/0.45)] hover:bg-pu-magenta-dim/45",
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
                  "shrink-0 border-white/15 font-bold transition-colors",
                  rsvped &&
                    "border-pu-live/50 bg-pu-live-dim/40 text-pu-live shadow-[0_0_20px_-8px_oklch(0.86_0.22_145/0.35)] hover:bg-pu-live-dim/55",
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
              <span className="inline-flex items-center gap-1.5 rounded-lg border border-white/12 bg-black/40 px-2.5 py-1 text-xs font-bold text-white">
                <Ticket className="size-3.5 text-amber-400" aria-hidden />
                {coverLabel}
                {event.entryType === "cover" && event.coverCents !== null && (
                  <span className="font-semibold text-muted-foreground">
                    cover
                  </span>
                )}
              </span>
            </div>

            <p className="text-[13px] font-semibold leading-snug text-white/82 sm:text-sm">
              <span className="bg-gradient-to-r from-pu-magenta to-pu-amber bg-clip-text font-extrabold text-transparent">
                Vibe
              </span>{" "}
              <span className="text-white/90">{event.vibeMusic}</span>
            </p>

            <div className="flex flex-wrap gap-2">
              <span className="rounded-md border border-white/12 bg-black/35 px-2 py-1 text-[11px] font-semibold text-white/85">
                Stag {event.stagRule}
              </span>
              <span className="rounded-md border border-white/12 bg-black/35 px-2 py-1 text-[11px] font-semibold text-white/85">
                {event.ageRestriction}
              </span>
            </div>
          </div>
        </Card>
      </motion.div>
    </motion.div>
  );
}
