import type { PuEvent } from "@/lib/types";
import {
  formatCurrencyFromCents,
  formatEntryKind,
  formatEventTimeRange,
} from "@/lib/event-utils";

function normalizeQuery(raw: string): string {
  return raw.trim().toLowerCase();
}

/** All text we match against (deterministic; no randomness). */
export function buildEventSearchHaystack(event: PuEvent): string {
  const timeRange = formatEventTimeRange(event.startsAt, event.endsAt);
  const coverText =
    event.coverCents === null ? "free" : formatCurrencyFromCents(event.coverCents);

  return [
    event.title,
    event.categoryLabel,
    event.category,
    event.area,
    event.venueName,
    event.hostLabel,
    event.vibeMusic,
    event.description,
    formatEntryKind(event.entryType),
    event.entryType,
    event.ageRestriction,
    event.stagRule,
    event.startsAt,
    event.endsAt,
    timeRange,
    coverText,
    ...event.urgencyLabels,
  ]
    .join(" ")
    .toLowerCase();
}

export function eventMatchesSearch(event: PuEvent, rawQuery: string): boolean {
  const q = normalizeQuery(rawQuery);
  if (!q) return true;
  return buildEventSearchHaystack(event).includes(q);
}

export function filterEventsBySearch(
  events: PuEvent[],
  rawQuery: string
): PuEvent[] {
  const q = normalizeQuery(rawQuery);
  if (!q) return events;
  return events.filter((e) => eventMatchesSearch(e, rawQuery));
}
