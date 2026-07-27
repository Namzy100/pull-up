import assert from "node:assert/strict";
import { access, readFile } from "node:fs/promises";
import test from "node:test";

const templateRoot = new URL("../", import.meta.url);

test("defines the single-surface student product and one design system", async () => {
  const [
    page,
    orchestrator,
    entry,
    studentApp,
    ui,
    callback,
    supabaseAuth,
    supabaseClient,
    host,
    admin,
    data,
    student,
    hostPage,
    adminPage,
    layout,
    css,
    migration0002,
  ] = await Promise.all([
    readFile(new URL("../app/page.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/components/PullUpClientApp.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/components/Entry.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/components/StudentApp.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/components/ui.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/auth/callback/page.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/lib/supabaseAuth.ts", import.meta.url), "utf8"),
    readFile(new URL("../app/lib/supabaseClient.ts", import.meta.url), "utf8"),
    readFile(new URL("../app/components/HostApp.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/components/AdminApp.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/pull-up-data.ts", import.meta.url), "utf8"),
    readFile(new URL("../app/student/page.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/host/page.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/admin/page.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/layout.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/globals.css", import.meta.url), "utf8"),
    readFile(new URL("../supabase/migrations/0002_profile_role_lock.sql", import.meta.url), "utf8"),
  ]);

  // Shell + routing.
  assert.match(layout, /title:\s*"Pull Up"/);
  assert.match(page, /PullUpClientApp/);
  assert.match(student, /requiredRole="student"/);
  assert.match(hostPage, /requiredRole="host"/);
  assert.match(adminPage, /requiredRole="admin"/);

  // Concise entry / sign-in experience.
  assert.match(entry, /Sign in to Pull Up/);
  assert.match(entry, /Know where campus is/);
  assert.match(entry, /Preview tonight/);
  assert.match(entry, /Create an account/);

  // Tonight leads with the decision and the plan flow is coherent.
  assert.match(studentApp, /className="bottom-nav"/);
  assert.match(studentApp, /What's the move\?/);
  assert.match(studentApp, /See why/); // secondary action into the evidence
  assert.match(studentApp, /Start a plan/);
  assert.match(studentApp, /Commit arrival time/);
  assert.match(studentApp, /Report conditions/);
  assert.match(studentApp, /Sign out/); // sign-out lives in Profile

  // Distinct sample-night momentum states, coherent scenario.
  assert.match(data, /Joe's/);
  assert.match(data, /The Red Lion/);
  assert.match(data, /Murphy's Pub/);
  assert.match(data, /KAMS/);
  assert.match(data, /No reliable call/);
  assert.match(data, /4 friends leaning here/);

  // One quiet global disclosure.
  assert.match(ui, /Prototype night · sample activity/);
  assert.match(ui, /export function StateScreen/);
  assert.match(ui, /export function MomentumMeter/);

  // Role separation preserved.
  assert.match(
    orchestrator,
    /role === "host" && session\.accountType === "student" && session\.canHostUnofficial/,
  );
  assert.match(host, /Report live conditions|Submit for review/);
  assert.match(admin, /Needs a decision/);
  assert.match(admin, /Protect the call/);

  // Auth lifecycle: PKCE, email confirm + password reset, token stripped from URL.
  assert.match(supabaseClient, /flowType: "pkce"/);
  assert.match(supabaseClient, /storageKey: "pull-up-auth"/);
  assert.match(supabaseAuth, /ensureProfile/);
  assert.match(supabaseAuth, /exchangeCodeForSession/);
  assert.match(supabaseAuth, /emailRedirectTo/);
  assert.match(entry, /isCampusEmail/);
  assert.match(callback, /exchangeCodeForSession/);
  assert.match(callback, /recovery/);
  assert.match(callback, /Choose a new password/);
  assert.match(callback, /replaceState/);

  // RLS hardening: students cannot self-assign a host/admin role.
  assert.match(migration0002, /revoke update on public\.profiles/i);
  assert.match(migration0002, /grant update \(display_name/i);
  assert.doesNotMatch(migration0002, /grant update \([^)]*account_type/i);

  // One design system in the CSS.
  assert.match(css, /\.move-hero/);
  assert.match(css, /\.bottom-nav/);
  assert.match(css, /\.signal-tile/);
  assert.match(css, /\.momentum-meter/);
  assert.match(css, /prefers-reduced-motion/);
  assert.match(css, /:focus-visible/);

  // Redesign guards: no phone frames, no stock nightclub photography.
  for (const source of [entry, studentApp, orchestrator, host, admin]) {
    assert.doesNotMatch(source, /PhoneFrame|phone-frame/);
  }
  assert.doesNotMatch(css, /\.phone-frame/);
  assert.doesNotMatch(css, /unsplash/i);

  // Security: the service-role key never appears in client-side code.
  for (const source of [entry, studentApp, orchestrator, ui, supabaseAuth, supabaseClient, callback]) {
    assert.doesNotMatch(source, /SERVICE_ROLE/);
  }
});

test("defines the backend schema and API surface", async () => {
  const [schema, supabaseSchema, envExample, profileApi, eventsApi, attendanceApi, conditionsApi, hostReportsApi, adminApi, aiApi, authConfigApi, journeyScript] =
    await Promise.all([
      readFile(new URL("../db/schema.ts", import.meta.url), "utf8"),
      readFile(new URL("../supabase/schema.sql", import.meta.url), "utf8"),
      readFile(new URL("../.env.example", import.meta.url), "utf8"),
      readFile(new URL("../app/api/supabase/profile/route.ts", import.meta.url), "utf8"),
      readFile(new URL("../app/api/supabase/events/route.ts", import.meta.url), "utf8"),
      readFile(new URL("../app/api/supabase/attendance/route.ts", import.meta.url), "utf8"),
      readFile(new URL("../app/api/supabase/conditions/route.ts", import.meta.url), "utf8"),
      readFile(new URL("../app/api/supabase/host/reports/route.ts", import.meta.url), "utf8"),
      readFile(new URL("../app/api/supabase/admin/reviews/route.ts", import.meta.url), "utf8"),
      readFile(new URL("../app/api/ai/recommendations/route.ts", import.meta.url), "utf8"),
      readFile(new URL("../app/api/auth/config/route.ts", import.meta.url), "utf8"),
      readFile(new URL("../scripts/supabase-local-journey.mjs", import.meta.url), "utf8"),
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
  assert.match(eventsApi, /isOrganizationMember/);
  assert.match(attendanceApi, /signal_events/);
  assert.match(attendanceApi, /export async function GET/);
  assert.match(conditionsApi, /lineState/);
  assert.match(conditionsApi, /source: "ambassador"/);
  assert.match(hostReportsApi, /host_report/);
  assert.match(hostReportsApi, /canReportForEvent/);
  assert.match(adminApi, /requireProfile\(request, \["admin"\]\)/);
  assert.match(aiApi, /OPENAI_API_KEY/);
  assert.match(aiApi, /store: false/);
  assert.match(authConfigApi, /SUPABASE_ANON_KEY/);
  assert.doesNotMatch(authConfigApi, /SUPABASE_SERVICE_ROLE_KEY/);
  assert.match(journeyScript, /Supabase persisted journey passed/);
  assert.match(journeyScript, /Anonymous profile reads should return no rows/);
  assert.match(journeyScript, /Student token should not access admin reviews/);

  await access(new URL("../drizzle/0000_vengeful_blue_shield.sql", import.meta.url));
  await access(new URL("../supabase/migrations/0001_pull_up_schema.sql", import.meta.url));
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
