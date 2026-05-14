import type { CrowdStatus, PuEvent } from "@/lib/types";

/** Narrative crowd momentum derived from engagement (not venue capacity truth). */
export type CrowdMomentumLabel =
  | "Building"
  | "Active"
  | "Packed"
  | "Exploding"
  | "Cooling down";

export function engagementVelocity(event: PuEvent, nowMs: number): number {
  const updated = Date.parse(event.updatedAt ?? "");
  const hoursSinceTouch = Number.isFinite(updated)
    ? Math.max(0, (nowMs - updated) / 3_600_000)
    : 2;
  const rsvp = event.rsvpsCount ?? 0;
  const base =
    event.savesCount * 1.1 +
    rsvp * 1.45 +
    event.pullUpsLastHour * 1.25 +
    event.spottingCount * 0.04 +
    event.heatScore * 0.08;
  return base / (1 + hoursSinceTouch * 0.42);
}

function endsWithinHours(event: PuEvent, nowMs: number, hours: number): boolean {
  const end = new Date(event.endsAt).getTime();
  return end > nowMs && end <= nowMs + hours * 3_600_000;
}

export function crowdMomentumFromEvent(event: PuEvent, nowMs = Date.now()): CrowdMomentumLabel {
  const v = engagementVelocity(event, nowMs);
  const live = event.liveNow;
  const endingSoon = endsWithinHours(event, nowMs, 2);
  const cooling = endingSoon && v < 18 && !live;

  if (cooling) return "Cooling down";
  if (live && v > 55) return "Exploding";
  if (v > 48 || event.crowdStatus === "line_forming") return "Packed";
  if (v > 28 || event.crowdStatus === "active" || event.crowdStatus === "packed") return "Active";
  if (v > 14 || event.crowdStatus === "warming_up") return "Building";
  return "Active";
}

/** Map momentum to the existing bar visualization bucket. */
export function crowdStatusForMomentum(
  momentum: CrowdMomentumLabel,
  fallback: CrowdStatus
): CrowdStatus {
  switch (momentum) {
    case "Exploding":
    case "Packed":
      return "packed";
    case "Active":
      return "active";
    case "Building":
      return "warming_up";
    case "Cooling down":
      return "chill";
    default:
      return fallback;
  }
}
