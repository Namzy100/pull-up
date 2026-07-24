import assert from "node:assert/strict";
import { access, readFile } from "node:fs/promises";
import test from "node:test";

const templateRoot = new URL("../", import.meta.url);

test("defines the mobile Pull Up product shell", async () => {
  const [page, app, student, host, admin, layout, css] = await Promise.all([
    readFile(new URL("../app/page.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/components/PullUpClientApp.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/student/page.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/host/page.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/admin/page.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/layout.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/globals.css", import.meta.url), "utf8"),
  ]);

  assert.match(layout, /title:\s*"Pull Up"/);
  assert.match(page, /PullUpClientApp/);
  assert.match(app, /Sign in, then land in exactly one nightlife app\./);
  assert.match(app, /Access blocked/);
  assert.match(app, /requiredRole === "host" && auth\.accountType === "student" && auth\.canHostUnofficial/);
  assert.match(app, /Student app/);
  assert.match(app, /Host app/);
  assert.match(app, /Admin app/);
  assert.match(app, /Create unofficial party/);
  assert.match(app, /Review workbench/);
  assert.match(app, /Submit to Pull Up review/);
  assert.match(student, /requiredRole="student"/);
  assert.match(host, /requiredRole="host"/);
  assert.match(admin, /requiredRole="admin"/);
  assert.match(css, /\.phone-frame/);
  assert.match(css, /\.auth-screen/);
  assert.match(css, /\.admin-app/);
  assert.doesNotMatch(app, /codex-preview|react-loading-skeleton|Your site is taking shape/i);
});

test("defines the backend schema and API surface", async () => {
  const [schema, supabaseSchema, envExample, profileApi, eventsApi, attendanceApi, hostReportsApi, adminApi, aiApi, authConfigApi] =
    await Promise.all([
      readFile(new URL("../db/schema.ts", import.meta.url), "utf8"),
      readFile(new URL("../supabase/schema.sql", import.meta.url), "utf8"),
      readFile(new URL("../.env.example", import.meta.url), "utf8"),
      readFile(new URL("../app/api/supabase/profile/route.ts", import.meta.url), "utf8"),
      readFile(new URL("../app/api/supabase/events/route.ts", import.meta.url), "utf8"),
      readFile(new URL("../app/api/supabase/attendance/route.ts", import.meta.url), "utf8"),
      readFile(new URL("../app/api/supabase/host/reports/route.ts", import.meta.url), "utf8"),
      readFile(new URL("../app/api/supabase/admin/reviews/route.ts", import.meta.url), "utf8"),
      readFile(new URL("../app/api/ai/recommendations/route.ts", import.meta.url), "utf8"),
      readFile(new URL("../app/api/auth/config/route.ts", import.meta.url), "utf8"),
    ]);

  for (const table of [
    "profiles",
    "hostOrganizations",
    "venues",
    "events",
    "attendances",
    "hostReports",
    "signalEvents",
    "eventScores",
    "moderationReviews",
  ]) {
    assert.match(schema, new RegExp(`export const ${table}`));
  }

  assert.match(supabaseSchema, /enable row level security/);
  assert.match(supabaseSchema, /account_type in \('student', 'host', 'admin'\)/);
  assert.match(supabaseSchema, /can_host_unofficial boolean/);
  assert.match(supabaseSchema, /public\.is_admin\(\)/);
  assert.match(envExample, /SUPABASE_URL/);
  assert.match(envExample, /OPENAI_API_KEY/);
  assert.match(profileApi, /requireSupabaseUser/);
  assert.match(eventsApi, /export async function POST/);
  assert.match(eventsApi, /can_host_unofficial/);
  assert.match(attendanceApi, /signal_events/);
  assert.match(hostReportsApi, /host_report/);
  assert.match(adminApi, /requireProfile\(request, \["admin"\]\)/);
  assert.match(aiApi, /OPENAI_API_KEY/);
  assert.match(aiApi, /store: false/);
  assert.match(authConfigApi, /SUPABASE_ANON_KEY/);
  assert.doesNotMatch(authConfigApi, /SUPABASE_SERVICE_ROLE_KEY/);

  await access(new URL("../drizzle/0000_vengeful_blue_shield.sql", import.meta.url));
});

test("removes disposable starter preview code", async () => {
  const [page, layout, packageJson] = await Promise.all([
    readFile(new URL("../app/page.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/layout.tsx", import.meta.url), "utf8"),
    readFile(new URL("../package.json", import.meta.url), "utf8"),
  ]);

  assert.doesNotMatch(page, /_sites-preview|SkeletonPreview|codex-preview/);
  assert.doesNotMatch(layout, /Starter Project|codex-preview|_sites-preview/);
  assert.doesNotMatch(packageJson, /react-loading-skeleton/);

  await assert.rejects(access(new URL("app/_sites-preview/SkeletonPreview.tsx", templateRoot)));
  await assert.rejects(access(new URL("app/_sites-preview/preview.css", templateRoot)));
});
