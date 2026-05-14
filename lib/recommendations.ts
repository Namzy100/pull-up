import type { PuEvent, PuInterestId } from "@/lib/types";

export type InterestOption = {
  id: PuInterestId;
  label: string;
  reasonLabel: string;
};

export const INTEREST_OPTIONS: readonly InterestOption[] = [
  { id: "frat_party", label: "Parties", reasonLabel: "parties" },
  { id: "food_deal", label: "Food", reasonLabel: "food" },
  { id: "watch_party", label: "Sports", reasonLabel: "sports nights" },
  { id: "live_music", label: "Music", reasonLabel: "music vibes" },
  { id: "bar_club", label: "Clubs/Bars", reasonLabel: "clubs and bars" },
  { id: "student_org", label: "Student Orgs", reasonLabel: "student org events" },
  { id: "pop_up", label: "Free Stuff", reasonLabel: "free pop-ups" },
  { id: "deals", label: "Deals", reasonLabel: "deals" },
  { id: "campus", label: "Campus Events", reasonLabel: "campus events" },
] as const;

export type RecommendedEvent = {
  event: PuEvent;
  score: number;
  reasons: string[];
};

const INTEREST_REASON = new Map(INTEREST_OPTIONS.map((i) => [i.id, i.reasonLabel]));

export function eventMatchesInterest(event: PuEvent, interest: PuInterestId): boolean {
  switch (interest) {
    case "frat_party":
      return event.category === "frat_party";
    case "food_deal":
      return event.category === "food_deal";
    case "watch_party":
      return event.category === "watch_party";
    case "live_music":
      return event.category === "concert" || /dj|music|house|techno|jazz/i.test(event.vibeMusic);
    case "bar_club":
      return event.category === "bar_club";
    case "student_org":
      return event.category === "student_org";
    case "pop_up":
      return event.category === "pop_up" || /free/i.test(event.urgencyLabels.join(" "));
    case "deals":
      return event.category === "food_deal" || /free|deal|cover/i.test(event.urgencyLabels.join(" "));
    case "campus":
      return event.category === "campus";
    case "concert":
    case "other":
      return event.category === interest;
  }
}

export function scoreEventForUser(
  event: PuEvent,
  interests: PuInterestId[],
  opts?: {
    followedVenueIds?: string[];
    savedEventIds?: string[];
  }
): RecommendedEvent {
  let score = event.heatScore * 0.7;
  const reasons: string[] = [];

  const matchedInterests = interests.filter((interest) =>
    eventMatchesInterest(event, interest)
  );
  if (matchedInterests.length > 0) {
    score += 22 + matchedInterests.length * 8;
    const label = INTEREST_REASON.get(matchedInterests[0]);
    if (label) reasons.push(`Because you like ${label}`);
  }

  if (opts?.followedVenueIds?.includes(event.venueId)) {
    score += 20;
    reasons.push("Followed venue is heating up");
  }

  if (opts?.savedEventIds?.includes(event.id)) {
    score += 6;
    reasons.push("You already saved this");
  }

  if (event.savesCount >= 18 && matchedInterests.length > 0) {
    reasons.push("Students like you saved this");
  }

  if (event.savesCount >= 30 && matchedInterests.length === 0) {
    reasons.push("Popular among campus tonight");
  }

  score += Math.min(22, event.savesCount / 180);
  score += Math.min(20, event.pullUpsLastHour / 6.5);
  score += Math.min(18, event.spottingCount / 420);

  if (event.liveNow) {
    score += 22;
    reasons.push("Live right now");
  }

  if (event.area.toLowerCase().includes("green st")) {
    score += 8;
    reasons.push("Trending near Green St");
  }

  if (event.crowdStatus === "packed" || event.crowdStatus === "line_forming") {
    score += 8;
    reasons.push("Popular with nightlife crowd");
  }

  if (event.urgencyLabels.some((l) => /ending|soon|line|packed|trending/i.test(l))) {
    score += 6;
  }

  return {
    event,
    score,
    reasons: Array.from(new Set(reasons)).slice(0, 2),
  };
}

export function getRecommendedEvents(
  events: PuEvent[],
  interests: PuInterestId[],
  limit = 4,
  opts?: { followedVenueIds?: string[]; savedEventIds?: string[] }
): RecommendedEvent[] {
  return events
    .map((event) => scoreEventForUser(event, interests, opts))
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);
}

export function filterEventsByInterests(
  events: PuEvent[],
  interests: PuInterestId[]
): PuEvent[] {
  if (interests.length === 0) return events;
  return events.filter((event) =>
    interests.some((interest) => eventMatchesInterest(event, interest))
  );
}
