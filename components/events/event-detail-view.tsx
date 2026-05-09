"use client";

import { useCallback, useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  Apple,
  ArrowLeft,
  Bookmark,
  CalendarCheck,
  CalendarDays,
  ExternalLink,
  Flag,
  Flame,
  MapPin,
  Music2,
  Navigation,
  Radio,
  Share2,
  Sparkles,
  Ticket,
  Users,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CrowdIndicator } from "@/components/events/crowd-indicator";
import { FollowVenueButton } from "@/components/profile/follow-venue-button";
import { SocialProofRow } from "@/components/events/social-proof-row";
import { UrgencyChip } from "@/components/events/urgency-chip";
import { MOCK_EVENTS } from "@/lib/mock-data";
import { cn } from "@/lib/utils";
import type { PuEvent } from "@/lib/types";
import {
  formatCurrencyFromCents,
  formatEntryKind,
  formatEventTimeRange,
} from "@/lib/event-utils";
import { useAppStore } from "@/store/use-app-store";

type EventDetailViewProps = {
  event: PuEvent;
};

function suggestDress(event: PuEvent): string {
  if (event.category === "bar_club") return "Dark fit + comfortable shoes";
  if (event.category === "frat_party") return "Party casual · layers";
  if (event.category === "watch_party") return "Team colors + easy layers";
  if (event.category === "campus") return "Campus casual";
  return "Night-out casual";
}

function mockLineupNotes(event: PuEvent): string {
  if (event.liveNow) return "Prime window right now · energy climbing in waves.";
  if (event.crowdStatus === "line_forming")
    return "Doors moving in bursts — pull up before the next surge.";
  return "Set times and room vibe can shift fast tonight (mock notice).";
}

function toUtcCompact(date: Date): string {
  const y = date.getUTCFullYear();
  const m = String(date.getUTCMonth() + 1).padStart(2, "0");
  const d = String(date.getUTCDate()).padStart(2, "0");
  const hh = String(date.getUTCHours()).padStart(2, "0");
  const mm = String(date.getUTCMinutes()).padStart(2, "0");
  const ss = String(date.getUTCSeconds()).padStart(2, "0");
  return `${y}${m}${d}T${hh}${mm}${ss}Z`;
}

function getGoogleCalendarUrl(event: PuEvent): string {
  const start = toUtcCompact(new Date(event.startsAt));
  const end = toUtcCompact(new Date(event.endsAt));
  const location = `${event.venueName}, ${event.area}, Champaign-Urbana`;
  const details = `${event.description}\n\nHost: ${event.hostLabel}`;
  const url = new URL("https://calendar.google.com/calendar/render");
  url.searchParams.set("action", "TEMPLATE");
  url.searchParams.set("text", event.title);
  url.searchParams.set("dates", `${start}/${end}`);
  url.searchParams.set("location", location);
  url.searchParams.set("details", details);
  return url.toString();
}

