import { jsonError, requireProfile, routeError, supabaseRest } from "../../../_supabase";

export async function GET(request: Request) {
  try {
    const { user } = await requireProfile(request, ["host", "admin"]);
    const rows = await supabaseRest(
      `host_organizations?or=(owner_user_id.eq.${user.id})&select=*,organization_members(*)`,
    );
    return Response.json({ organizations: rows });
  } catch (error) {
    return routeError(error);
  }
}

export async function POST(request: Request) {
  try {
    const { profile, user } = await requireProfile(request, ["host", "admin"]);
    const payload = (await request.json()) as {
      name?: string;
      kind?: "frat" | "bar" | "pub" | "club" | "student_org" | "house";
    };
    if (!payload.name || !payload.kind) return jsonError("name and kind are required");

    const [organization] = await supabaseRest("host_organizations", {
      method: "POST",
      body: JSON.stringify({
        owner_user_id: user.id,
        campus_id: profile.campus_id,
        name: payload.name.trim(),
        kind: payload.kind,
        verification_status: profile.account_type === "admin" ? "verified" : "pending",
      }),
    });

    return Response.json({ organization }, { status: 201 });
  } catch (error) {
    return routeError(error);
  }
}
