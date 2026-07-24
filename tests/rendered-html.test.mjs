import assert from "node:assert/strict";
import { access, readFile } from "node:fs/promises";
import test from "node:test";

const templateRoot = new URL("../", import.meta.url);

test("defines the mobile Pull Up product shell", async () => {
  const [page, layout, css] = await Promise.all([
    readFile(new URL("../app/page.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/layout.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/globals.css", import.meta.url), "utf8"),
  ]);

  assert.match(layout, /title:\s*"Pull Up"/);
  assert.match(page, /Three apps, one nightlife signal layer\./);
  assert.match(page, /Student mobile app/);
  assert.match(page, /Host mobile app/);
  assert.match(page, /Admin review console/);
  assert.match(page, /Find the move, coordinate, check in\./);
  assert.match(page, /Joes ops/);
  assert.match(page, /Review workbench/);
  assert.match(page, /Submit to Pull Up review/);
  assert.match(css, /\.phone-frame/);
  assert.match(css, /\.admin-layout/);
  assert.doesNotMatch(page, /codex-preview|react-loading-skeleton|Your site is taking shape/i);
});

test("defines the backend schema and API surface", async () => {
  const [schema, hosting, profileApi, eventsApi, attendanceApi, hostReportsApi, adminApi] =
    await Promise.all([
      readFile(new URL("../db/schema.ts", import.meta.url), "utf8"),
      readFile(new URL("../.openai/hosting.json", import.meta.url), "utf8"),
      readFile(new URL("../app/api/profile/route.ts", import.meta.url), "utf8"),
      readFile(new URL("../app/api/events/route.ts", import.meta.url), "utf8"),
      readFile(new URL("../app/api/events/[eventId]/attendance/route.ts", import.meta.url), "utf8"),
      readFile(new URL("../app/api/host-reports/route.ts", import.meta.url), "utf8"),
      readFile(new URL("../app/api/admin/reviews/route.ts", import.meta.url), "utf8"),
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

  assert.match(hosting, /"d1":\s*"DB"/);
  assert.match(profileApi, /requireApiProfile/);
  assert.match(eventsApi, /export async function POST/);
  assert.match(attendanceApi, /signalEvents/);
  assert.match(hostReportsApi, /host_report/);
  assert.match(adminApi, /Admin role required/);

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
