import { desc, eq } from "drizzle-orm";
import { getDb } from "../../../db";
import { events, eventScores, hostOrganizations, venues } from "../../../db/schema";
import { createId, jsonError, nowIso, requireApiProfile, routeError } from "../_lib";

export async function GET() {
  try {
    const db = getDb();
    const rows = await db
      .select({
        event: events,
        venue: venues,
        host: hostOrganizations,
        score: eventScores,
      })
      .from(events)
      .innerJoin(venues, eq(events.venueId, venues.id))
      .innerJoin(hostOrganizations, eq(events.hostOrganizationId, hostOrganizations.id))
      .leftJoin(eventScores, eq(events.id, eventScores.eventId))
      .orderBy(desc(events.startsAt))
      .limit(50);

    return Response.json({ events: rows });
  } catch (error) {
    return routeError(error);
  }
}

export async function POST(request: Request) {
  try {
    const result = await requireApiProfile();
    if ("error" in result) return result.error;

    const payload = (await request.json()) as {
      campusId?: string;
      venueId?: string;
      hostOrganizationId?: string;
      title?: string;
      description?: string;
      startsAt?: string;
      endsAt?: string;
      cover?: string;
      ageRule?: string;
      capacityEstimate?: number;
      inviteMode?: "open" | "invite_link" | "friends_of_friends";
    };

    if (!payload.venueId || !payload.hostOrganizationId || !payload.title) {
      return jsonError("venueId, hostOrganizationId, and title are required");
    }
    if (!payload.startsAt || !payload.endsAt) {
      return jsonError("startsAt and endsAt are required");
    }

    const [event] = await getDb()
      .insert(events)
      .values({
        id: createId("evt"),
        campusId: payload.campusId ?? result.profile.campusId ?? "uiuc",
        venueId: payload.venueId,
        hostOrganizationId: payload.hostOrganizationId,
        title: payload.title.trim(),
        description: payload.description?.trim() ?? "",
        startsAt: payload.startsAt,
        endsAt: payload.endsAt,
        status: "submitted",
        cover: payload.cover?.trim() ?? "Unknown",
        ageRule: payload.ageRule?.trim() ?? "Unknown",
        capacityEstimate: payload.capacityEstimate,
        inviteMode: payload.inviteMode ?? "open",
        createdByProfileId: result.profile.id,
        updatedAt: nowIso(),
      })
      .returning();

    return Response.json({ event }, { status: 201 });
  } catch (error) {
    return routeError(error);
  }
}
