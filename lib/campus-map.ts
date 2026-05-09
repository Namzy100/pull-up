import type { DealFilterId, PuDeal, PuEvent } from "@/lib/types";

export type CampusMapFilter =
  | "all"
  | "events"
  | "deals"
  | "parties"
  | "food"
  | "sports"
  | "music"
  | "bars";

export const MAP_FILTER_CHIPS: readonly { id: CampusMapFilter; label: string }[] =
  [
    { id: "all", label: "All" },
    { id: "events", label: "Events" },
    { id: "deals", label: "Deals" },
    { id: "parties", label: "Parties" },
    { id: "food", label: "Food" },
    { id: "sports", label: "Sports" },
    { id: "music", label: "Music" },
    { id: "bars", label: "Bars" },
  ] as const;

export type MapPinCoords = { xPct: number; yPct: number };

/** Mock layout: % of radar canvas (0–100). */
export const EVENT_MAP_POSITIONS: Record<string, MapPinCoords> = {
  "uiuc-001": { xPct: 30, yPct: 72 },
  "uiuc-002": { xPct: 44, yPct: 58 },
  "uiuc-003": { xPct: 20, yPct: 44 },
  "uiuc-004": { xPct: 14, yPct: 32 },
  "uiuc-005": { xPct: 78, yPct: 40 },
  "uiuc-006": { xPct: 52, yPct: 26 },
  "uiuc-007": { xPct: 24, yPct: 50 },
  "uiuc-008": { xPct: 38, yPct: 34 },
};

export const DEAL_MAP_POSITIONS: Record<string, MapPinCoords> = {
  "deal-uiuc-001": { xPct: 48, yPct: 64 },
  "deal-uiuc-002": { xPct: 82, yPct: 44 },
  "deal-uiuc-003": { xPct: 16, yPct: 52 },
  "deal-uiuc-004": { xPct: 58, yPct: 30 },
  "deal-uiuc-005": { xPct: 22, yPct: 58 },
  "deal-uiuc-006": { xPct: 50, yPct: 68 },
  "deal-uiuc-007": { xPct: 88, yPct: 24 },
  "deal-uiuc-008": { xPct: 12, yPct: 40 },
};

/** Zone labels on the mock map (percent positions). */
export const MAP_ZONE_LABELS: readonly {
  id: string;
  label: string;
  xPct: number;
  yPct: number;
}[] = [
  { id: "green", label: "Green St", xPct: 18, yPct: 42 },
  { id: "quad", label: "Main Quad", xPct: 48, yPct: 20 },
  { id: "dt", label: "Downtown Champaign", xPct: 78, yPct: 36 },
  { id: "frat", label: "Frat Park", xPct: 28, yPct: 76 },
  { id: "stadium", label: "Stadium", xPct: 86, yPct: 70 },
  { id: "campustown", label: "Campustown", xPct: 42, yPct: 56 },
] as const;

/** Hot zone ring centers (mock “live activity”). */
export const MAP_HOT_ZONES: readonly { xPct: number; yPct: number; radius: number }[] =
  [
    { xPct: 22, yPct: 46, radius: 22 },
    { xPct: 52, yPct: 28, radius: 18 },
    { xPct: 78, yPct: 42, radius: 20 },
  ];

const MUSIC_VIBE =
  /music|dj|house|techno|karaoke|jazz|hip-hop|anthem|melodic|country|club|nightlife|night\b/i;

export function eventMatchesMapFilter(
  event: PuEvent,
  filter: CampusMapFilter
): boolean {
  switch (filter) {
    case "all":
    case "events":
      return true;
    case "deals":
      return false;
    case "parties":
      return event.category === "frat_party";
    case "food":
      return event.category === "food_deal";
    case "sports":
      return event.category === "watch_party";
    case "music":
      return (
        event.category === "concert" ||
        MUSIC_VIBE.test(event.vibeMusic) ||
        MUSIC_VIBE.test(event.title)
      );
    case "bars":
      return event.category === "bar_club";
    default:
      return true;
  }
}

export function dealMatchesMapFilter(
  deal: PuDeal,
  filter: CampusMapFilter
): boolean {
  switch (filter) {
    case "all":
    case "deals":
      return true;
    case "events":
      return false;
    case "parties":
      return false;
    case "food":
      return deal.filterTags.includes("food" as DealFilterId);
    case "sports":
      return false;
    case "music":
      return (
        MUSIC_VIBE.test(deal.title) ||
        MUSIC_VIBE.test(deal.perk) ||
        MUSIC_VIBE.test(deal.categoryLabel) ||
        (deal.filterTags.includes("bars" as DealFilterId) &&
          deal.filterTags.includes("late_night" as DealFilterId))
      );
    case "bars":
      return deal.filterTags.includes("bars" as DealFilterId);
    default:
      return true;
  }
}

/** Pin color bucket for legend / styling. */
export function getEventPinVariant(
  event: PuEvent
): "party" | "food" | "bar" | "campus" | "sports" | "music" {
  if (event.category === "frat_party") return "party";
  if (event.category === "food_deal") return "food";
  if (event.category === "bar_club") return "bar";
  if (event.category === "watch_party") return "sports";
  if (event.category === "concert" || MUSIC_VIBE.test(event.vibeMusic))
    return "music";
  return "campus";
}

export function getDealPinVariant(deal: PuDeal): "food" | "bar" | "deal" {
  if (deal.filterTags.includes("food" as DealFilterId)) return "food";
  if (deal.filterTags.includes("bars" as DealFilterId)) return "bar";
  return "deal";
}
