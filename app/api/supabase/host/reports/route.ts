import { jsonError, requireProfile, routeError, supabaseRest } from "../../../_supabase";

export async function POST(request: Request) {
  try {
    const { user } = await requireProfile(request, ["host", "admin"]);
    const payload = (await request.json()) as {
      eventId?: string;
      lineState?: "quiet" | "moving" | "building" | "at_capacity";
      capacityPressure?: number;
      note?: string;
    };
    if (!payload.eventId || !payload.lineState || payload.capacityPressure == null) {
      return jsonError("eventId, lineState, and capacityPressure are required");
    }

    const [report] = await supabaseRest("host_reports", {
      method: "POST",
      body: JSON.stringify({
        event_id: payload.eventId,
        submitted_by_user_id: user.id,
        line_state: payload.lineState,
        capacity_pressure: Math.max(0, Math.min(100, payload.capacityPressure)),
        note: payload.note ?? "",
      }),
    });

    return Response.json({ report }, { status: 201 });
  } catch (error) {
    return routeError(error);
  }
}
