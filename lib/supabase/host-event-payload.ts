import type { EntryType, EventCategory } from "@/lib/types";

/** Shape stored in host_submissions.event_payload (portal pending + form fields). */
export type HostEventPayloadJson = {
  id?: string;
  title?: string;
  category?: string;
  categoryLabel?: string;
  date?: string;
  startTime?: string;
  endTime?: string;
  area?: string;
  venue?: string;
  coverDollars?: number | null;
  entryType?: string;
  stagRule?: string;
  ageRestriction?: string;
  vibeMusic?: string;
  description?: string;
  imageUrl?: string;
  externalUrl?: string;
};

const EVENT_CATEGORIES: readonly EventCategory[] = [
  "frat_party",
  "bar_club",
  "student_org",
  "food_deal",
  "campus",
  "concert",
  "watch_party",
  "pop_up",
  "other",
] as const;

const ENTRY_TYPES: readonly EntryType[] = ["free", "cover", "rsvp"] as const;

function isEventCategory(v: string): v is EventCategory {
  return (EVENT_CATEGORIES as readonly string[]).includes(v);
}

function isEntryType(v: string): v is EntryType {
  return (ENTRY_TYPES as readonly string[]).includes(v);
}

export function parseHostEventPayload(raw: unknown): HostEventPayloadJson | null {
  if (!raw || typeof raw !== "object") return null;
  return raw as HostEventPayloadJson;
}

export function coerceEventCategory(raw: string | undefined): EventCategory {
  if (raw && isEventCategory(raw)) return raw;
  return "other";
}

export function coerceEntryType(raw: string | undefined): EntryType {
  if (raw && isEntryType(raw)) return raw;
  return "free";
}

/** Combine local date (YYYY-MM-DD) and time (HH:mm or HH:mm:ss) into ISO UTC. */
export function isoFromDateAndTime(dateStr: string, timeStr: string): string {
  const t = timeStr.trim();
  const normalized = t.length === 5 ? `${t}:00` : t;
  const d = new Date(`${dateStr.trim()}T${normalized}`);
  if (Number.isNaN(d.getTime())) {
    throw new Error(`Invalid event date/time: ${dateStr} ${timeStr}`);
  }
  return d.toISOString();
}

export function computeEventPublicationStatus(
  startsAtIso: string,
  endsAtIso: string,
  nowMs: number = Date.now()
): { status: "approved" | "live" | "ended"; live_now: boolean } {
  const start = new Date(startsAtIso).getTime();
  const end = new Date(endsAtIso).getTime();
  if (nowMs > end) return { status: "ended", live_now: false };
  if (nowMs >= start && nowMs <= end) return { status: "live", live_now: true };
  return { status: "approved", live_now: false };
}
