import { jsonError, requireProfile, routeError, supabaseRest } from "../../_supabase";

export async function POST(request: Request) {
  try {
    const { user } = await requireProfile(request, ["student", "admin"]);
    const payload = (await request.json()) as {
      eventId?: string;
      lineState?: "none" | "short" | "moderate" | "long" | "at_capacity";
      crowdState?: "quiet" | "filling" | "busy" | "packed";
      cover?: string;
      note?: string;
    };
    if (!payload.eventId) return jsonError("eventId is required");
    const [report] = await supabaseRest<Array<{ id: string }>>("crowd_reports", {
      method: "POST",
      body: JSON.stringify({
        event_id: payload.eventId,
        submitted_by_user_id: user.id,
        line_state: payload.lineState ?? null,
        crowd_state: payload.crowdState ?? null,
        cover: payload.cover?.trim() ?? null,
        note: payload.note?.trim() ?? "",
        verification_method: "self_report",
      }),
    });
    await supabaseRest("signal_events", {
      method: "POST",
      body: JSON.stringify({
        event_id: payload.eventId,
        user_id: user.id,
        source: "checkin",
        weight: 0.75,
        verification_level: 0.6,
        trust_score: 0.7,
        expires_at: new Date(Date.now() + 1000 * 60 * 60).toISOString(),
        metadata: { crowd_report_id: report.id },
      }),
    });
    return Response.json({ report }, { status: 201 });
  } catch (error) {
    return routeError(error);
  }
}
