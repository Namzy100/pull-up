import { eq } from "drizzle-orm";
import { getDb } from "../../../db";
import { profiles } from "../../../db/schema";
import { nowIso, requireApiProfile, routeError } from "../_lib";

export async function GET() {
  try {
    const result = await requireApiProfile();
    if ("error" in result) return result.error;
    return Response.json({ profile: result.profile });
  } catch (error) {
    return routeError(error);
  }
}

export async function PATCH(request: Request) {
  try {
    const result = await requireApiProfile();
    if ("error" in result) return result.error;

    const payload = (await request.json()) as {
      displayName?: string;
      bio?: string;
      classYear?: string;
      campusId?: string;
    };

    const [profile] = await getDb()
      .update(profiles)
      .set({
        displayName: payload.displayName?.trim() || result.profile.displayName,
        bio: payload.bio?.trim() ?? result.profile.bio,
        classYear: payload.classYear?.trim() || result.profile.classYear,
        campusId: payload.campusId?.trim() || result.profile.campusId,
        updatedAt: nowIso(),
      })
      .where(eq(profiles.id, result.profile.id))
      .returning();

    return Response.json({ profile });
  } catch (error) {
    return routeError(error);
  }
}
