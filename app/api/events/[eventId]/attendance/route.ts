import { and, eq } from "drizzle-orm";
import { getDb } from "../../../../../db";
import { attendances, signalEvents } from "../../../../../db/schema";
import { createId, nowIso, requireApiProfile, routeError } from "../../../_lib";

export async function POST(
  request: Request,
  context: { params: Promise<{ eventId: string }> },
) {
  try {
    const result = await requireApiProfile();
    if ("error" in result) return result.error;

    const { eventId } = await context.params;
    const payload = (await request.json()) as {
      status?: "interested" | "going" | "arrived" | "left" | "not_going";
      visibility?: "private" | "friends" | "host_aggregate";
    };
    const status = payload.status ?? "interested";
    const db = getDb();

    const existing = await db
      .select()
      .from(attendances)
      .where(and(eq(attendances.eventId, eventId), eq(attendances.profileId, result.profile.id)))
      .limit(1);

    const attendance = existing[0]
      ? (
          await db
            .update(attendances)
            .set({ status, visibility: payload.visibility ?? existing[0].visibility, updatedAt: nowIso() })
            .where(eq(attendances.id, existing[0].id))
            .returning()
        )[0]
      : (
          await db
            .insert(attendances)
            .values({
              id: createId("att"),
              eventId,
              profileId: result.profile.id,
              status,
              visibility: payload.visibility ?? "friends",
              updatedAt: nowIso(),
            })
            .returning()
        )[0];

    await db.insert(signalEvents).values({
      id: createId("sig"),
      eventId,
      profileId: result.profile.id,
      source: status === "arrived" ? "checkin" : "attendance",
      weight: status === "arrived" ? 1 : status === "going" ? 0.72 : 0.35,
      verificationLevel: status === "arrived" ? 0.9 : 0.45,
      trustScore: 0.7,
      expiresAt: new Date(Date.now() + 1000 * 60 * 90).toISOString(),
      metadataJson: JSON.stringify({ attendanceId: attendance.id, status }),
    });

    return Response.json({ attendance });
  } catch (error) {
    return routeError(error);
  }
}
