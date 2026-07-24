import { getDb } from "../../../db";
import { hostReports, signalEvents } from "../../../db/schema";
import { createId, jsonError, requireApiProfile, routeError } from "../_lib";

export async function POST(request: Request) {
  try {
    const result = await requireApiProfile();
    if ("error" in result) return result.error;

    const payload = (await request.json()) as {
      eventId?: string;
      lineState?: "quiet" | "moving" | "building" | "at_capacity";
      capacityPressure?: number;
      note?: string;
    };
    if (!payload.eventId || !payload.lineState || payload.capacityPressure == null) {
      return jsonError("eventId, lineState, and capacityPressure are required");
    }

    const db = getDb();
    const [report] = await db
      .insert(hostReports)
      .values({
        id: createId("hrp"),
        eventId: payload.eventId,
        submittedByProfileId: result.profile.id,
        lineState: payload.lineState,
        capacityPressure: Math.max(0, Math.min(100, payload.capacityPressure)),
        note: payload.note?.trim() ?? "",
      })
      .returning();

    await db.insert(signalEvents).values({
      id: createId("sig"),
      eventId: payload.eventId,
      profileId: result.profile.id,
      source: "host_report",
      weight: 0.62,
      verificationLevel: 0.58,
      trustScore: 0.64,
      expiresAt: new Date(Date.now() + 1000 * 60 * 45).toISOString(),
      metadataJson: JSON.stringify({ reportId: report.id, lineState: report.lineState }),
    });

    return Response.json({ report }, { status: 201 });
  } catch (error) {
    return routeError(error);
  }
}
