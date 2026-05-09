"use client";

import Image from "next/image";
import Link from "next/link";
import { useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Bookmark, MapPin, Radio, Sparkles } from "lucide-react";

import { Button } from "@/components/ui/button";
import { FollowVenueButton } from "@/components/profile/follow-venue-button";
import { cn } from "@/lib/utils";
import {
  DEAL_MAP_POSITIONS,
  EVENT_MAP_POSITIONS,
  MAP_FILTER_CHIPS,
  MAP_HOT_ZONES,
  MAP_ZONE_LABELS,
  type CampusMapFilter,
  dealMatchesMapFilter,
  eventMatchesMapFilter,
  getDealPinVariant,
  getEventPinVariant,
} from "@/lib/campus-map";
import { MOCK_DEALS } from "@/lib/deals-data";
import { MOCK_EVENTS } from "@/lib/mock-data";
import { crowdLabel, formatEventTimeRange } from "@/lib/event-utils";
import { useAppStore } from "@/store/use-app-store";

function showEventPin(filter: CampusMapFilter): boolean {
  return filter !== "deals";
}

function showDealPin(filter: CampusMapFilter): boolean {
  return filter !== "events";
}

function eventVisible(event: (typeof MOCK_EVENTS)[0], filter: CampusMapFilter) {
  if (!showEventPin(filter)) return false;
  if (filter === "all" || filter === "events") return true;
  return eventMatchesMapFilter(event, filter);
}

function dealVisible(deal: (typeof MOCK_DEALS)[0], filter: CampusMapFilter) {
  if (!showDealPin(filter)) return false;
  if (filter === "all" || filter === "deals") return true;
  return dealMatchesMapFilter(deal, filter);
}

const pinRing: Record<
  ReturnType<typeof getEventPinVariant> | "deal",
  string
> = {
  party: "bg-fuchsia-500 shadow-[0_0_18px_rgba(217,70,239,0.85)]",
  food: "bg-amber-400 shadow-[0_0_16px_rgba(251,191,36,0.75)]",
  bar: "bg-violet-400 shadow-[0_0_16px_rgba(167,139,250,0.75)]",
  campus: "bg-emerald-400/90 shadow-[0_0_14px_rgba(52,211,153,0.55)]",
  sports: "bg-sky-400 shadow-[0_0_16px_rgba(56,189,248,0.7)]",
  music: "bg-pink-400 shadow-[0_0_16px_rgba(244,114,182,0.75)]",
  deal: "bg-gradient-to-br from-fuchsia-500 to-amber-400 shadow-[0_0_18px_rgba(217,70,239,0.65)]",
};

function crowdGlowClass(
  status: (typeof MOCK_EVENTS)[0]["crowdStatus"],
  live: boolean
): string {
  if (live) return "opacity-90 scale-[1.35]";
  switch (status) {
    case "packed":
    case "line_forming":
      return "opacity-80 scale-125";
    case "active":
      return "opacity-65 scale-110";
    default:
      return "opacity-40 scale-100";
  }
}

