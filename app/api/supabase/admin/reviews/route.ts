import { jsonError, requireProfile, routeError, supabaseRest } from "../../../_supabase";

type ModerationReviewRow = {
  id: string;
  reviewer_user_id: string;
  status: string;
  decision: string;
  updated_at: string;
};

export async function GET(request: Request) {
  try {
    await requireProfile(request, ["admin"]);
    const rows = await supabaseRest(
      "moderation_reviews?select=*,events(*,host_organizations(*),venues(*))&order=created_at.desc&limit=50",
    );
    return Response.json({ reviews: rows });
  } catch (error) {
    return routeError(error);
  }
}

export async function PATCH(request: Request) {
  try {
    const { user } = await requireProfile(request, ["admin"]);
    const payload = (await request.json()) as {
      reviewId?: string;
      status?: "open" | "approved" | "abstained" | "escalated" | "closed";
      decision?: string;
    };
    if (!payload.reviewId || !payload.status) {
      return jsonError("reviewId and status are required");
    }

    const [review] = await supabaseRest<ModerationReviewRow[]>(`moderation_reviews?id=eq.${payload.reviewId}`, {
      method: "PATCH",
      body: JSON.stringify({
        reviewer_user_id: user.id,
        status: payload.status,
        decision: payload.decision ?? "",
        updated_at: new Date().toISOString(),
      }),
    });

    return Response.json({ review });
  } catch (error) {
    return routeError(error);
  }
}
