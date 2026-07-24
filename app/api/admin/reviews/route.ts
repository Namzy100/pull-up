import { desc, eq } from "drizzle-orm";
import { getDb } from "../../../../db";
import { moderationReviews, profiles } from "../../../../db/schema";
import { jsonError, requireApiProfile, routeError } from "../../_lib";

export async function GET() {
  try {
    const result = await requireApiProfile();
    if ("error" in result) return result.error;
    if (result.profile.role !== "admin") return jsonError("Admin role required", 403);

    const reviews = await getDb()
      .select()
      .from(moderationReviews)
      .orderBy(desc(moderationReviews.createdAt))
      .limit(50);

    return Response.json({ reviews });
  } catch (error) {
    return routeError(error);
  }
}

export async function PATCH(request: Request) {
  try {
    const result = await requireApiProfile();
    if ("error" in result) return result.error;
    if (result.profile.role !== "admin") return jsonError("Admin role required", 403);

    const payload = (await request.json()) as {
      reviewId?: string;
      status?: "open" | "approved" | "abstained" | "escalated" | "closed";
      decision?: string;
    };
    if (!payload.reviewId || !payload.status) {
      return jsonError("reviewId and status are required");
    }

    const [review] = await getDb()
      .update(moderationReviews)
      .set({
        status: payload.status,
        decision: payload.decision?.trim() ?? "",
        reviewerProfileId: result.profile.id,
        updatedAt: new Date().toISOString(),
      })
      .where(eq(moderationReviews.id, payload.reviewId))
      .returning();

    return Response.json({ review });
  } catch (error) {
    return routeError(error);
  }
}
