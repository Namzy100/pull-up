import { jsonError, requireProfile, routeError, supabaseRest } from "../../_supabase";

export async function GET(request: Request) {
  try {
    const { user } = await requireProfile(request, ["student", "admin"]);
    const memberships = await supabaseRest<Array<{ plan_id: string }>>(
      `plan_members?user_id=eq.${encodeURIComponent(user.id)}&select=plan_id`,
    );
    const ids = memberships.map((row) => row.plan_id);
    if (!ids.length) return Response.json({ plans: [] });
    const plans = await supabaseRest(
      `plans?id=in.(${ids.map(encodeURIComponent).join(",")})&select=*,events(*,venues(*)),plan_members(*)&order=created_at.desc`,
    );
    return Response.json({ plans });
  } catch (error) {
    return routeError(error);
  }
}

export async function POST(request: Request) {
  try {
    const { profile, user } = await requireProfile(request, ["student", "admin"]);
    const payload = (await request.json()) as {
      eventId?: string;
      title?: string;
      arrivalWindowStart?: string;
      arrivalWindowEnd?: string;
      crewId?: string | null;
      note?: string;
    };
    if (!payload.eventId || !payload.title?.trim()) {
      return jsonError("eventId and title are required");
    }
    const [plan] = await supabaseRest<Array<{ id: string }>>("plans", {
      method: "POST",
      body: JSON.stringify({
        event_id: payload.eventId,
        crew_id: payload.crewId ?? null,
        created_by_user_id: user.id,
        title: payload.title.trim(),
        arrival_window_start: payload.arrivalWindowStart ?? null,
        arrival_window_end: payload.arrivalWindowEnd ?? null,
        note: payload.note?.trim() ?? "",
      }),
    });
    await supabaseRest("plan_members", {
      method: "POST",
      body: JSON.stringify({ plan_id: plan.id, user_id: user.id, response: "going" }),
    });
    await supabaseRest("attendances?on_conflict=event_id,user_id", {
      method: "POST",
      headers: { prefer: "resolution=merge-duplicates,return=representation" },
      body: JSON.stringify({
        event_id: payload.eventId,
        user_id: user.id,
        status: "going",
        visibility: "friends",
      }),
    });
    return Response.json({ plan, campusId: profile.campus_id }, { status: 201 });
  } catch (error) {
    return routeError(error);
  }
}
