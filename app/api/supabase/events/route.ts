import { jsonError, requireProfile, routeError, supabaseRest } from "../../_supabase";

export async function GET(request: Request) {
  try {
    await requireProfile(request);
    const rows = await supabaseRest(
      "events?select=*,venues(*),host_organizations(*),event_scores(*)&order=starts_at.desc&limit=50",
    );
    return Response.json({ events: rows });
  } catch (error) {
    return routeError(error);
  }
}

export async function POST(request: Request) {
  try {
    const { profile, user } = await requireProfile(request);
    const payload = (await request.json()) as {
      title?: string;
      venueId?: string;
      hostOrganizationId?: string | null;
      description?: string;
      startsAt?: string;
      endsAt?: string;
      eventType?: "official" | "unofficial_party";
      cover?: string;
      ageRule?: string;
      inviteMode?: "open" | "invite_link" | "friends_of_friends";
    };

    if (!payload.title || !payload.startsAt || !payload.endsAt) {
      return jsonError("title, startsAt, and endsAt are required");
    }

    const eventType = payload.eventType ?? (payload.hostOrganizationId ? "official" : "unofficial_party");
    const canCreateOfficial = profile.account_type === "host" || profile.account_type === "admin";
    const canCreateUnofficial = profile.account_type === "admin" || profile.can_host_unofficial;

    if (eventType === "official" && !canCreateOfficial) {
      return jsonError("Only host or admin accounts can create official host events.", 403);
    }
    if (eventType === "official" && !payload.hostOrganizationId) {
      return jsonError("Official host events require a hostOrganizationId.", 400);
    }
    if (
      eventType === "official" &&
      profile.account_type !== "admin" &&
      !(await isOrganizationMember(payload.hostOrganizationId, user.id))
    ) {
      return jsonError("Host account cannot create events for this organization.", 403);
    }
    if (eventType === "unofficial_party" && !canCreateUnofficial) {
      return jsonError("Student profile is not enabled to host unofficial parties.", 403);
    }

    const [event] = await supabaseRest("events", {
      method: "POST",
      body: JSON.stringify({
        campus_id: profile.campus_id,
        venue_id: payload.venueId ?? null,
        host_organization_id: payload.hostOrganizationId ?? null,
        created_by_user_id: user.id,
        title: payload.title.trim(),
        description: payload.description?.trim() ?? "",
        starts_at: payload.startsAt,
        ends_at: payload.endsAt,
        status: "submitted",
        event_type: eventType,
        cover: payload.cover ?? "Unknown",
        age_rule: payload.ageRule ?? "Unknown",
        invite_mode: payload.inviteMode ?? "open",
      }),
    });

    return Response.json({ event }, { status: 201 });
  } catch (error) {
    return routeError(error);
  }
}

async function isOrganizationMember(organizationId: string | null | undefined, userId: string) {
  if (!organizationId) return false;
  const rows = await supabaseRest<{ id: string }[]>(
    `organization_members?organization_id=eq.${encodeURIComponent(organizationId)}&user_id=eq.${encodeURIComponent(userId)}&select=id&limit=1`,
  );
  return rows.length > 0;
}
