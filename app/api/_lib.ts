import { eq } from "drizzle-orm";
import { getChatGPTUser } from "../chatgpt-auth";
import { getDb } from "../../db";
import { profiles } from "../../db/schema";

export function jsonError(message: string, status = 400) {
  return Response.json({ error: message }, { status });
}

export function createId(prefix: string) {
  return `${prefix}_${crypto.randomUUID().replaceAll("-", "")}`;
}

export function nowIso() {
  return new Date().toISOString();
}

export async function requireApiProfile() {
  const user = await getChatGPTUser();
  if (!user) return { error: jsonError("Sign in required", 401) };

  const db = getDb();
  const existing = await db
    .select()
    .from(profiles)
    .where(eq(profiles.email, user.email))
    .limit(1);

  if (existing[0]) return { profile: existing[0] };

  const [profile] = await db
    .insert(profiles)
    .values({
      id: createId("prof"),
      email: user.email,
      displayName: user.displayName,
      campusId: "uiuc",
      role: "student",
      updatedAt: nowIso(),
    })
    .returning();

  return { profile };
}

export function routeError(error: unknown) {
  const message = error instanceof Error ? error.message : "Unexpected error";
  if (message.includes("no such table")) {
    return jsonError("Database migration has not been applied yet.", 503);
  }
  return jsonError(message, 500);
}
