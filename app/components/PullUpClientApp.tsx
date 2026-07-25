"use client";

import { useEffect, useMemo, useState } from "react";
import {
  AccountType,
  Venue,
  adminQueue,
  coldStartStages,
  confidenceCopy,
  demoProfiles,
  fridayJourney,
  momentumCopy,
  riskCopy,
  signalHierarchy,
  venues,
} from "../pull-up-data";

type AuthState = {
  accessToken: string;
  accountType: AccountType;
  canHostUnofficial: boolean;
  displayName: string;
  email: string;
  isDemo: boolean;
};

type ApiConfig = {
  configured: boolean;
  supabaseUrl: string | null;
  supabaseAnonKey: string | null;
};

type SupabaseProfile = {
  account_type: AccountType;
  can_host_unofficial: boolean;
  display_name: string;
  email: string;
};

const STORAGE_KEY = "pull-up-session";
const ARRIVAL_WINDOW = "10:30-10:45";

type LiveEvent = {
  id: string;
  title: string;
  cover: string;
  age_rule: string;
  starts_at: string;
  status: string;
  event_type: string;
  venues?: { name?: string; kind?: string } | null;
};

type AttendanceRow = {
  id: string;
  event_id: string;
  status: string;
  visibility: string;
  updated_at?: string;
  events?: LiveEvent | null;
};

