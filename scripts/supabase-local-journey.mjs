import { readFile } from "node:fs/promises";

const env = await loadLocalEnv();
const required = ["SUPABASE_URL", "SUPABASE_ANON_KEY", "SUPABASE_SERVICE_ROLE_KEY"];
const missing = required.filter((key) => !env[key]);
if (missing.length > 0) {
  fail(`Missing required variables: ${missing.join(", ")}`);
}

const supabaseUrl = env.SUPABASE_URL.replace(/\/$/, "");
const anonKey = env.SUPABASE_ANON_KEY;
const serviceRoleKey = env.SUPABASE_SERVICE_ROLE_KEY;
const appUrl = (process.env.LOCAL_APP_URL ?? "http://localhost:3000").replace(/\/$/, "");
const runId = `${Date.now()}-${Math.random().toString(16).slice(2)}`;
const password = `PullUp-${runId}-Pass!`;
const createdUserIds = [];
let authAdminCleanupAvailable = true;
const passedSteps = [];

try {
  await checkLocalAppConfig();
  record("Local app reads Supabase URL and anon key.");
  await checkSchemaPresence();
  record("Supabase schema tables are queryable through the server key.");

  const anonymousProfiles = await restWithoutAuth("profiles?select=id,email,display_name&limit=5");
  assert(Array.isArray(anonymousProfiles) && anonymousProfiles.length === 0, "Anonymous profile reads should return no rows under RLS.");
  record("Anonymous profile reads return no rows under RLS.");

  const student = await createConfirmedUser(`pullup.student.${runId}@gmail.com`, password);
  const otherStudent = await createConfirmedUser(`pullup.other.${runId}@gmail.com`, password);
  const host = await createConfirmedUser(`pullup.host.${runId}@gmail.com`, password);
  const admin = await createConfirmedUser(`pullup.admin.${runId}@gmail.com`, password);
  record("Temporary Supabase Auth users created.");

  const studentSession = await signIn(student.email, password);
  const otherSession = await signIn(otherStudent.email, password);
  const hostSession = await signIn(host.email, password);
  const adminSession = await signIn(admin.email, password);
  record("Temporary users can sign in and receive sessions.");

  await createProfileThroughLocalApi(studentSession.access_token, {
    displayName: "Supabase Journey Student",
    canHostUnofficial: true,
  });
  await insertProfile(otherStudent.id, otherStudent.email, "Other Student", "student", false);
  await insertProfile(host.id, host.email, "Journey Host", "host", false);
  await insertProfile(admin.id, admin.email, "Journey Admin", "admin", false);
  record("Profiles persist through local API and server-side provisioning.");

  const studentProfiles = await restAsUser(studentSession.access_token, "profiles?select=user_id,email,account_type");
  assert(studentProfiles.length === 1, "Student RLS should return exactly the signed-in student's profile.");
  assert(studentProfiles[0].user_id === student.id, "Student RLS returned a different profile.");
  record("Student RLS returns only the signed-in student's profile.");

  const otherProfiles = await restAsUser(otherSession.access_token, "profiles?select=user_id,email,account_type");
  assert(otherProfiles.length === 1, "Second student RLS should return exactly that student's profile.");
  assert(otherProfiles[0].user_id === otherStudent.id, "Second student RLS returned a different profile.");
  record("A second student cannot read the first student's profile.");

  const adminProfiles = await restAsUser(adminSession.access_token, "profiles?select=user_id,email,account_type");
  assert(adminProfiles.length >= 3, "Admin RLS should allow reading reviewed profiles.");
  record("Admin RLS can read reviewed profiles.");

  const event = await insertLiveUnofficialEvent(student.id);
  const attendance = await postLocalApi(studentSession.access_token, "/api/supabase/attendance", {
    eventId: event.id,
    status: "arrived",
    visibility: "friends",
  });
  assert(attendance.attendance?.event_id === event.id, "Attendance endpoint did not persist the expected event.");
  record("Attendance/check-in persists through the local API.");

  const condition = await postLocalApi(studentSession.access_token, "/api/supabase/conditions", {
    eventId: event.id,
    lineState: "moving",
    cover: "No cover",
    note: "Line moving steadily during verification.",
  });
  assert(condition.signal?.source === "ambassador", "Condition report did not persist as a reviewable signal.");
  record("Student condition report persists as a reviewable signal without exposing a location trail.");

  const otherStudentAttendance = await restAsUser(otherSession.access_token, `attendances?event_id=eq.${event.id}&select=user_id,status,visibility`);
  assert(otherStudentAttendance.length === 0, "Student B should not read Student A's private attendance or crew intent.");
  record("Student B cannot read Student A's private attendance or crew intent.");

  const studentSignals = await restAsUser(studentSession.access_token, `signal_events?event_id=eq.${event.id}&select=user_id,metadata`);
  assert(studentSignals.length === 0, "Students should not read raw signal identities.");
  record("Raw signal identities are not exposed to students.");

  const signalRows = await restService(`signal_events?event_id=eq.${event.id}&select=source,user_id`);
  assert(signalRows.some((row) => row.source === "checkin" && row.user_id === student.id), "Arrival did not create a check-in signal.");
  record("Arrival creates a traceable check-in signal event.");

  const blockedAdminResponse = await fetch(`${appUrl}/api/supabase/admin/reviews`, {
    headers: { authorization: `Bearer ${studentSession.access_token}` },
  });
  assert(blockedAdminResponse.status === 403, "Student token should not access admin reviews.");
  record("Student token is blocked from admin review routes.");

  const expiredSessionResponse = await fetch(`${appUrl}/api/supabase/profile`, {
    headers: { authorization: "Bearer expired-test-token" },
  });
  assert(expiredSessionResponse.status === 401, "Expired or invalid sessions should be rejected.");
  record("Expired or invalid sessions are rejected.");

  const organization = await postLocalApi(hostSession.access_token, "/api/supabase/host/organizations", {
    name: "Journey Host Org",
    kind: "bar",
  });
  const hostEvent = await insertLiveOfficialEvent(host.id, organization.organization.id);
  const hostReport = await postLocalApi(hostSession.access_token, "/api/supabase/host/reports", {
    eventId: hostEvent.id,
    lineState: "building",
    capacityPressure: 77,
    note: "Host factual report for verification.",
  });
  assert(hostReport.report?.review_status === "pending", "Host reports should remain reviewable.");
  const hostScores = await restService(`event_scores?event_id=eq.${hostEvent.id}&select=event_id,state,confidence`);
  assert(hostScores.length === 0, "Host report should not directly create or mutate momentum scores.");
  record("Host reports remain factual/reviewable and do not directly set momentum.");

  pass("Supabase persisted journey passed: Auth, profile creation, attendance, signal provenance, and RLS boundaries are working.");
} catch (error) {
  if (passedSteps.length > 0) {
    console.log("Passed before failure:");
    for (const step of passedSteps) console.log(`- ${step}`);
  }
  fail(error instanceof Error ? error.message : "Unknown Supabase verification failure.");
} finally {
  await Promise.allSettled(createdUserIds.map((id) => deleteUser(id)));
}

