import { jsonError, requireProfile, routeError, supabaseRest } from "../../../_supabase";

type HostReportRow = {
  id: string;
  event_id: string;
  submitted_by_user_id: string;
  line_state: string;
  capacity_pressure: number;
  note: string;
};

export async function POST(request: Request) {
  try {
    const { profile, user } = await requireProfile(request, ["host", "admin"]);
    const payload = (await request.json()) as {
      eventId?: string;
      lineState?: "quiet" | "moving" | "building" | "at_capacity";
      capacityPressure?: number;
      note?: string;
    };
    if (!payload.eventId || !payload.lineState || payload.capacityPressure == null) {
      return jsonError("eventId, lineState, and capacityPressure are required");
    }

    if (profile.account_type !== "admin" && !(await canReportForEvent(payload.eventId, user.id))) {
      return jsonError("Host account cannot report for this event.", 403);
    }

    const [report] = await supabaseRest<HostReportRow[]>("host_reports", {
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

async function canReportForEvent(eventId: string, userId: string) {
  const events = await supabaseRest<Array<{ host_organization_id: string | null }>>(
    `events?id=eq.${encodeURIComponent(eventId)}&select=host_organization_id&limit=1`,
  );
  const organizationId = events[0]?.host_organization_id;
  if (!organizationId) return false;

  const memberships = await supabaseRest<{ id: string }[]>(
    `organization_members?organization_id=eq.${encodeURIComponent(organizationId)}&user_id=eq.${encodeURIComponent(userId)}&select=id&limit=1`,
  );
  return memberships.length > 0;
}
