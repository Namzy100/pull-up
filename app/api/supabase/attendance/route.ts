import { jsonError, requireProfile, routeError, supabaseRest } from "../../_supabase";

export async function POST(request: Request) {
  try {
    const { user } = await requireProfile(request, ["student", "admin"]);
    const payload = (await request.json()) as {
      eventId?: string;
      status?: "interested" | "going" | "arrived" | "left" | "not_going";
      visibility?: "private" | "friends" | "host_aggregate";
    };
    if (!payload.eventId) return jsonError("eventId is required");

    const [attendance] = await supabaseRest("attendances?on_conflict=event_id,user_id", {
      method: "POST",
      headers: { prefer: "resolution=merge-duplicates,return=representation" },
      body: JSON.stringify({
        event_id: payload.eventId,
        user_id: user.id,
        status: payload.status ?? "interested",
        visibility: payload.visibility ?? "friends",
      }),
    });

    await supabaseRest("signal_events", {
      method: "POST",
      body: JSON.stringify({
        event_id: payload.eventId,
        user_id: user.id,
        source: payload.status === "arrived" ? "checkin" : "attendance",
        weight: payload.status === "arrived" ? 1 : 0.65,
        verification_level: payload.status === "arrived" ? 0.9 : 0.45,
        trust_score: 0.7,
        expires_at: new Date(Date.now() + 1000 * 60 * 90).toISOString(),
        metadata: { attendance_id: attendance.id, status: payload.status ?? "interested" },
      }),
    });

    return Response.json({ attendance });
  } catch (error) {
    return routeError(error);
  }
}