async function loadLocalEnv() {
  const text = await readFile(new URL("../.env.local", import.meta.url), "utf8");
  const result = { ...process.env };
  for (const rawLine of text.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith("#")) continue;
    const equalsIndex = line.indexOf("=");
    if (equalsIndex === -1) continue;
    const key = line.slice(0, equalsIndex).trim();
    const value = line.slice(equalsIndex + 1).trim().replace(/^["']|["']$/g, "");
    result[key] = value;
  }
  return result;
}

async function checkLocalAppConfig() {
  const response = await fetch(`${appUrl}/api/auth/config`);
  assert(response.ok, "Local app is not reachable. Start it with the .env.local variables loaded.");
  const body = await response.json();
  assert(body.configured === true, "Local app does not see the Supabase URL and anon key.");
}

async function checkSchemaPresence() {
  const checks = [
    "profiles?select=id&limit=1",
    "events?select=id&limit=1",
    "attendances?select=id&limit=1",
    "signal_events?select=id&limit=1",
    "moderation_reviews?select=id&limit=1",
  ];

  for (const path of checks) {
    const response = await fetch(`${supabaseUrl}/rest/v1/${path}`, {
      headers: serviceHeaders(),
    });
    if (!response.ok) {
      throw new Error("Supabase schema is not queryable. Apply supabase/schema.sql with a DB connection or Supabase SQL editor, then rerun this script.");
    }
  }
}

async function createConfirmedUser(email, passwordValue) {
  if (!authAdminCleanupAvailable) {
    return signUpUser(email, passwordValue);
  }

  let lastStatus = 0;
  let lastBody = {};
  for (let attempt = 0; attempt < 6; attempt += 1) {
    const response = await fetch(`${supabaseUrl}/auth/v1/admin/users`, {
      method: "POST",
      headers: serviceHeaders(),
      body: JSON.stringify({
        email,
        password: passwordValue,
        email_confirm: true,
      }),
    });
    const body = await safeJson(response);
    lastStatus = response.status;
    lastBody = body;
    if (response.ok) {
      const userId = body.id ?? body.user?.id;
      if (!userId) throw new Error("Temporary auth user was created, but Supabase did not return a user id.");
      createdUserIds.push(userId);
      return { id: userId, email };
    }
    if (response.status !== 403 || !authError(body).includes("invalid JWT")) break;
    await wait(350 * (attempt + 1));
  }

  if (lastStatus === 403) {
    authAdminCleanupAvailable = false;
    return signUpUser(email, passwordValue);
  }
  throw new Error(`Could not create temporary auth user. Status ${lastStatus}. ${authError(lastBody)}`);
}

async function signUpUser(email, passwordValue) {
  const response = await fetch(`${supabaseUrl}/auth/v1/signup`, {
    method: "POST",
    headers: anonHeaders(),
    body: JSON.stringify({ email, password: passwordValue }),
  });
  const body = await safeJson(response);
  if (!response.ok || !body.user?.id) {
    throw new Error(`Could not sign up temporary auth user. Status ${response.status}. ${authError(body)}`);
  }
  if (!body.access_token) {
    throw new Error("Temporary user was created but requires email confirmation, so the automated persisted journey cannot sign in.");
  }
  return { id: body.user.id, email };
}

async function signIn(email, passwordValue) {
  const response = await fetch(`${supabaseUrl}/auth/v1/token?grant_type=password`, {
    method: "POST",
    headers: anonHeaders(),
    body: JSON.stringify({ email, password: passwordValue }),
  });
  const body = await safeJson(response);
  if (!response.ok || !body.access_token) throw new Error(`Could not sign in temporary user. Status ${response.status}.`);
  return body;
}

async function createProfileThroughLocalApi(accessToken, payload) {
  const response = await fetch(`${appUrl}/api/supabase/profile`, {
    method: "POST",
    headers: localUserHeaders(accessToken),
    body: JSON.stringify(payload),
  });
  const body = await safeJson(response);
  if (!response.ok || !body.profile) throw new Error(`Local profile creation failed. Status ${response.status}.`);
  return body.profile;
}

async function insertProfile(userId, email, displayName, accountType, canHostUnofficial) {
  const [profile] = await restService("profiles", {
    method: "POST",
    body: JSON.stringify({
      user_id: userId,
      email,
      display_name: displayName,
      campus_id: "uiuc",
      account_type: accountType,
      can_host_unofficial: canHostUnofficial,
    }),
  });
  return profile;
}

async function insertLiveUnofficialEvent(userId) {
  const now = new Date();
  const later = new Date(now.getTime() + 1000 * 60 * 60 * 4);
  const [event] = await restService("events", {
    method: "POST",
    body: JSON.stringify({
      campus_id: "uiuc",
      created_by_user_id: userId,
      title: "Supabase Journey House Party",
      description: "Temporary verification event",
      starts_at: now.toISOString(),
      ends_at: later.toISOString(),
      status: "live",
      event_type: "unofficial_party",
      invite_mode: "friends_of_friends",
      cover: "No cover",
      age_rule: "18+",
    }),
  });
  return event;
}

async function insertLiveOfficialEvent(userId, organizationId) {
  const now = new Date();
  const later = new Date(now.getTime() + 1000 * 60 * 60 * 4);
  const [event] = await restService("events", {
    method: "POST",
    body: JSON.stringify({
      campus_id: "uiuc",
      host_organization_id: organizationId,
      created_by_user_id: userId,
      title: "Journey Host Official Event",
      description: "Temporary host verification event",
      starts_at: now.toISOString(),
      ends_at: later.toISOString(),
      status: "live",
      event_type: "official",
      invite_mode: "open",
      cover: "$5",
      age_rule: "19+",
    }),
  });
  return event;
}

async function postLocalApi(accessToken, path, payload) {
  const response = await fetch(`${appUrl}${path}`, {
    method: "POST",
    headers: localUserHeaders(accessToken),
    body: JSON.stringify(payload),
  });
  const body = await safeJson(response);
  if (!response.ok) throw new Error(`Local API ${path} failed. Status ${response.status}.`);
  return body;
}

async function restAsUser(accessToken, path) {
  const response = await fetch(`${supabaseUrl}/rest/v1/${path}`, {
    headers: {
      apikey: anonKey,
      authorization: `Bearer ${accessToken}`,
    },
  });
  const body = await safeJson(response);
  if (!response.ok) throw new Error(`User REST query failed. Status ${response.status}.`);
  return body;
}

async function restWithoutAuth(path) {
  const response = await fetch(`${supabaseUrl}/rest/v1/${path}`, {
    headers: { apikey: anonKey },
  });
  const body = await safeJson(response);
  if (!response.ok) throw new Error(`Anonymous REST query failed. Status ${response.status}.`);
  return body;
}

async function restService(path, init = {}) {
  const response = await fetch(`${supabaseUrl}/rest/v1/${path}`, {
    ...init,
    headers: {
      ...serviceHeaders(),
      prefer: "return=representation",
      ...(init.headers ?? {}),
    },
  });
  const body = await safeJson(response);
  if (!response.ok) throw new Error(`Service REST query failed. Status ${response.status}.`);
  return body;
}

async function deleteUser(userId) {
  if (!authAdminCleanupAvailable) return;
  for (let attempt = 0; attempt < 4; attempt += 1) {
    const response = await fetch(`${supabaseUrl}/auth/v1/admin/users/${userId}`, {
      method: "DELETE",
      headers: serviceHeaders(),
    });
    if (response.ok) return;
    await wait(250 * (attempt + 1));
  }
}

async function safeJson(response) {
  const text = await response.text();
  if (!text) return {};
  try {
    return JSON.parse(text);
  } catch {
    return {};
  }
}

function serviceHeaders() {
  const headers = {
    apikey: serviceRoleKey,
    "content-type": "application/json",
  };
  if (!serviceRoleKey.startsWith("sb_secret_")) {
    headers.authorization = `Bearer ${serviceRoleKey}`;
  }
  return headers;
}

function anonHeaders() {
  return {
    apikey: anonKey,
    "content-type": "application/json",
  };
}

function localUserHeaders(accessToken) {
  return {
    authorization: `Bearer ${accessToken}`,
    "content-type": "application/json",
  };
}

function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function authError(body) {
  const code = typeof body.code === "string" ? body.code : null;
  const message = typeof body.msg === "string" ? body.msg : typeof body.message === "string" ? body.message : null;
  return [code && `code=${code}`, message && `message=${message}`].filter(Boolean).join(" ");
}

function pass(message) {
  console.log(message);
}

function record(message) {
  passedSteps.push(message);
  console.log(`PASS ${message}`);
}

function fail(message) {
  console.error(message);
  process.exitCode = 1;
}
