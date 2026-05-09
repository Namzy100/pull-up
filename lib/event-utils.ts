import type { CrowdStatus, EntryType } from "@/lib/types";

export function formatEntryKind(entry: EntryType): string {
  switch (entry) {
    case "free":
      return "Free entry";
    case "cover":
      return "Cover";
    case "rsvp":
      return "RSVP requested";
  }
}

/** Compact counts for social proof (e.g. 1.2k). */
export function formatCompactCount(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}m`;
  if (n >= 10_000) return `${Math.round(n / 1000)}k`;
  if (n >= 1000) return `${(n / 1000).toFixed(1)}k`;
  return String(Math.round(n));
}

export function formatCurrencyFromCents(cents: number | null): string {
  if (cents === null || cents === 0) return "Free";
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(cents / 100);
}

/** America/Chicago wall clock parts — from formatToParts only (stable across runtimes). */
const CHICAGO_TZ = "America/Chicago";

const MONTH_SHORT = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
] as const;

type ChicagoWallParts = {
  year: number;
  month: number;
  day: number;
  hour24: number;
  minute: number;
};

function getChicagoWallParts(iso: string): ChicagoWallParts {
  const instant = new Date(iso);
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: CHICAGO_TZ,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).formatToParts(instant);

  const read = (t: Intl.DateTimeFormatPart["type"]) =>
    Number(parts.find((p) => p.type === t)?.value);

  return {
    year: read("year"),
    month: read("month"),
    day: read("day"),
    hour24: read("hour"),
    minute: read("minute"),
  };
}

function wallCalendarKey(p: ChicagoWallParts): string {
  return `${p.year}-${String(p.month).padStart(2, "0")}-${String(p.day).padStart(2, "0")}`;
}

/** Fixed 12h clock, no Intl string composition (SSR/CSR-safe). */
function format12hFrom24(hour24: number, minute: number): string {
  const suffix = hour24 >= 12 ? "PM" : "AM";
  const h12 = hour24 % 12 || 12;
  const mm = minute.toString().padStart(2, "0");
  return `${h12}:${mm} ${suffix}`;
}

function formatCalendarDay(p: ChicagoWallParts): string {
  const mon = MONTH_SHORT[p.month - 1] ?? "?";
  return `${mon} ${p.day}`;
}

/** Single stable pattern: "May 8 · 9:30 PM – 2:00 AM" or cross-day with arrow. */
export function formatEventTimeRange(startsAt: string, endsAt: string): string {
  const a = getChicagoWallParts(startsAt);
  const b = getChicagoWallParts(endsAt);
  const dayA = formatCalendarDay(a);
  const dayB = formatCalendarDay(b);
  const tA = format12hFrom24(a.hour24, a.minute);
  const tB = format12hFrom24(b.hour24, b.minute);

  if (wallCalendarKey(a) === wallCalendarKey(b)) {
    return `${dayA} · ${tA} – ${tB}`;
  }
  return `${dayA} · ${tA} → ${dayB} · ${tB}`;
}

export function crowdLabel(status: CrowdStatus): string {
  switch (status) {
    case "packed":
      return "Packed";
    case "line_forming":
      return "Line forming";
    case "active":
      return "Buzzing";
    case "warming_up":
      return "Warming up";
    case "chill":
      return "Chill";
  }
}

export function crowdTone(status: CrowdStatus): string {
  switch (status) {
    case "packed":
    case "line_forming":
      return "text-pu-magenta";
    case "active":
      return "text-pu-amber";
    case "warming_up":
      return "text-pu-amber-dim";
    case "chill":
      return "text-pu-live-dim";
  }
}

export function crowdBarIntensity(status: CrowdStatus): number {
  switch (status) {
    case "packed":
      return 1;
    case "line_forming":
      return 0.92;
    case "active":
      return 0.75;
    case "warming_up":
      return 0.5;
    case "chill":
      return 0.35;
  }
}