export default function PullUpClientApp({ requiredRole }: { requiredRole?: AccountType }) {
  const [auth, setAuth] = useState<AuthState | null>(null);
  const [email, setEmail] = useState("sarah@illinois.edu");
  const [password, setPassword] = useState("pullup-demo-pass");
  const [accountType, setAccountType] = useState<AccountType>("student");
  const [message, setMessage] = useState("Preview tonight without signing in. Join a plan when you are ready.");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    window.setTimeout(() => {
      const saved = window.localStorage.getItem(STORAGE_KEY);
      if (saved) setAuth(JSON.parse(saved) as AuthState);
    }, 0);
  }, []);

  useEffect(() => {
    if (!auth) return;
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(auth));
  }, [auth]);

  const activeRole = requiredRole ?? auth?.accountType ?? "student";
  const isAllowed = useMemo(() => {
    if (!requiredRole || !auth) return true;
    if (auth.accountType === requiredRole) return true;
    return requiredRole === "host" && auth.accountType === "student" && auth.canHostUnofficial;
  }, [auth, requiredRole]);

  async function readConfig(): Promise<ApiConfig> {
    const response = await fetch("/api/auth/config");
    if (!response.ok) throw new Error("Auth config is unavailable.");
    return (await response.json()) as ApiConfig;
  }

  async function signIn(mode: "signin" | "signup") {
    setLoading(true);
    setMessage("Checking your Pull Up account...");
    try {
      const config = await readConfig();
      if (!config.configured || !config.supabaseUrl || !config.supabaseAnonKey) {
        startDemo(accountType);
        setMessage("Running in demo mode. Add Supabase keys to turn this into real auth.");
        return;
      }

      const authPath = mode === "signin" ? "token?grant_type=password" : "signup";
      const response = await fetch(`${config.supabaseUrl}/auth/v1/${authPath}`, {
        method: "POST",
        headers: {
          apikey: config.supabaseAnonKey,
          "content-type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      });
      const result = (await response.json()) as {
        access_token?: string;
        error_description?: string;
        msg?: string;
        user?: { email?: string };
      };
      if (!response.ok || !result.access_token) {
        if (mode === "signup" && response.ok) {
          throw new Error("Check your email to confirm this account, then sign in.");
        }
        throw new Error(result.error_description ?? result.msg ?? "Supabase rejected this sign-in.");
      }

      const profile = await ensureProfile(result.access_token, mode, result.user?.email ?? email);
      setAuth({
        accessToken: result.access_token,
        accountType: profile.account_type,
        canHostUnofficial: profile.can_host_unofficial,
        displayName: profile.display_name,
        email: profile.email,
        isDemo: false,
      });
      setMessage("Signed in. Your role decides the app you can open.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  async function ensureProfile(accessToken: string, mode: "signin" | "signup", profileEmail: string): Promise<SupabaseProfile> {
    const profileResponse = await fetch("/api/supabase/profile", {
      headers: { authorization: `Bearer ${accessToken}` },
    });
    if (!profileResponse.ok) {
      throw new Error("Signed in, but Pull Up could not read your profile.");
    }

    const profileResult = (await profileResponse.json()) as { profiles?: SupabaseProfile[] };
    const existingProfile = profileResult.profiles?.[0];
    if (existingProfile) return existingProfile;
    if (mode !== "signup") {
      throw new Error("Signed in, but no Pull Up profile exists for this account yet.");
    }

    const createdResponse = await fetch("/api/supabase/profile", {
      method: "POST",
      headers: {
        authorization: `Bearer ${accessToken}`,
        "content-type": "application/json",
      },
      body: JSON.stringify({
        displayName: displayNameFromEmail(profileEmail),
        campusId: "uiuc",
        canHostUnofficial: false,
      }),
    });
    if (!createdResponse.ok) {
      throw new Error("Account created, but Pull Up could not create your profile.");
    }

    const createdResult = (await createdResponse.json()) as { profile?: SupabaseProfile };
    if (!createdResult.profile) {
      throw new Error("Account created, but Pull Up did not receive a profile.");
    }
    return createdResult.profile;
  }

  function startDemo(role: AccountType) {
    const profile = demoProfiles[role];
    setAuth({
      accessToken: "demo-token",
      accountType: profile.accountType,
      canHostUnofficial: profile.canHostUnofficial,
      displayName: profile.displayName,
      email: profile.email,
      isDemo: true,
    });
  }

  function signOut() {
    window.localStorage.removeItem(STORAGE_KEY);
    setAuth(null);
    setMessage("Signed out. You can still preview the public Tonight feed.");
  }

  function requireAction(action: string, venueName: string) {
    if (!auth) {
      setMessage(`${action} for ${venueName} needs sign-in so friend context stays private.`);
      return;
    }
    setMessage(`${action} is ready for ${venueName}. Open the student app to save it to your account.`);
  }

  if (requiredRole && !auth) {
    return (
      <main className="app-shell">
        <PublicTonight
          email={email}
          password={password}
          accountType={accountType}
          message={message}
          loading={loading}
          setEmail={setEmail}
          setPassword={setPassword}
          setAccountType={setAccountType}
          signIn={signIn}
          startDemo={startDemo}
          onVenueAction={requireAction}
        />
      </main>
    );
  }

  if (auth && !isAllowed) {
    return (
      <main className="app-shell">
        <section className="locked-screen">
          <p className="eyebrow">Access blocked</p>
          <h1>This account cannot open the {requiredRole} app.</h1>
          <p>
            Signed in as {auth.accountType}. Pull Up keeps student, host, and
            admin surfaces separate so private data does not leak across roles.
          </p>
          <div className="auth-actions">
            <a href={`/${auth.accountType}`}>Go to my app</a>
            <button onClick={signOut}>Sign out</button>
          </div>
        </section>
      </main>
    );
  }

  return (
    <main className="app-shell">
      {auth && activeRole !== "student" && <AppHeader auth={auth} onSignOut={signOut} />}
      {!auth && (
        <PublicTonight
          email={email}
          password={password}
          accountType={accountType}
          message={message}
          loading={loading}
          setEmail={setEmail}
          setPassword={setPassword}
          setAccountType={setAccountType}
          signIn={signIn}
          startDemo={startDemo}
          onVenueAction={requireAction}
        />
      )}
      {auth && activeRole === "student" && <StudentApp auth={auth} onSignOut={signOut} />}
      {auth && activeRole === "host" && <HostApp auth={auth} />}
      {auth && activeRole === "admin" && <AdminApp />}
    </main>
  );
}

function displayNameFromEmail(email: string) {
  const localPart = email.split("@")[0] ?? "Student";
  return localPart
    .split(/[._-]/)
    .filter(Boolean)
    .map((part) => `${part.charAt(0).toUpperCase()}${part.slice(1)}`)
    .join(" ") || "Student";
}

async function apiRequest<T>(accessToken: string, path: string, init: RequestInit = {}): Promise<T> {
  const response = await fetch(path, {
    ...init,
    headers: {
      authorization: `Bearer ${accessToken}`,
      "content-type": "application/json",
      ...(init.headers ?? {}),
    },
  });
  if (!response.ok) {
    throw new Error(`API request failed with status ${response.status}`);
  }
  return (await response.json()) as T;
}

function PublicTonight({
  email,
  password,
  accountType,
  message,
  loading,
  setEmail,
  setPassword,
  setAccountType,
  signIn,
  startDemo,
  onVenueAction,
}: {
  email: string;
  password: string;
  accountType: AccountType;
  message: string;
  loading: boolean;
  setEmail: (value: string) => void;
  setPassword: (value: string) => void;
  setAccountType: (value: AccountType) => void;
  signIn: (mode: "signin" | "signup") => void;
  startDemo: (role: AccountType) => void;
  onVenueAction: (action: string, venueName: string) => void;
}) {
  return (
    <>
      <section className="student-hero">
        <div className="hero-story">
          <p className="eyebrow">UIUC tonight</p>
          <h1>Know where campus is actually going tonight.</h1>
          <p>
            Stop guessing from group chats and half-updated stories. Pull Up
            shows what is building, where your crew is leaning, and when to go.
          </p>
          <div className="hero-actions">
            <a href="/student">Open Tonight</a>
            <button onClick={() => onVenueAction("Join the plan", "Joe's Brewery")}>Join Joe&apos;s plan</button>
          </div>
          <p className="platform-note">
            This hosted preview may still show a platform sign-in gate. Pull Up&apos;s intended production flow lets students preview a privacy-safe feed before signing in.
          </p>
        </div>
        <PhoneFrame audience="Public preview" title="Tonight" tabs={["Tonight", "Crew", "Plans"]}>
          <TonightFeed publicPreview onVenueAction={onVenueAction} />
        </PhoneFrame>
      </section>

      <section className="journey-section">
        <SectionIntro
          label="Friday-night loop"
          title="One decision, four moments."
          body="The student product is not a leaderboard. It is a coordination loop: discover momentum, check crew intent, join a plan, then verify what changed when someone arrives."
        />
        <div className="journey-grid">
          {fridayJourney.map((step) => (
            <article className="journey-card" key={step.time}>
              <span>{step.time}</span>
              <h3>{step.title}</h3>
              <p>{step.detail}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="trust-section">
        <SectionIntro
          label="Honest signals"
          title="No reliable call is a feature, not a failure."
          body="Pull Up should still be useful before it has campus-wide density. Early launch mode starts with official info, ambassadors, host facts, explicit student intent, and abstention when evidence is weak."
        />
        <div className="trust-grid">
          <div className="signal-stack">
            {signalHierarchy.map((signal, index) => (
              <span key={signal}><b>{index + 1}</b>{signal}</span>
            ))}
          </div>
          <div className="cold-start-grid">
            {coldStartStages.map((stage) => (
              <article key={stage.users}>
                <strong>{stage.users}</strong>
                <p>{stage.mode}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="systems-section">
        <SectionIntro
          label="Trust machinery"
          title="Hosts report facts. Admins protect the call."
          body="The host and admin products support the student answer without letting any venue buy or force momentum."
        />
        <div className="surface-links">
          <a href="/host"><strong>Host MVP</strong><span>Submit events, update cover and rules, report line and capacity.</span></a>
          <a href="/admin"><strong>Admin console</strong><span>Review conflicting evidence, downweight bad reports, replay decisions.</span></a>
        </div>
      </section>

      <section className="auth-screen compact-auth">
        <div className="auth-copy">
          <p className="eyebrow">When sign-in matters</p>
          <h2>Join plans only after Pull Up can protect your identity.</h2>
          <p>
            Sign-in unlocks friends, private intent, check-ins, venue follows,
            hosting, and verified reports. Public visitors see only aggregate,
            privacy-safe signals.
          </p>
        </div>
        <AuthCard
          email={email}
          password={password}
          accountType={accountType}
          message={message}
          loading={loading}
          setEmail={setEmail}
          setPassword={setPassword}
          setAccountType={setAccountType}
          signIn={signIn}
          startDemo={startDemo}
        />
      </section>
    </>
  );
}

function AuthCard(props: {
  email: string;
  password: string;
  accountType: AccountType;
  message: string;
  loading: boolean;
  setEmail: (value: string) => void;
  setPassword: (value: string) => void;
  setAccountType: (value: AccountType) => void;
  signIn: (mode: "signin" | "signup") => void;
  startDemo: (role: AccountType) => void;
}) {
  return (
    <form className="auth-card" onSubmit={(event) => event.preventDefault()}>
      <div>
        <p className="eyebrow">Account door</p>
        <h2>Open your version</h2>
      </div>
      <label>
        Email
        <input value={props.email} onChange={(event) => props.setEmail(event.target.value)} />
      </label>
      <label>
        Password
        <input type="password" value={props.password} onChange={(event) => props.setPassword(event.target.value)} />
      </label>
      <label>
        Demo role
        <select value={props.accountType} onChange={(event) => props.setAccountType(event.target.value as AccountType)}>
          <option value="student">Student</option>
          <option value="host">Host org</option>
          <option value="admin">Admin</option>
        </select>
      </label>
      <div className="auth-actions">
        <button type="button" onClick={() => props.signIn("signin")} disabled={props.loading}>Sign in</button>
        <button type="button" onClick={() => props.signIn("signup")} disabled={props.loading}>Sign up</button>
      </div>
      <button className="ghost-button" type="button" onClick={() => props.startDemo(props.accountType)}>
        Open demo {props.accountType} app
      </button>
      <p className="status-line">{props.message}</p>
    </form>
  );
}

type StudentView = "tonight" | "crew" | "plans" | "profile";
type StudentFlow = "tonight" | "details" | "create" | "invite" | "commit" | "checkin" | "report" | "history";

function StudentApp({ auth, onSignOut }: { auth: AuthState; onSignOut: () => void }) {
  const [events, setEvents] = useState<LiveEvent[]>([]);
  const [history, setHistory] = useState<AttendanceRow[]>([]);
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);
  const [selectedMockVenue, setSelectedMockVenue] = useState<Venue | null>(null);
  const [view, setView] = useState<StudentView>("tonight");
  const [flow, setFlow] = useState<StudentFlow>("tonight");
  const [invitedCrew, setInvitedCrew] = useState(["Maya", "Dev"]);
  const [arrivalWindow, setArrivalWindow] = useState(ARRIVAL_WINDOW);
  const [conditionNote, setConditionNote] = useState("Line moving steadily; cover matched listing.");
  const [studentStatus, setStudentStatus] = useState("Loading your saved Pull Up plans...");
  const [busyAction, setBusyAction] = useState<string | null>(null);

  const selectedEvent = events.find((event) => event.id === selectedEventId) ?? events[0] ?? null;
  const featuredVenue = venues[0];
  const activeVenue = selectedMockVenue ?? featuredVenue;
  const selectedName = activeVenue.name;
  const canPersist = !auth.isDemo && Boolean(selectedEvent);
  const latestStatus = history.find((item) => item.event_id === selectedEvent?.id)?.status ?? history[0]?.status ?? "none";
  const headerTitle =
    view === "profile" ? auth.displayName :
    view === "plans" ? "Plan history" :
    flow === "details" ? selectedName :
    flow === "create" ? "Create plan" :
    flow === "invite" ? "Invite crew" :
    flow === "commit" ? "Commit time" :
    flow === "checkin" ? "Check in" :
    flow === "report" ? "Report conditions" :
    "Tonight";

  useEffect(() => {
    let cancelled = false;
    async function loadStudentData() {
      if (auth.isDemo) {
        setStudentStatus("Prototype night · sample activity");
        return;
      }
      try {
        const [eventsResult, historyResult] = await Promise.all([
          apiRequest<{ events: LiveEvent[] }>(auth.accessToken, "/api/supabase/events"),
          apiRequest<{ attendances: AttendanceRow[] }>(auth.accessToken, "/api/supabase/attendance"),
        ]);
        if (cancelled) return;
        const liveEvents = eventsResult.events.filter((event) => ["approved", "live", "ended"].includes(event.status));
        setEvents(liveEvents);
        setHistory(historyResult.attendances);
        setSelectedEventId(liveEvents[0]?.id ?? null);
        setStudentStatus(liveEvents.length > 0 ? "Prototype night · sample activity" : "Prototype night · sample activity");
      } catch {
        if (!cancelled) setStudentStatus("Could not load your persisted plans. Try signing out and back in.");
      }
    }
    loadStudentData();
    return () => {
      cancelled = true;
    };
  }, [auth.accessToken, auth.isDemo]);

  async function refreshHistory() {
    if (auth.isDemo) return;
    const result = await apiRequest<{ attendances: AttendanceRow[] }>(auth.accessToken, "/api/supabase/attendance");
    setHistory(result.attendances);
  }

  async function persistAttendance(action: string, status: "interested" | "going" | "arrived", nextFlow: StudentFlow, eventOverride?: LiveEvent) {
    const targetEvent = eventOverride ?? selectedEvent;
    if (auth.isDemo || !targetEvent) {
      setStudentStatus("Sign in with a student account to save this plan for tonight.");
      return;
    }
    setBusyAction(action);
    setStudentStatus(`${action}...`);
    try {
      await apiRequest(auth.accessToken, "/api/supabase/attendance", {
        method: "POST",
        body: JSON.stringify({
          eventId: targetEvent.id,
          status,
          visibility: "friends",
          arrivalWindow,
        }),
      });
      await refreshHistory();
      setFlow(nextFlow);
      setView(nextFlow === "history" ? "plans" : nextFlow === "invite" || nextFlow === "commit" ? "crew" : "tonight");
      setStudentStatus(`${action} saved for ${targetEvent.title}.`);
    } catch {
      setStudentStatus(`${action} failed. Your session may be expired or this event may no longer be available.`);
    } finally {
      setBusyAction(null);
    }
  }

  async function reportConditions() {
    if (auth.isDemo || !selectedEvent) {
      setStudentStatus("Sign in with a student account to report conditions for tonight.");
      return;
    }
    setBusyAction("Report conditions");
    setStudentStatus("Sending condition report...");
    try {
      await apiRequest(auth.accessToken, "/api/supabase/conditions", {
        method: "POST",
        body: JSON.stringify({
          eventId: selectedEvent.id,
          lineState: "moving",
          cover: selectedEvent.cover,
          note: conditionNote,
        }),
      });
      await refreshHistory();
      setFlow("history");
      setView("plans");
      setStudentStatus("Condition report saved without sharing a live location trail.");
    } catch {
      setStudentStatus("Condition report failed. Try again after refreshing your session.");
    } finally {
      setBusyAction(null);
    }
  }

  function openMockVenue(venue: Venue) {
    setSelectedMockVenue(venue);
    setFlow("details");
    setView("tonight");
    setStudentStatus("Prototype night · sample activity");
  }

  function goToView(nextView: StudentView) {
    setView(nextView);
    if (nextView === "tonight") setFlow("tonight");
    if (nextView === "crew") setFlow(flow === "invite" || flow === "commit" ? flow : "invite");
    if (nextView === "plans") setFlow("history");
    if (nextView === "profile") setFlow("history");
  }

  return (
    <section className="student-shell student-shell-night" data-view={view}>
      <header className="student-shell-header night-header">
        <div>
          <p>{view === "tonight" ? "Friday night" : view === "crew" ? "Crew" : view === "plans" ? "Plans" : "Profile"}</p>
          <h1>{headerTitle}</h1>
        </div>
        <span className="prototype-chip">Prototype night · sample activity</span>
      </header>

      <div className="student-shell-content">
        {view === "tonight" && flow === "tonight" && (
          <section className="tonight-stage">
            <div className="tonight-main">
              <div className="move-hero">
                <div className="move-hero-top">
                  <div>
                    <span className="night-kicker">What&apos;s the move?</span>
                    <h2>Joe&apos;s</h2>
                  </div>
                  <div className="momentum-orbit" aria-label="Building fast momentum">
                    <i /><i /><i />
                  </div>
                </div>
                <div className="move-state">
                  <span>Building fast</span>
                  <strong>Go before 10:45</strong>
                </div>
                <div className="friend-pulse">
                  <div className="avatar-stack" aria-label="Friends leaning here">
                    {["SP", "MK", "DR", "+1"].map((friend) => <span key={friend}>{friend}</span>)}
                  </div>
                  <div>
                    <b>4 friends leaning here</b>
                    <small>Sarah&apos;s crew is warming up the plan</small>
                  </div>
                </div>
                <div className="signal-split">
                  <span><b>Strong signal</b><small>High confidence</small></span>
                  <span><b>Updated 4 min ago</b><small>Fresh enough to act</small></span>
                  <span><b>$5 cover · 19+</b><small>8 min walk</small></span>
                </div>
                <div className="hero-action-row">
                  <button className="full-button" onClick={() => openMockVenue(featuredVenue)}>See the move</button>
                  <button className="secondary-button" disabled={!canPersist} onClick={() => { setSelectedMockVenue(featuredVenue); setFlow("create"); }}>Start a plan</button>
                </div>
              </div>

              <div className="venue-lane" aria-label="Other campus options">
                {venues.slice(1).map((venue) => (
                  <button className={`venue-strip momentum-${venue.momentum}`} key={venue.name} onClick={() => openMockVenue(venue)}>
                    <span className="signal-dot" />
                    <div>
                      <strong>{venue.name}</strong>
                      <small>{venue.momentum === "steady" ? "Steady" : venue.momentum === "quiet" ? "Quiet right now" : "No reliable call yet"}</small>
                    </div>
                    <em>{venue.arrivalWindow}</em>
                  </button>
                ))}
              </div>
            </div>

            <aside className="tonight-side">
              <div className="crew-card lively">
                <span className="night-kicker">Crew activity</span>
                <div className="friend-pulse">
                  <div className="avatar-stack">{["SP", "MK", "DR"].map((friend) => <span key={friend}>{friend}</span>)}</div>
                  <div><b>Maya and Dev saved Joe&apos;s</b><small>Arjun is watching KAMS</small></div>
                </div>
                <div className="mini-meter"><i style={{ width: "82%" }} /></div>
              </div>
              <div className="crew-card">
                <span className="night-kicker">Tonight&apos;s plan</span>
                <strong>{history[0] ? "Joe's is in your history" : "No plan locked yet"}</strong>
                <small>{history[0] ? `Last saved status: ${history[0].status}` : "Start with Joe's, invite the crew, then commit a time."}</small>
              </div>
              <div className="journey-mini">
                {["Discover", "Invite", "Commit", "Check in"].map((step, index) => (
                  <span key={step}><b>{index + 1}</b>{step}</span>
                ))}
              </div>
            </aside>
          </section>
        )}

        {view === "tonight" && flow === "details" && (
          <section className="single-view detail-flow expressive-view">
            <button className="text-button align-left" onClick={() => setFlow("tonight")}>Back to Tonight</button>
            <div className="venue-glow nightlife-glow">
              <span className={`state momentum-${activeVenue.momentum}`}>{momentumCopy(activeVenue.momentum)}</span>
              <h3>{selectedName}</h3>
              <p>{activeVenue.explanation}</p>
              <div className="friend-pulse"><div className="avatar-stack">{["SP", "MK", "DR", "+1"].map((friend) => <span key={friend}>{friend}</span>)}</div><b>{activeVenue.crewIntent}</b></div>
            </div>
            <div className="decision-grid">
              <span><small>Momentum</small><b>{momentumCopy(activeVenue.momentum)}</b></span>
              <span><small>Timing</small><b>{activeVenue.arrivalWindow}</b></span>
              <span><small>Confidence</small><b>{confidenceCopy(activeVenue.confidence)}</b></span>
              <span><small>Plan</small><b>{latestStatus}</b></span>
            </div>
            <div className="ops-line">{activeVenue.cover} · {activeVenue.age} · {activeVenue.walkTime}</div>
            <button className="full-button" disabled={busyAction != null || !canPersist} onClick={() => setFlow("create")}>Start a plan</button>
          </section>
        )}

        {view === "tonight" && flow === "create" && (
          <section className="single-view detail-flow expressive-view">
            <div className="plan-summary nightlife-glow">
              <span>{selectedName}</span>
              <strong>Make Joe&apos;s the move</strong>
              <small>Your crew sees the plan. Hosts only see aggregate demand.</small>
            </div>
            <button className="full-button" disabled={busyAction != null || !canPersist} onClick={() => persistAttendance("Plan", "interested", "invite")}>Join this plan</button>
          </section>
        )}

        {view === "crew" && flow === "invite" && (
          <section className="single-view detail-flow expressive-view">
            <div className="plan-summary nightlife-glow">
              <span>{selectedName}</span>
              <strong>Invite crew</strong>
              <small>Crew names stay private. Hosts never see this list.</small>
            </div>
            <div className="invite-list">
              {["Maya", "Dev", "Arjun", "Priya"].map((friend) => (
                <button className={invitedCrew.includes(friend) ? "selected" : ""} key={friend} onClick={() => setInvitedCrew((current) => current.includes(friend) ? current.filter((name) => name !== friend) : [...current, friend])}>
                  <span>{friend[0]}</span><b>{friend}</b><i>{invitedCrew.includes(friend) ? "Added" : "Add"}</i>
                </button>
              ))}
            </div>
            <button className="full-button" onClick={() => setFlow("commit")}>Continue to arrival time</button>
          </section>
        )}

        {view === "crew" && flow === "commit" && (
          <section className="single-view detail-flow expressive-view">
            <div className="plan-summary nightlife-glow">
              <span>{selectedName}</span>
              <strong>Commit time</strong>
              <small>{invitedCrew.length} crew member{invitedCrew.length === 1 ? "" : "s"} invited</small>
            </div>
            <div className="arrival-options no-scroll">
              {["10:15-10:30", "10:30-10:45", "10:45-11:00"].map((time) => (
                <button className={arrivalWindow === time ? "selected" : ""} key={time} onClick={() => setArrivalWindow(time)}>{time}</button>
              ))}
            </div>
            <button className="full-button" disabled={busyAction != null || !canPersist} onClick={() => persistAttendance("Arrival time", "going", "checkin")}>Commit arrival time</button>
          </section>
        )}

        {view === "tonight" && flow === "checkin" && (
          <section className="single-view arrival-screen expressive-view">
            <div className="arrival-orbit"><span>✓</span></div>
            <h3>At {selectedName}?</h3>
            <p>Check in to update your plan and add a verified arrival signal.</p>
            <button className="full-button" disabled={busyAction != null || !canPersist} onClick={() => persistAttendance("Check-in", "arrived", "report")}>Check in</button>
          </section>
        )}

        {view === "tonight" && flow === "report" && (
          <section className="single-view detail-flow expressive-view">
            <div className="plan-summary nightlife-glow">
              <span>{selectedName}</span>
              <strong>Report conditions</strong>
              <small>This report is reviewable and does not expose a live location trail.</small>
            </div>
            <label className="form-field">Condition note<input value={conditionNote} onChange={(event) => setConditionNote(event.target.value)} /></label>
            <button className="full-button" disabled={busyAction != null || !canPersist} onClick={reportConditions}>Submit condition report</button>
          </section>
        )}

        {view === "plans" && (
          <section className="single-view detail-flow expressive-view">
            <div className="plan-summary live-plan nightlife-glow">
              <span>{selectedName}</span>
              <strong>Plan history</strong>
              <small>{studentStatus}</small>
            </div>
            <div className="settings-list">
              {history.length > 0 ? history.map((item) => (
                <span key={item.id}><b>{item.status}</b>{item.events?.title ?? item.event_id}</span>
              )) : <span><b>No persisted plans yet</b> Join a live event to create one.</span>}
            </div>
          </section>
        )}

        {view === "profile" && (
          <section className="single-view detail-flow expressive-view">
            <div className="profile-top">
              <div className="avatar">{auth.displayName.split(" ").map((part) => part[0]).join("").slice(0, 2)}</div>
              <div><strong>{auth.displayName}</strong><small>{auth.email}</small></div>
            </div>
            <div className="settings-list">
              <span><b>Role</b>{auth.accountType}</span>
              <span><b>Visibility</b>Friends see intent, not live trails</span>
              <span><b>Plan history</b>{history.length} persisted item{history.length === 1 ? "" : "s"}</span>
              <span><b>Safety</b>Blocked users and report controls</span>
            </div>
            {auth.canHostUnofficial && <button className="full-button">Create unofficial party</button>}
            <button className="secondary-button account-signout" onClick={onSignOut}>Sign out</button>
            <p className="prototype-footnote">Sample activity is fictional UIUC prototype content. Saved plans, check-ins, and reports still use the connected Supabase backend.</p>
          </section>
        )}
      </div>

      <p className="student-inline-status">{busyAction ? `${busyAction}...` : studentStatus}</p>
      <nav className="student-bottom-nav" aria-label="Student views">
        {(["tonight", "crew", "plans", "profile"] as StudentView[]).map((item) => (
          <button className={view === item ? "active" : ""} key={item} onClick={() => goToView(item)}>
            <span>{item === "tonight" ? "⌂" : item === "crew" ? "◎" : item === "plans" ? "◫" : "◯"}</span>
            {item.charAt(0).toUpperCase() + item.slice(1)}
          </button>
        ))}
      </nav>
    </section>
  );
}

function TonightFeed({
  publicPreview = false,
  events = [],
  persistedEnabled = false,
  selectedEventId = null,
  onSelectEvent,
  onVenueAction,
  onPersistAction,
}: {
  publicPreview?: boolean;
  events?: LiveEvent[];
  persistedEnabled?: boolean;
  selectedEventId?: string | null;
  onSelectEvent?: (eventId: string) => void;
  onVenueAction: (action: string, venueName: string) => void;
  onPersistAction?: (eventId: string) => void;
}) {
  return (
    <>
      <div className="search-pill">Champaign campus • Friday 9:15 PM</div>
      {events.length > 0 && (
        <div className="feed-list">
          {events.map((event) => (
            <LiveEventCard
              key={event.id}
              event={event}
              selected={event.id === selectedEventId}
              onSelect={() => onSelectEvent?.(event.id)}
              onJoin={() => onPersistAction?.(event.id)}
            />
          ))}
        </div>
      )}
      <div className="feed-list">
        {venues.map((venue) => (
          <VenueCard
            key={venue.name}
            venue={venue}
            publicPreview={publicPreview}
            persistedEnabled={persistedEnabled}
            onVenueAction={onVenueAction}
          />
        ))}
      </div>
    </>
  );
}

function VenueCard({
  venue,
  publicPreview,
  persistedEnabled,
  onVenueAction,
}: {
  venue: Venue;
  publicPreview: boolean;
  persistedEnabled: boolean;
  onVenueAction: (action: string, venueName: string) => void;
}) {
  return (
    <article className={`venue-card momentum-${venue.momentum}`}>
      <div className="venue-main">
        <div>
          <strong>{venue.name}</strong>
          <small>{venue.type} • {venue.walkTime}</small>
        </div>
        <span className={`state momentum-${venue.momentum}`}>{momentumCopy(venue.momentum)}</span>
      </div>
      <p>{venue.explanation}</p>
      <div className="arrival-row">
        <b>{venue.arrivalWindow}</b>
        <span>{venue.updated}</span>
      </div>
      <div className="intent-line">
        <span>{publicPreview ? "Friend context hidden until sign-in" : venue.crewIntent}</span>
        <span>{venue.campusIntent}</span>
      </div>
      <div className="meta-row">
        <span>{confidenceCopy(venue.confidence)}</span>
        <span>{venue.cover}</span>
        <span>{venue.line}</span>
        <span>{venue.age}</span>
      </div>
      <div className="evidence-list">
        {venue.evidence.map((item) => <span key={item}>{item}</span>)}
      </div>
      <button className="full-button" onClick={() => onVenueAction(venue.action, venue.name)}>{persistedEnabled ? venue.action : `${venue.action} (preview)`}</button>
    </article>
  );
}

function LiveEventCard({
  event,
  selected,
  onSelect,
  onJoin,
}: {
  event: LiveEvent;
  selected: boolean;
  onSelect: () => void;
  onJoin: () => void;
}) {
  return (
    <article className={`venue-card live-event-card ${selected ? "selected-event" : ""}`}>
      <div className="venue-main">
        <div>
          <strong>{event.title}</strong>
          <small>{event.event_type.replace("_", " ")} • {new Date(event.starts_at).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}</small>
        </div>
        <span className="state momentum-rising">Live</span>
      </div>
      <p>Persisted Supabase event. Actions on this card write to your account.</p>
      <div className="meta-row">
        <span>{event.cover}</span>
        <span>{event.age_rule}</span>
        <span>{event.status}</span>
      </div>
      <div className="button-row">
        <button onClick={onSelect}>Select</button>
        <button onClick={onJoin}>Join</button>
      </div>
    </article>
  );
}

function HostApp({ auth }: { auth: AuthState }) {
  const unofficial = auth.accountType === "student";
  return (
    <section className="mobile-product host-app">
      <PhoneFrame audience="Host" title={unofficial ? "Unofficial party" : "Tonight's event"} tabs={["Event", "Facts", "Status"]}>
        <div className="host-hero">
          <p>{unofficial ? "Student-hosted" : "Official venue listing"}</p>
          <h4>{unofficial ? "Apartment pregame" : "Friday Night at Joe's"}</h4>
          <span className="state momentum-rising">Submitted for review</span>
        </div>
        <div className="settings-list">
          <span><b>Listing status</b> Awaiting Pull Up review</span>
          <span><b>Host facts</b> Cover, timing, entry rules, specials</span>
          <span><b>Allowed view</b> Aggregate demand only</span>
          <span><b>Not allowed</b> Directly setting momentum</span>
        </div>
      </PhoneFrame>
      <PhoneFrame audience="Host" title="Submit event" tabs={["Draft", "Preview", "Submit"]}>
        <div className="form-stack">
          <label>Event name<input defaultValue="Friday Night at Joe's" /></label>
          <label>Host type<select defaultValue={unofficial ? "house" : "bar"}><option value="bar">bar</option><option value="frat">frat</option><option value="pub">pub</option><option value="house">house party</option></select></label>
          <label>Cover<input defaultValue="$5 after 10:30" /></label>
          <label>Age rule<input defaultValue="19+" /></label>
          <label>Entry note<input defaultValue="IDs checked at door" /></label>
        </div>
        <button className="full-button">Submit to Pull Up review</button>
      </PhoneFrame>
      <PhoneFrame audience="Host" title="Live facts" tabs={["Line", "Capacity", "Send"]}>
        <div className="report-stack">
          <button className="selected">Moving steadily</button>
          <button>Building fast</button>
          <button>Quiet</button>
          <button>At capacity</button>
        </div>
        <div className="slider-card"><span>Capacity pressure</span><b>78%</b><div><i style={{ width: "78%" }} /></div></div>
        <div className="privacy-note">Reports are attributable and reviewable. They inform evidence but never directly set ranking.</div>
        <button className="full-button">Send factual update</button>
      </PhoneFrame>
    </section>
  );
}

function AdminApp() {
  return (
    <section className="admin-app">
      <section className="admin-panel">
        <div className="admin-heading"><p className="eyebrow">Queue</p><h3>Needs a decision</h3></div>
        {adminQueue.map((item) => (
          <div className="admin-row" key={item.title}>
            <div><strong>{item.title}</strong><small>{item.venue} • {item.detail}</small></div>
            <span className={`risk ${item.risk}`}>{riskCopy(item.risk)}</span>
          </div>
        ))}
      </section>
      <section className="admin-panel review-large">
        <div className="admin-heading"><p className="eyebrow">Evidence replay</p><h3>The Red Lion</h3></div>
        <div className="review-grid">
          <span><b>No call</b> student-facing state</span>
          <span><b>Low</b> signal confidence</span>
          <span><b>31m</b> report age</span>
          <span><b>High</b> manipulation risk</span>
        </div>
        <div className="ledger">
          <span>Host report <b>line building</b></span>
          <span>Verified arrivals <b>too sparse</b></span>
          <span>Ambassador report <b>missing</b></span>
          <span>Decision effect <b>keep abstained</b></span>
        </div>
        <div className="button-row"><button>Keep abstained</button><button>Downweight host report</button></div>
      </section>
      <section className="admin-panel">
        <div className="admin-heading"><p className="eyebrow">Source pattern</p><h3>Reporter reliability</h3></div>
        <div className="backend-map">
          <span>Host facts accepted when they match independent evidence.</span>
          <span>Repeated overstatements lower future report weight.</span>
          <span>Approved changes can be replayed before students see them.</span>
          <span>Weak evidence publishes as no reliable call.</span>
        </div>
      </section>
    </section>
  );
}

function SectionIntro({ label, title, body }: { label: string; title: string; body: string }) {
  return (
    <div className="surface-copy">
      <p className="eyebrow">{label}</p>
      <h2>{title}</h2>
      <p>{body}</p>
    </div>
  );
}

function AppHeader({ auth, onSignOut }: { auth: AuthState; onSignOut: () => void }) {
  return (
    <header className="top-bar">
      {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
      <a className="brand" href="/">Pull Up</a>
      <div>
        <span>{auth.displayName}</span>
        <small>{auth.accountType}{auth.isDemo ? " demo" : ""}</small>
      </div>
      <button onClick={onSignOut}>Sign out</button>
    </header>
  );
}

function PhoneFrame({
  audience,
  title,
  children,
  tabs,
}: {
  audience: string;
  title: string;
  children: React.ReactNode;
  tabs: string[];
}) {
  return (
    <article className="phone-frame">
      <div className="phone-notch" />
      <header className="phone-header">
        <div><p>{audience}</p><h3>{title}</h3></div>
        <span>UIUC</span>
      </header>
      <div className="phone-content">{children}</div>
      <nav className="phone-tabs" aria-label={`${audience} tabs`}>
        {tabs.map((tab, index) => <span className={index === 0 ? "active" : ""} key={tab}>{tab}</span>)}
      </nav>
    </article>
  );
}
