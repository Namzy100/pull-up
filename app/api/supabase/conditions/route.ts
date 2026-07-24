import { jsonError, requireProfile, routeError, supabaseRest } from "../../_supabase";

export async function POST(request: Request) {
  try {
    const { user } = await requireProfile(request, ["student", "admin"]);
    const payload = (await request.json()) as {
      eventId?: string;
      lineState?: "quiet" | "moving" | "building" | "at_capacity";
      cover?: string;
      note?: string;
    };

    if (!payload.eventId || !payload.lineState) {
      return jsonError("eventId and lineState are required");
    }

    const [signal] = await supabaseRest("signal_events", {
      method: "POST",
      body: JSON.stringify({
        event_id: payload.eventId,
        user_id: user.id,
        source: "ambassador",
        weight: 0.72,
        verification_level: 0.65,
        trust_score: 0.72,
        expires_at: new Date(Date.now() + 1000 * 60 * 45).toISOString(),
        metadata: {
          line_state: payload.lineState,
          cover: payload.cover ?? null,
          note: payload.note?.trim() ?? "",
          privacy: "condition report does not expose precise location trails",
        },
      }),
    });

    return Response.json({ signal }, { status: 201 });
  } catch (error) {
    return routeError(error);
  }
}
