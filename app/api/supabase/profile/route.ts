import { jsonError, requireSupabaseUser, routeError, supabaseRest } from "../../_supabase";

export async function GET(request: Request) {
  try {
    const user = await requireSupabaseUser(request);
    const profiles = await supabaseRest(`profiles?user_id=eq.${user.id}&select=*`);
    return Response.json({ profiles });
  } catch (error) {
    return routeError(error);
  }
}

export async function POST(request: Request) {
  try {
    const user = await requireSupabaseUser(request);
    const payload = (await request.json()) as {
      displayName?: string;
      campusId?: string;
      canHostUnofficial?: boolean;
      classYear?: string;
    };

    if (!payload.displayName?.trim()) {
      return jsonError("displayName is required");
    }

    const [profile] = await supabaseRest(
      "profiles?on_conflict=user_id",
      {
        method: "POST",
        headers: { prefer: "resolution=merge-duplicates,return=representation" },
        body: JSON.stringify({
          user_id: user.id,
          email: user.email ?? "",
          display_name: payload.displayName.trim(),
          campus_id: payload.campusId ?? "uiuc",
          account_type: "student",
          can_host_unofficial: payload.canHostUnofficial ?? false,
          class_year: payload.classYear ?? null,
        }),
      },
    );

    return Response.json({ profile }, { status: 201 });
  } catch (error) {
    return routeError(error);
  }
}
