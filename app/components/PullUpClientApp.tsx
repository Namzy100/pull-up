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
      {auth && <AppHeader auth={auth} onSignOut={signOut} />}
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
      {auth && activeRole === "student" && <StudentApp auth={auth} onVenueAction={requireAction} />}
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

function StudentApp({
  auth,
  onVenueAction,
}: {
  auth: AuthState;
  onVenueAction: (action: string, venueName: string) => void;
}) {
  const [events, setEvents] = useState<LiveEvent[]>([]);
  const [history, setHistory] = useState<AttendanceRow[]>([]);
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);
  const [studentStatus, setStudentStatus] = useState("Loading your saved Pull Up plans...");
  const [busyAction, setBusyAction] = useState<string | null>(null);

  const selectedEvent = events.find((event) => event.id === selectedEventId) ?? events[0] ?? null;
  const selectedVenueName = selectedEvent?.title ?? "tonight";
  const persistedEnabled = !auth.isDemo && Boolean(selectedEvent);

  useEffect(() => {
    let cancelled = false;
    async function loadStudentData() {
      if (auth.isDemo) {
        setStudentStatus("Demo account: visible actions are labeled demo-only until you sign in with Supabase.");
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
        setStudentStatus(liveEvents.length > 0 ? "Live Supabase events loaded." : "No live events yet. Public preview cards are demo-only until hosts/admins publish events.");
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

  async function runStudentAction(action: string, status: "interested" | "going" | "arrived", eventOverride?: LiveEvent) {
    const targetEvent = eventOverride ?? selectedEvent;
    if (auth.isDemo || !targetEvent) {
      onVenueAction(action, selectedVenueName);
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
          arrivalWindow: ARRIVAL_WINDOW,
        }),
      });
      await refreshHistory();
      setStudentStatus(`${action} persisted for ${targetEvent.title}.`);
    } catch {
      setStudentStatus(`${action} failed. Your session may be expired or this event may no longer be available.`);
    } finally {
      setBusyAction(null);
    }
  }

  async function reportConditions() {
    if (auth.isDemo || !selectedEvent) {
      onVenueAction("Condition report", selectedVenueName);
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
          note: "Line moving steadily; cover matched listing.",
        }),
      });
      setStudentStatus("Condition report persisted without sharing a live location trail.");
    } catch {
      setStudentStatus("Condition report failed. Try again after refreshing your session.");
    } finally {
      setBusyAction(null);
    }
  }

  return (
    <section className="mobile-product student-app">
      <PhoneFrame audience="Student" title="Tonight" tabs={["Tonight", "Crew", "Plans"]}>
        <TonightFeed
          events={events}
          persistedEnabled={persistedEnabled}
          selectedEventId={selectedEventId}
          onSelectEvent={setSelectedEventId}
          onVenueAction={onVenueAction}
          onPersistAction={(eventId) => {
            const targetEvent = events.find((event) => event.id === eventId);
            setSelectedEventId(eventId);
            void runStudentAction("Join plan", "interested", targetEvent);
          }}
        />
      </PhoneFrame>
      <PhoneFrame audience="Student" title="Crew plan" tabs={["Plan", "Invite", "Arrive"]}>
        <div className="plan-hero">
          <span>{selectedVenueName}</span>
          <h4>{selectedEvent ? `Commit ${ARRIVAL_WINDOW}` : "No persisted event selected"}</h4>
          <p>{selectedEvent ? "Crew intent is saved as an attendance plan. Friends see intent; hosts only see aggregate demand." : "Live Supabase events will appear here after hosts/admins publish them."}</p>
        </div>
        <div className="crew-list">
          {[
            selectedEvent ? "Invite link ready for your crew" : "Invite unavailable until an event is selected",
            selectedEvent ? `Arrival window: ${ARRIVAL_WINDOW}` : "Arrival window not set",
            history[0] ? `Last persisted status: ${history[0].status}` : "No persisted plan history yet",
            persistedEnabled ? "Persistence: Supabase on" : "Persistence: demo-only preview",
          ].map((item) => (
            <span key={item}>{item}</span>
          ))}
        </div>
        <div className="privacy-note">
          Crew intent is private to invited friends. Hosts see only aggregate demand.
        </div>
        <div className="button-stack">
          <button className="full-button" disabled={busyAction != null || !selectedEvent} onClick={() => runStudentAction("Join plan", "interested")}>Join plan</button>
          <button className="full-button secondary-button" disabled={busyAction != null || !selectedEvent} onClick={() => runStudentAction("Commit arrival", "going")}>Commit {ARRIVAL_WINDOW}</button>
          <button className="full-button secondary-button" disabled={busyAction != null || !selectedEvent} onClick={() => runStudentAction("Check in", "arrived")}>Check in</button>
          <button className="full-button secondary-button" disabled={busyAction != null || !selectedEvent} onClick={reportConditions}>Report conditions</button>
        </div>
        <p className="status-line">{studentStatus}</p>
      </PhoneFrame>
      <PhoneFrame audience="Student" title={auth.displayName} tabs={["Profile", "Privacy", "Safety"]}>
        <div className="profile-top">
          <div className="avatar">{auth.displayName.split(" ").map((part) => part[0]).join("").slice(0, 2)}</div>
          <div><strong>{auth.displayName}</strong><small>{auth.email}</small></div>
        </div>
        <div className="settings-list">
          <span><b>Crew</b> Quad Night, Friday regulars</span>
          <span><b>Preferences</b> Bars, live music, low cover</span>
          <span><b>Visibility</b> Friends see intent, not live trails</span>
          <span><b>Notifications</b> Momentum changes and plan commits</span>
          <span><b>Plan history</b> {history.length > 0 ? `${history.length} persisted item${history.length === 1 ? "" : "s"}` : "No persisted plans yet"}</span>
          <span><b>Safety</b> Blocked users and report controls</span>
        </div>
        {auth.canHostUnofficial && <button className="full-button">Create unofficial party</button>}
      </PhoneFrame>
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
