import type { PuDeal, PuEvent, PuInterestId } from "@/lib/types";
import { crowdMomentumFromEvent, engagementVelocity } from "@/lib/momentum";
import { eventMatchesInterest } from "@/lib/recommendations";

export type LiveFeedBuckets = {
  trendingTonight: PuEvent[];
  risingNearYou: PuEvent[];
  startingSoon: PuEvent[];
  packedRightNow: PuEvent[];
  dealsEndingSoon: PuDeal[];
  mostSavedTonight: PuEvent[];
  underrated: PuEvent[];
  newAndHeating: PuEvent[];
};

export type LiveFeedContext = {
  now?: number;
  /** Lowercased substrings of areas considered “near you” (from campus string, etc.). */
  userAreaHints?: string[];
  followedVenueIds?: string[];
  interests?: PuInterestId[];
};

export function computeEventTrendingScore(
  event: PuEvent,
  nowMs: number,
  ctx?: Pick<LiveFeedContext, "userAreaHints" | "followedVenueIds" | "interests">
): number {
  let score = engagementVelocity(event, nowMs) * 2.15;
  const start = new Date(event.startsAt).getTime();
  const hoursToStart = (start - nowMs) / 3_600_000;
  if (hoursToStart > 0 && hoursToStart < 3) score += 16;
  if (hoursToStart > -0.5 && hoursToStart <= 0.5) score += 20;
  if (event.liveNow) score += 24;

  const area = event.area.toLowerCase();
  if (ctx?.userAreaHints?.some((h) => h.trim() && area.includes(h.trim().toLowerCase()))) {
    score += 14;
  }
  if (ctx?.followedVenueIds?.includes(event.venueId)) score += 18;
  if (ctx?.interests?.some((i) => eventMatchesInterest(event, i))) score += 12;

  score += Math.log1p(event.savesCount + 1) * 5.5;
  score += Math.min(22, event.pullUpsLastHour * 0.38);
  score += Math.min(10, (event.rsvpsCount ?? 0) * 0.35);

  const ageHours = Math.max(0, (nowMs - start) / 3_600_000);
  score *= 1 / (1 + ageHours * 0.06);

  return score;
}

export function annotateTrendingScores(
  events: PuEvent[],
  ctx?: LiveFeedContext
): PuEvent[] {
  const nowMs = ctx?.now ?? Date.now();
  return events.map((e) => ({
    ...e,
    trendingScore: computeEventTrendingScore(e, nowMs, ctx),
  }));
}

function takeUnique(pool: PuEvent[], taken: Set<string>, limit: number): PuEvent[] {
  const out: PuEvent[] = [];
  for (const e of pool) {
    if (taken.has(e.id)) continue;
    taken.add(e.id);
    out.push(e);
    if (out.length >= limit) break;
  }
  return out;
}

function hoursUntil(iso: string, nowMs: number) {
  return (new Date(iso).getTime() - nowMs) / 3_600_000;
}

function dealEndsWithinHours(deal: PuDeal, nowMs: number, hours: number): boolean {
  const raw = deal.validUntil;
  if (!raw) return false;
  const end = new Date(raw).getTime();
  return end > nowMs && end <= nowMs + hours * 3_600_000;
}

export function buildLiveFeedBuckets(
  events: PuEvent[],
  deals: PuDeal[],
  ctx?: LiveFeedContext
): LiveFeedBuckets {
  const nowMs = ctx?.now ?? Date.now();
  const scored = annotateTrendingScores(events, ctx);
  const taken = new Set<string>();

  const trendingTonight = takeUnique(
    [...scored].sort((a, b) => (b.trendingScore ?? 0) - (a.trendingScore ?? 0)),
    taken,
    8
  );

  const risingPool =
    ctx?.userAreaHints && ctx.userAreaHints.length > 0
      ? [...scored].filter((e) => {
          const area = e.area.toLowerCase();
          return ctx.userAreaHints!.some((h) => h.trim() && area.includes(h.trim().toLowerCase()));
        })
      : [...scored];
  const risingSorted = [...risingPool].sort(
    (a, b) => engagementVelocity(b, nowMs) - engagementVelocity(a, nowMs)
  );
  const risingNearYou = takeUnique(
    risingSorted.filter((e) => engagementVelocity(e, nowMs) > 10),
    taken,
    6
  );

  const startingSoon = takeUnique(
    [...scored]
      .filter((e) => {
        const h = hoursUntil(e.startsAt, nowMs);
        return h > 0 && h < 4;
      })
      .sort((a, b) => new Date(a.startsAt).getTime() - new Date(b.startsAt).getTime()),
    taken,
    8
  );

  const packedRightNow = takeUnique(
    [...scored].filter((e) => {
      const m = e.momentumLabel ?? crowdMomentumFromEvent(e, nowMs);
      return (
        m === "Packed" ||
        m === "Exploding" ||
        e.crowdStatus === "packed" ||
        e.crowdStatus === "line_forming" ||
        (e.liveNow && engagementVelocity(e, nowMs) > 38)
      );
    }),
    taken,
    8
  );

  const newAndHeating = takeUnique(
    [...scored]
      .filter((e) => {
        const h = hoursUntil(e.startsAt, nowMs);
        return h > 0 && h < 24 && (e.trendingScore ?? 0) > 38;
      })
      .sort((a, b) => (b.trendingScore ?? 0) - (a.trendingScore ?? 0)),
    taken,
    6
  );

  const mostSavedTonight = takeUnique(
    [...scored].sort((a, b) => b.savesCount - a.savesCount),
    taken,
    8
  );

  const underrated = takeUnique(
    [...scored]
      .filter((e) => e.savesCount < 8 && engagementVelocity(e, nowMs) > 14)
      .sort((a, b) => engagementVelocity(b, nowMs) - engagementVelocity(a, nowMs)),
    taken,
    6
  );

  const dealsEndingSoon = [...deals]
    .filter((d) => dealEndsWithinHours(d, nowMs, 72))
    .sort((a, b) => {
      const ta = a.validUntil ? new Date(a.validUntil).getTime() : 0;
      const tb = b.validUntil ? new Date(b.validUntil).getTime() : 0;
      return ta - tb;
    })
    .slice(0, 8);

  return {
    trendingTonight,
    risingNearYou,
    startingSoon,
    packedRightNow,
    dealsEndingSoon,
    mostSavedTonight,
    underrated,
    newAndHeating,
  };
}