function downloadIcs(event: PuEvent) {
  const esc = (s: string) =>
    s.replace(/\\/g, "\\\\").replace(/\n/g, "\\n").replace(/,/g, "\\,").replace(/;/g, "\\;");
  const dtStamp = toUtcCompact(new Date());
  const dtStart = toUtcCompact(new Date(event.startsAt));
  const dtEnd = toUtcCompact(new Date(event.endsAt));
  const uid = `${event.id}@pull-up.mock`;
  const location = `${event.venueName}, ${event.area}, Champaign-Urbana`;
  const ics = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Pull Up//Event Mock//EN",
    "BEGIN:VEVENT",
    `UID:${uid}`,
    `DTSTAMP:${dtStamp}`,
    `DTSTART:${dtStart}`,
    `DTEND:${dtEnd}`,
    `SUMMARY:${esc(event.title)}`,
    `LOCATION:${esc(location)}`,
    `DESCRIPTION:${esc(`${event.description} | Host: ${event.hostLabel}`)}`,
    "END:VEVENT",
    "END:VCALENDAR",
  ].join("\r\n");
  const blob = new Blob([ics], { type: "text/calendar;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${event.id}.ics`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

function getRsvpCount(event: PuEvent, rsvpedHere: boolean): number {
  const base = Math.max(42, Math.round(event.savesCount * 0.34));
  return rsvpedHere ? base + 1 : base;
}

function SimilarCard({ event }: { event: PuEvent }) {
  return (
    <Link
      href={`/event/${event.id}`}
      className="group block w-[min(74vw,18rem)] shrink-0 snap-start overflow-hidden rounded-2xl border border-pu-border bg-black/45 transition hover:border-pu-magenta/35"
    >
      <div className="relative aspect-[4/3]">
        <Image
          src={event.imageUrl}
          alt={event.imageAlt}
          fill
          className="object-cover transition duration-500 group-hover:scale-[1.03]"
          sizes="(max-width: 768px) 70vw, 320px"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/25 to-transparent" />
        <div className="absolute bottom-2 left-2 right-2 flex items-center justify-between gap-2">
          <Badge className="border-white/15 bg-black/65 text-[10px] font-bold uppercase">
            {event.categoryLabel}
          </Badge>
          {event.liveNow ? (
            <span className="rounded-full border border-pu-live/50 bg-pu-live-dim/75 px-2 py-0.5 text-[9px] font-black uppercase tracking-wide text-pu-live">
              Live
            </span>
          ) : null}
        </div>
      </div>
      <div className="space-y-1.5 px-3 pb-3 pt-2.5">
        <p className="font-heading text-[1rem] font-extrabold leading-tight text-white">
          {event.title}
        </p>
        <p className="text-[12px] font-semibold text-white/62">
          {event.area} · {event.venueName}
        </p>
      </div>
    </Link>
  );
}

export function EventDetailView({ event }: EventDetailViewProps) {
  const saved = useAppStore((s) => s.savedEventIds.includes(event.id));
  const rsvped = useAppStore((s) => s.rsvpedEventIds.includes(event.id));
  const toggleSaveEvent = useAppStore((s) => s.toggleSaveEvent);
  const toggleRsvpEvent = useAppStore((s) => s.toggleRsvpEvent);

  const [flash, setFlash] = useState<string | null>(null);

  const showFlash = useCallback((msg: string) => {
    setFlash(msg);
    window.setTimeout(() => setFlash(null), 2600);
  }, []);

  const coverLabel =
    event.entryType === "cover"
      ? formatCurrencyFromCents(event.coverCents)
      : event.entryType === "rsvp"
        ? "RSVP"
        : "Free";
  const rsvpCount = getRsvpCount(event, rsvped);
  const sharePath = `/event/${event.id}`;
  const locationQuery = encodeURIComponent(`${event.venueName}, ${event.area}, Champaign-Urbana`);
  const appleMapsUrl = `https://maps.apple.com/?q=${locationQuery}`;
  const googleMapsUrl = `https://www.google.com/maps/search/?api=1&query=${locationQuery}`;
  const googleCalendarUrl = getGoogleCalendarUrl(event);

  const similarEvents = useMemo(() => {
    const score = (candidate: PuEvent) => {
      let s = 0;
      if (candidate.category === event.category) s += 4;
      if (candidate.area === event.area) s += 2;
      if (candidate.venueId === event.venueId) s += 5;
      if (
        candidate.vibeMusic
          .toLowerCase()
          .split(/[\/,]/)
          .some((token) => event.vibeMusic.toLowerCase().includes(token.trim()))
      ) {
        s += 2;
      }
      s += Math.min(3, Math.round(candidate.heatScore / 35));
      return s;
    };

    return MOCK_EVENTS.filter((x) => x.id !== event.id)
      .map((x) => ({ event: x, score: score(x) }))
      .sort((a, b) => b.score - a.score || b.event.heatScore - a.event.heatScore)
      .slice(0, 6)
      .map((x) => x.event);
  }, [event]);

  return (
    <div className="pu-screen pb-[calc(8rem+env(safe-area-inset-bottom)+4.5rem)]">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-[min(500px,72vh)] bg-[radial-gradient(ellipse_82%_56%_at_50%_-8%,oklch(0.55_0.22_328/0.28),transparent_58%)]" />

      <div className="relative mx-auto flex w-full max-w-lg flex-col px-4 pt-3 sm:pt-4">
        <div className="mb-3 flex items-center gap-2">
          <Link
            href="/"
            className="inline-flex size-11 shrink-0 items-center justify-center rounded-2xl border border-pu-border bg-black/55 text-white transition-colors hover:border-pu-magenta/45 hover:bg-pu-surface focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pu-magenta/60"
            aria-label="Back to Tonight"
          >
            <ArrowLeft className="size-5" aria-hidden />
          </Link>
          <span className="pu-eyebrow text-[0.625rem]">Decide fast</span>
        </div>

        {flash ? (
          <p
            className="mb-3 rounded-xl border border-pu-magenta/35 bg-pu-magenta-dim/25 px-3 py-2 text-center text-[0.8125rem] font-semibold text-white"
            aria-live="polite"
          >
            {flash}
          </p>
        ) : null}

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.42, ease: [0.22, 1, 0.36, 1] }}
          className="relative overflow-hidden rounded-[1.35rem] border border-pu-border shadow-[0_22px_52px_-28px_oklch(0.7_0.29_328/0.35)]"
        >
          {event.liveNow ? (
            <motion.div
              className="pointer-events-none absolute inset-0 z-[1] rounded-[inherit] ring-1 ring-pu-live/35"
              animate={{ opacity: [0.35, 0.75, 0.35] }}
              transition={{ duration: 2.2, repeat: Infinity, ease: "easeInOut" }}
            />
          ) : null}
          <div className="relative aspect-[4/5] w-full max-h-[72vh] sm:aspect-video sm:max-h-[58vh]">
            <motion.div
              className="absolute inset-0"
              animate={event.liveNow ? { scale: [1, 1.025, 1] } : { scale: 1 }}
              transition={{ duration: 11, repeat: event.liveNow ? Infinity : 0, ease: "easeInOut" }}
            >
              <Image
                src={event.imageUrl}
                alt={event.imageAlt}
                fill
                className="object-cover"
                priority
                loading="eager"
                fetchPriority="high"
                sizes="(max-width:768px) 100vw, 520px"
              />
            </motion.div>
            <div className="absolute inset-0 bg-gradient-to-t from-black via-black/65 to-transparent" />
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_65%_at_70%_0%,rgba(217,70,239,0.16),transparent_50%)]" />
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_55%_45%_at_15%_100%,rgba(251,191,36,0.1),transparent_60%)]" />

            {event.liveNow ? (
              <div className="absolute left-1/2 top-4 z-10 flex -translate-x-1/2 items-center gap-2 rounded-full border border-pu-live/50 bg-pu-live-dim/90 px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.16em] text-pu-live shadow-[0_0_22px_-2px_oklch(0.86_0.22_145/0.5)]">
                <span className="relative flex size-2">
                  <span className="absolute inline-flex size-full animate-ping rounded-full bg-pu-live opacity-70" />
                  <span className="relative inline-flex size-2 rounded-full bg-pu-live" />
                </span>
                Live now
              </div>
            ) : (
              <div className="absolute left-1/2 top-4 z-10 flex -translate-x-1/2 items-center gap-1.5 rounded-full border border-pu-border bg-black/60 px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.12em] text-white/82">
                <Radio className="size-3.5 text-white/55" aria-hidden />
                Lineup locked
              </div>
            )}

            <div className="absolute bottom-0 left-0 right-0 z-10 space-y-3 p-4 sm:p-6">
              <div className="flex flex-wrap items-center gap-2">
                <Badge className="border border-white/12 bg-black/70 text-[11px] font-bold uppercase tracking-wide text-white/95 backdrop-blur-sm">
                  {event.categoryLabel}
                </Badge>
                <Badge className="border border-white/12 bg-black/60 text-[11px] font-bold text-white/90">
                  {event.hostLabel}
                </Badge>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <CrowdIndicator status={event.crowdStatus} />
                <span className="rounded-full border border-pu-amber/35 bg-pu-amber/10 px-2 py-1 text-[10px] font-black uppercase tracking-wide text-pu-amber">
                  FOMO window active
                </span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {event.urgencyLabels.map((label, i) => (
                  <UrgencyChip key={label} emphasize={i === 0}>
                    <span className="inline-flex items-center gap-1">
                      {i === 0 ? (
                        <Sparkles className="size-3 text-amber-200" aria-hidden />
                      ) : null}
                      {label}
                    </span>
                  </UrgencyChip>
                ))}
              </div>
              <h1 className="font-heading text-[1.9rem] font-extrabold leading-[1.03] tracking-[-0.04em] text-balance text-white sm:text-[2.25rem]">
                {event.title}
              </h1>
              <p className="pu-meta-strong max-w-xl text-[0.9375rem] leading-snug">
                Campus is moving tonight — decide before momentum flips.
              </p>
            </div>
          </div>
        </motion.div>

        <section className="mt-5 space-y-3 rounded-[1.15rem] border border-pu-border bg-gradient-to-br from-pu-surface via-pu-surface-deep to-black p-4">
          <h2 className="text-[0.6875rem] font-extrabold uppercase tracking-[0.14em] text-white/55">
            Social proof
          </h2>
          <SocialProofRow event={event} />
          <div className="flex flex-wrap gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-lg border border-pu-border bg-black/35 px-2.5 py-1 text-[11px] font-bold text-white/88">
              <Users className="size-3.5 text-pu-amber" aria-hidden />
              {event.spottingCount.toLocaleString()} watching
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-lg border border-pu-border bg-black/35 px-2.5 py-1 text-[11px] font-bold text-white/88">
              <Flame className="size-3.5 text-pu-magenta" aria-hidden />
              {event.pullUpsLastHour}/hr pull ups
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-lg border border-pu-border bg-black/35 px-2.5 py-1 text-[11px] font-bold text-white/88">
              <Bookmark className="size-3.5 text-pu-magenta" aria-hidden />
              {event.savesCount.toLocaleString()} saved
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-lg border border-pu-border bg-black/35 px-2.5 py-1 text-[11px] font-bold text-white/88">
              <CalendarCheck className="size-3.5 text-pu-live" aria-hidden />
              {rsvpCount.toLocaleString()} RSVP
            </span>
          </div>
          <p className="pu-meta leading-relaxed">
            Crowds stay private on Pull Up — we only show momentum, never attendee lists.
          </p>
        </section>

        <section className="mt-5 space-y-4">
          <div className="flex flex-wrap items-start gap-x-5 gap-y-3">
            <div>
              <h3 className="text-[0.625rem] font-extrabold uppercase tracking-[0.14em] text-white/42">
                Date & time
              </h3>
              <p className="mt-1 text-[0.9375rem] font-semibold tabular-nums text-white">
                {formatEventTimeRange(event.startsAt, event.endsAt)}
              </p>
            </div>
            <div>
              <h3 className="text-[0.625rem] font-extrabold uppercase tracking-[0.14em] text-white/42">
                Entry
              </h3>
              <p className="mt-1 flex flex-wrap items-center gap-2 text-[0.9375rem] font-semibold text-white">
                <span>{formatEntryKind(event.entryType)}</span>
                <span className="inline-flex items-center gap-1 rounded-lg border border-pu-border bg-black/45 px-2 py-0.5 text-xs font-bold text-white">
                  <Ticket className="size-3.5 text-pu-amber" aria-hidden />
                  {coverLabel}
                </span>
              </p>
            </div>
          </div>

          <div className="flex items-start gap-2 rounded-xl border border-pu-border bg-black/35 p-3.5 sm:p-4">
            <MapPin className="mt-0.5 size-5 shrink-0 text-pu-magenta" aria-hidden />
            <div>
              <h3 className="text-[0.625rem] font-extrabold uppercase tracking-[0.14em] text-white/42">
                Venue
              </h3>
              <p className="mt-1 text-base font-bold text-white">{event.venueName}</p>
              <p className="text-sm font-semibold text-white/62">{event.area}</p>
            </div>
          </div>

          <div className="grid gap-2.5 sm:grid-cols-2">
            <div className="rounded-xl border border-pu-border bg-pu-surface/60 p-3.5 sm:p-4">
              <h3 className="text-[0.625rem] font-extrabold uppercase tracking-[0.14em] text-white/42">
                Age restriction
              </h3>
              <p className="mt-1.5 text-sm font-semibold text-white/90">{event.ageRestriction}</p>
            </div>
            <div className="rounded-xl border border-pu-border bg-pu-surface/60 p-3.5 sm:p-4">
              <h3 className="text-[0.625rem] font-extrabold uppercase tracking-[0.14em] text-white/42">
                Entry rules
              </h3>
              <p className="mt-1.5 text-sm font-semibold text-white/90">{event.stagRule}</p>
            </div>
          </div>

          <div className="rounded-xl border border-pu-magenta/25 bg-pu-magenta-dim/15 p-3.5 sm:p-4">
            <h3 className="text-[0.625rem] font-extrabold uppercase tracking-[0.14em] text-pu-magenta/90">
              Music / vibe
            </h3>
            <p className="mt-1.5 flex items-center gap-2 text-[0.9375rem] font-bold text-white">
              <Music2 className="size-4 text-pu-amber" aria-hidden />
              {event.vibeMusic}
            </p>
          </div>

          <div className="grid gap-2.5 sm:grid-cols-2">
            <div className="rounded-xl border border-pu-border bg-black/30 p-3.5 sm:p-4">
              <h3 className="text-[0.625rem] font-extrabold uppercase tracking-[0.14em] text-white/42">
                Dress suggestion (mock)
              </h3>
              <p className="mt-1.5 text-sm font-semibold text-white/88">
                {suggestDress(event)}
              </p>
            </div>
            <div className="rounded-xl border border-pu-border bg-black/30 p-3.5 sm:p-4">
              <h3 className="text-[0.625rem] font-extrabold uppercase tracking-[0.14em] text-white/42">
                Lineup / notes (mock)
              </h3>
              <p className="mt-1.5 text-sm font-semibold text-white/88">
                {mockLineupNotes(event)}
              </p>
            </div>
          </div>

          <div className="space-y-2">
            <h3 className="text-[0.625rem] font-extrabold uppercase tracking-[0.14em] text-white/42">
              Rundown
            </h3>
            <p className="text-[0.9375rem] font-medium leading-relaxed text-white/75">
              {event.description}
            </p>
          </div>

          <div className="rounded-xl border border-pu-border bg-black/30 p-3.5 sm:p-4">
            <h3 className="text-[0.625rem] font-extrabold uppercase tracking-[0.14em] text-white/42">
              Host / organizer
            </h3>
            <p className="mt-1.5 font-heading text-lg font-extrabold text-white sm:text-xl">
              {event.hostLabel}
            </p>
          </div>
        </section>

        <section className="mt-5 space-y-2.5 rounded-[1.15rem] border border-pu-border bg-gradient-to-br from-pu-surface via-pu-surface-deep to-black p-4">
          <h2 className="text-[0.6875rem] font-extrabold uppercase tracking-[0.14em] text-white/55">
            Actions
          </h2>
          <div className="grid gap-2 sm:grid-cols-2">
            <Button
              type="button"
              variant="outline"
              className="justify-start border-pu-border font-bold text-white hover:bg-white/10"
              onClick={() =>
                navigator.clipboard
                  .writeText(
                    `${typeof window !== "undefined" ? window.location.origin : ""}${sharePath}`
                  )
                  .then(() => showFlash("Link copied — send it to your crew."))
                  .catch(() => showFlash("Copy blocked — screenshot the flyer instead."))
              }
            >
              <Share2 className="mr-2 size-4" aria-hidden />
              Share
            </Button>
            <Button
              type="button"
              variant="outline"
              className="justify-start border-pu-border font-bold text-white hover:bg-white/10"
              onClick={() => window.open(googleCalendarUrl, "_blank", "noopener,noreferrer")}
            >
              <CalendarDays className="mr-2 size-4" aria-hidden />
              Add to Google Calendar
            </Button>
            <Button
              type="button"
              variant="outline"
              className="justify-start border-pu-border font-bold text-white hover:bg-white/10"
              onClick={() => {
                downloadIcs(event);
                showFlash("ICS downloaded — add it to Apple Calendar.");
              }}
            >
              <Apple className="mr-2 size-4" aria-hidden />
              Download Apple Calendar (.ics)
            </Button>
            <Button
              type="button"
              variant="outline"
              className="justify-start border-pu-border font-bold text-white hover:bg-white/10"
              onClick={() => window.open(appleMapsUrl, "_blank", "noopener,noreferrer")}
            >
              <Navigation className="mr-2 size-4" aria-hidden />
              Open in Apple Maps
            </Button>
            <Button
              type="button"
              variant="outline"
              className="justify-start border-pu-border font-bold text-white hover:bg-white/10"
              onClick={() => window.open(googleMapsUrl, "_blank", "noopener,noreferrer")}
            >
              <MapPin className="mr-2 size-4" aria-hidden />
              Open in Google Maps
            </Button>
            <Button
              type="button"
              variant="outline"
              className="justify-start border-pu-border font-bold text-white hover:bg-white/10"
              onClick={() => showFlash("Update flagged — nightly review (mock).")}
            >
              <Flag className="mr-2 size-4 text-pu-amber" aria-hidden />
              Report stale info
            </Button>
          </div>
          {event.externalUrl ? (
            <a
              href={event.externalUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-pu-border bg-white/[0.04] py-3 text-sm font-bold text-white transition hover:border-pu-magenta/40 hover:bg-white/[0.08]"
            >
              <ExternalLink className="size-4 shrink-0 text-pu-magenta" aria-hidden />
              Open flyer / external RSVP
            </a>
          ) : null}
        </section>

        <section className="mt-5 space-y-3 pb-2">
          <div className="flex items-center gap-2">
            <Sparkles className="size-4 text-pu-amber" aria-hidden />
            <h2 className="pu-section-title text-[1.25rem]">More moves tonight</h2>
          </div>
          <p className="pu-meta">
            Similar vibe, nearby pulse, same lane — keep options hot.
          </p>
          <div className="flex snap-x snap-mandatory gap-3 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {similarEvents.map((candidate) => (
              <SimilarCard key={candidate.id} event={candidate} />
            ))}
          </div>
        </section>
      </div>

      <motion.div
        initial={{ y: 32, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.12, duration: 0.36, ease: [0.22, 1, 0.36, 1] }}
        className="fixed inset-x-0 bottom-0 z-[45] px-4 pb-[calc(5.75rem+env(safe-area-inset-bottom))] pt-2"
      >
        <div className="mx-auto flex max-w-lg rounded-[1.25rem] border border-pu-border bg-zinc-950/94 px-3 py-2.5 shadow-[0_-14px_48px_-20px_rgba(0,0,0,0.88)] ring-1 ring-pu-magenta/12 backdrop-blur-md">
          <div className="flex w-full flex-wrap items-stretch gap-2">
            <Button
              type="button"
              size="icon-lg"
              variant="outline"
              aria-pressed={saved}
              aria-label={saved ? "Remove save" : "Save event"}
              className={cn(
                "shrink-0 border-pu-border",
                saved &&
                  "border-pu-magenta/55 bg-pu-magenta-dim/30 text-white shadow-[0_0_18px_-6px_oklch(0.7_0.29_328/0.45)]"
              )}
              onClick={(e) => {
                e.stopPropagation();
                toggleSaveEvent(event.id);
              }}
            >
              <Bookmark
                className={cn(
                  saved ? "fill-pu-magenta text-pu-magenta" : "text-white/85"
                )}
                aria-hidden
              />
            </Button>
            <FollowVenueButton
              venueId={event.venueId}
              variant="compact"
              className="h-11 border-pu-border"
            />
            <Button
              type="button"
              className={cn(
                "h-11 min-w-[10rem] flex-1 rounded-xl border-0 bg-gradient-to-r from-pu-magenta to-pu-amber font-black uppercase tracking-[0.06em] text-white shadow-[0_0_26px_-8px_oklch(0.7_0.29_328/0.5)] hover:opacity-95 active:scale-[0.99]"
              )}
              onClick={(e) => {
                e.stopPropagation();
                toggleRsvpEvent(event.id);
              }}
            >
              <CalendarCheck className="mr-2 size-4 shrink-0" aria-hidden />
              {event.entryType === "rsvp"
                ? rsvped
                  ? "RSVP'd ✓"
                  : "Tap to RSVP"
                : rsvped
                  ? "Going · tap to undo"
                  : "Mark going"}
            </Button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