export function CampusRadarMap() {
  const [filter, setFilter] = useState<CampusMapFilter>("all");
  const [selected, setSelected] = useState<
    { kind: "event"; id: string } | { kind: "deal"; id: string } | null
  >(null);

  const toggleSaveEvent = useAppStore((s) => s.toggleSaveEvent);
  const toggleSaveDeal = useAppStore((s) => s.toggleSaveDeal);
  const savedEventIds = useAppStore((s) => s.savedEventIds);
  const savedDealIds = useAppStore((s) => s.savedDealIds);

  const eventsOnMap = useMemo(
    () => MOCK_EVENTS.filter((e) => eventVisible(e, filter)),
    [filter]
  );
  const dealsOnMap = useMemo(
    () => MOCK_DEALS.filter((d) => dealVisible(d, filter)),
    [filter]
  );

  const selectedEvent = useMemo(
    () =>
      selected?.kind === "event"
        ? MOCK_EVENTS.find((e) => e.id === selected.id)
        : undefined,
    [selected]
  );
  const selectedDeal = useMemo(
    () =>
      selected?.kind === "deal"
        ? MOCK_DEALS.find((d) => d.id === selected.id)
        : undefined,
    [selected]
  );

  return (
    <div className="pu-screen pb-[calc(8.25rem+env(safe-area-inset-bottom))]">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-[min(360px,52vh)] bg-[radial-gradient(ellipse_78%_54%_at_50%_-4%,oklch(0.55_0.22_328/0.2),transparent_60%)]" />

      <div className="relative mx-auto flex w-full max-w-lg flex-col gap-4 px-4 pt-7 sm:pt-9">
        <header className="space-y-1.5">
          <div className="flex items-center gap-2">
            <motion.span
              animate={{ opacity: [0.75, 1, 0.75] }}
              transition={{ duration: 2.2, repeat: Infinity, ease: "easeInOut" }}
            >
              <Radio className="size-5 text-pu-live drop-shadow-[0_0_12px_oklch(0.86_0.22_145/0.45)]" />
            </motion.span>
            <p className="pu-eyebrow text-[0.625rem]">Campus radar</p>
          </div>
          <h1 className="pu-display text-balance text-[2.2rem] sm:text-[2.55rem]">
            See where the night is heating up.
          </h1>
          <p className="pu-meta-strong max-w-[22rem] text-[0.8125rem] leading-relaxed">
            Hot zones pulse from live activity — tap a pin to lock a move.
          </p>
          <p className="pu-meta max-w-[22rem] text-[0.8125rem] leading-relaxed">
            Mock UIUC grid tonight (no GPS yet).
          </p>
        </header>

        <div className="-mx-1 flex gap-2 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {MAP_FILTER_CHIPS.map(({ id, label }) => (
            <button
              key={id}
              type="button"
              onClick={() => {
                setFilter(id);
                setSelected(null);
              }}
              className={cn(
                "shrink-0 rounded-full border px-3.5 py-2 text-[11px] font-black uppercase tracking-wide transition",
                filter === id
                  ? "border-pu-magenta/55 bg-pu-magenta-dim/30 text-white shadow-[0_0_16px_-8px_oklch(0.7_0.29_328/0.45)]"
                  : "border-pu-border bg-black/45 text-white/55 hover:border-white/22 hover:text-white/85"
              )}
            >
              {label}
            </button>
          ))}
        </div>

        <div
          className="relative aspect-[3/4] w-full overflow-hidden rounded-[1.35rem] border border-pu-border bg-[#08080d] shadow-[0_0_44px_-16px_oklch(0.7_0.29_328/0.28)] ring-1 ring-pu-magenta/12 sm:aspect-[4/5]"
          style={{
            backgroundImage: `
              linear-gradient(rgba(255,255,255,0.045) 1px, transparent 1px),
              linear-gradient(90deg, rgba(255,255,255,0.045) 1px, transparent 1px),
              radial-gradient(ellipse at 50% 100%, rgba(217,70,239,0.08), transparent 55%)
            `,
            backgroundSize: "22px 22px, 22px 22px, 100% 100%",
          }}
          onClick={() => setSelected(null)}
          role="presentation"
        >
          {/* Zone labels */}
          {MAP_ZONE_LABELS.map((z) => (
            <span
              key={z.id}
              className="pointer-events-none absolute rounded-md border border-white/10 bg-black/40 px-2 py-1 text-[9px] font-black uppercase tracking-[0.14em] text-white/55"
              style={{ left: `${z.xPct}%`, top: `${z.yPct}%`, transform: "translate(-50%, -50%)" }}
            >
              {z.label}
            </span>
          ))}

          {/* Hot zone rings */}
          {MAP_HOT_ZONES.map((z, i) => (
            <motion.div
              key={i}
              className="pointer-events-none absolute rounded-full border border-pu-amber/22 bg-pu-amber/[0.06]"
              style={{
                left: `${z.xPct}%`,
                top: `${z.yPct}%`,
                width: `${z.radius}%`,
                height: `${z.radius}%`,
                transform: "translate(-50%, -50%)",
              }}
              animate={{
                opacity: [0.35, 0.65, 0.35],
                scale: [0.98, 1.05, 0.98],
              }}
              transition={{
                duration: 3.2 + i * 0.4,
                repeat: Infinity,
                ease: "easeInOut",
              }}
            />
          ))}

          {/* Event pins */}
          {eventsOnMap.map((event) => {
            const pos = EVENT_MAP_POSITIONS[event.id];
            if (!pos) return null;
            const v = getEventPinVariant(event);
            const active = selected?.kind === "event" && selected.id === event.id;
            return (
              <button
                key={event.id}
                type="button"
                className="absolute z-20 -translate-x-1/2 -translate-y-1/2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-fuchsia-400"
                style={{ left: `${pos.xPct}%`, top: `${pos.yPct}%` }}
                onClick={(e) => {
                  e.stopPropagation();
                  setSelected({ kind: "event", id: event.id });
                }}
                aria-label={`${event.title} pin`}
              >
                <span className="relative flex size-9 items-center justify-center">
                  <motion.span
                    className={cn(
                      "absolute inset-0 rounded-full bg-fuchsia-500/25 blur-md",
                      crowdGlowClass(event.crowdStatus, event.liveNow)
                    )}
                    animate={
                      event.liveNow || event.crowdStatus === "packed"
                        ? { opacity: [0.45, 0.85, 0.45] }
                        : {}
                    }
                    transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}
                  />
                  <span
                    className={cn(
                      "relative size-3.5 rounded-full ring-2 ring-black/60",
                      pinRing[v]
                    )}
                  />
                  {active ? (
                    <span className="absolute -inset-1 rounded-full ring-2 ring-amber-300/80" />
                  ) : null}
                </span>
              </button>
            );
          })}

          {/* Deal pins (diamond-ish square) */}
          {dealsOnMap.map((deal) => {
            const pos = DEAL_MAP_POSITIONS[deal.id];
            if (!pos) return null;
            const v = getDealPinVariant(deal);
            const ringClass = v === "food" ? pinRing.food : v === "bar" ? pinRing.bar : pinRing.deal;
            const active = selected?.kind === "deal" && selected.id === deal.id;
            return (
              <button
                key={deal.id}
                type="button"
                className="absolute z-20 -translate-x-1/2 -translate-y-1/2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-300"
                style={{ left: `${pos.xPct}%`, top: `${pos.yPct}%` }}
                onClick={(e) => {
                  e.stopPropagation();
                  setSelected({ kind: "deal", id: deal.id });
                }}
                aria-label={`${deal.title} deal pin`}
              >
                <span className="relative flex size-9 items-center justify-center">
                  <motion.span
                    className="absolute inset-0 rotate-45 rounded-sm bg-amber-400/20 blur-md"
                    animate={{ opacity: [0.35, 0.7, 0.35], scale: [0.9, 1.05, 0.9] }}
                    transition={{ duration: 2.2, repeat: Infinity, ease: "easeInOut" }}
                  />
                  <span
                    className={cn(
                      "relative size-3 rotate-45 rounded-sm ring-2 ring-black/70",
                      ringClass
                    )}
                  />
                  {active ? (
                    <span className="absolute -inset-1 rotate-45 rounded-md ring-2 ring-fuchsia-300/80" />
                  ) : null}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      <AnimatePresence>
        {(selectedEvent || selectedDeal) && (
          <motion.div
            initial={{ y: 120, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 120, opacity: 0 }}
            transition={{ type: "spring", stiffness: 380, damping: 34 }}
            className="fixed inset-x-0 bottom-0 z-[45] px-4 pb-[calc(5.75rem+env(safe-area-inset-bottom))] pt-2"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mx-auto max-w-lg overflow-hidden rounded-2xl border border-pu-border bg-gradient-to-br from-pu-surface via-pu-surface-deep to-black shadow-[0_-12px_40px_-20px_rgba(0,0,0,0.88)] ring-1 ring-pu-magenta/12">
              {selectedEvent ? (
                <div className="flex gap-3 p-3.5 sm:p-4">
                  <div className="relative size-20 shrink-0 overflow-hidden rounded-xl">
                    <Image
                      src={selectedEvent.imageUrl}
                      alt=""
                      fill
                      className="object-cover"
                      sizes="80px"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
                  </div>
                  <div className="min-w-0 flex-1 space-y-1.5">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="rounded-md border border-white/15 bg-black/50 px-2 py-0.5 text-[10px] font-black uppercase tracking-wide text-white/90">
                        {selectedEvent.categoryLabel}
                      </span>
                      {selectedEvent.liveNow ? (
                        <span className="text-[10px] font-black uppercase tracking-wide text-pu-live">
                          Live
                        </span>
                      ) : null}
                    </div>
                    <p className="font-heading text-lg font-black leading-tight tracking-tight text-white">
                      {selectedEvent.title}
                    </p>
                    <p className="flex items-center gap-1 text-[12px] font-semibold text-white/65">
                      <MapPin className="size-3.5 shrink-0 text-pu-magenta" aria-hidden />
                      {selectedEvent.area}
                    </p>
                    <p className="text-[11px] font-semibold tabular-nums text-white/45">
                      {formatEventTimeRange(selectedEvent.startsAt, selectedEvent.endsAt)}
                    </p>
                    <p className="text-[11px] font-bold text-amber-200/90">
                      {crowdLabel(selectedEvent.crowdStatus)} ·{" "}
                      {selectedEvent.urgencyLabels[0] ?? "Tonight"}
                    </p>
                  </div>
                  <div className="flex shrink-0 flex-col gap-2">
                    <FollowVenueButton
                      venueId={selectedEvent.venueId}
                      variant="compact"
                      className="w-full border-white/15"
                    />
                    <Button
                      type="button"
                      size="icon-sm"
                      variant="outline"
                      aria-pressed={savedEventIds.includes(selectedEvent.id)}
                      aria-label="Save event"
                      className={cn(
                        "border-white/15",
                        savedEventIds.includes(selectedEvent.id) &&
                          "border-pu-magenta/55 bg-pu-magenta-dim/30 text-white"
                      )}
                      onClick={() => toggleSaveEvent(selectedEvent.id)}
                    >
                      <Bookmark
                        className={cn(
                          "size-4",
                          savedEventIds.includes(selectedEvent.id)
                            ? "fill-pu-magenta text-pu-magenta"
                            : "text-white/80"
                        )}
                      />
                    </Button>
                  </div>
                </div>
              ) : selectedDeal ? (
                <div className="flex gap-3 p-3.5 sm:p-4">
                  <div className="relative size-20 shrink-0 overflow-hidden rounded-xl">
                    <Image
                      src={selectedDeal.imageUrl}
                      alt=""
                      fill
                      className="object-cover"
                      sizes="80px"
                    />
                  </div>
                  <div className="min-w-0 flex-1 space-y-1.5">
                    <span className="inline-block rounded-md border border-amber-400/35 bg-amber-500/10 px-2 py-0.5 text-[10px] font-black uppercase tracking-wide text-amber-100">
                      {selectedDeal.categoryLabel}
                    </span>
                    <p className="font-heading text-lg font-black leading-tight tracking-tight text-white">
                      {selectedDeal.title}
                    </p>
                    <p className="flex items-center gap-1 text-[12px] font-semibold text-white/65">
                      <MapPin className="size-3.5 shrink-0 text-pu-magenta" aria-hidden />
                      {selectedDeal.area}
                    </p>
                    <p className="text-[11px] font-semibold text-white/45">
                      {selectedDeal.windowLabel}
                    </p>
                    <p className="text-[11px] font-bold text-fuchsia-300/95">
                      {selectedDeal.urgencyLabel}
                    </p>
                  </div>
                  <div className="flex shrink-0 flex-col gap-2">
                    <FollowVenueButton
                      venueId={selectedDeal.venueId}
                      variant="compact"
                      className="w-full border-white/15"
                    />
                    <Button
                      type="button"
                      size="icon-sm"
                      variant="outline"
                      aria-pressed={savedDealIds.includes(selectedDeal.id)}
                      aria-label="Save deal"
                      className={cn(
                        "border-white/15",
                        savedDealIds.includes(selectedDeal.id) &&
                          "border-pu-magenta/55 bg-pu-magenta-dim/30 text-white"
                      )}
                      onClick={() => toggleSaveDeal(selectedDeal.id)}
                    >
                      <Bookmark
                        className={cn(
                          "size-4",
                          savedDealIds.includes(selectedDeal.id)
                            ? "fill-pu-magenta text-pu-magenta"
                            : "text-white/80"
                        )}
                      />
                    </Button>
                  </div>
                </div>
              ) : null}

              <div className="flex gap-2 border-t border-white/10 px-3.5 py-3 sm:px-4">
                {selectedEvent ? (
                  <Button
                    asChild
                    className="h-11 flex-1 rounded-xl border-0 bg-gradient-to-r from-pu-magenta to-pu-amber font-black uppercase tracking-[0.08em] text-white shadow-[0_0_22px_-8px_oklch(0.7_0.29_328/0.45)]"
                  >
                    <Link href={`/event/${selectedEvent.id}`}>
                      <Sparkles className="mr-2 inline size-4 align-middle" aria-hidden />
                      View move
                    </Link>
                  </Button>
                ) : selectedDeal ? (
                  <Button
                    asChild
                    className="h-11 flex-1 rounded-xl border-0 bg-gradient-to-r from-pu-magenta to-pu-amber font-black uppercase tracking-[0.08em] text-white shadow-[0_0_22px_-8px_oklch(0.7_0.29_328/0.45)]"
                  >
                    <Link href="/deals">Pull Up</Link>
                  </Button>
                ) : null}
                <Button
                  type="button"
                  variant="outline"
                  className="h-11 shrink-0 border-white/15 px-4 font-bold text-white/80"
                  onClick={() => setSelected(null)}
                >
                  Close
                </Button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
