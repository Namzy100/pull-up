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

const STORAGE_KEY = "pull-up-session";

export default function PullUpClientApp({ requiredRole }: { requiredRole?: AccountType }) {
  const [auth, setAuth] = useState<AuthState | null>(null);
  const [email, setEmail] = useState("sarah@illinois.edu");
  const [password, setPassword] = useState("pullup-demo-pass");
  const [accountType, setAccountType] = useState<AccountType>("student");
  const [message, setMessage] = useState("Preview tonight without signing in. Join a plan when you are ready.");
  const [loading, setLoading] = useState(false);
  const [planState, setPlanState] = useState("No plan joined yet.");

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
      const result = (await response.json()) as { access_token?: string; error_description?: string; msg?: string };
      if (!response.ok || !result.access_token) {
        throw new Error(result.error_description ?? result.msg ?? "Supabase rejected this sign-in.");
      }

      let profileResponse = await fetch("/api/supabase/profile", {
        headers: { authorization: `Bearer ${result.access_token}` },
      });
      if (mode === "signup" && profileResponse.ok) {
        const existing = (await profileResponse.clone().json()) as { profiles?: unknown[] };
        if (!existing.profiles?.length) {
          profileResponse = await fetch("/api/supabase/profile", {
            method: "POST",
            headers: {
              authorization: `Bearer ${result.access_token}`,
              "content-type": "application/json",
            },
            body: JSON.stringify({
              displayName: email.split("@")[0].replace(/[._-]/g, " "),
              campusId: "uiuc",
              classYear: "2027",
            }),
          });
        }
      }
      if (!profileResponse.ok) {
        throw new Error("Signed in, but no Pull Up profile exists for this account yet.");
      }
      const profileResult = (await profileResponse.json()) as { profile?: {
        account_type: AccountType;
        can_host_unofficial: boolean;
        display_name: string;
        email: string;
      }; profiles?: Array<{
        account_type: AccountType;
        can_host_unofficial: boolean;
        display_name: string;
        email: string;
      }> };
      const profile = profileResult.profile ?? profileResult.profiles?.[0];
      if (!profile) throw new Error("Signed in, but no Pull Up profile exists for this account yet.");
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
    setPlanState(`${action} saved for ${venueName}. Demo only until Supabase is configured.`);
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
      {auth && activeRole === "student" && <StudentApp auth={auth} planState={planState} />}
      {auth && activeRole === "host" && <HostApp auth={auth} />}
      {auth && activeRole === "admin" && <AdminApp />}
    </main>
  );
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
  planState,
}: {
  auth: AuthState;
  planState: string;
}) {
  type StudentTab = "tonight" | "crew" | "plans" | "profile";
  type Flow = "feed" | "venue" | "create" | "plan" | "arrive" | "report" | "complete";
  const [tab, setTab] = useState<StudentTab>("tonight");
  const [flow, setFlow] = useState<Flow>("feed");
  const [selectedVenue, setSelectedVenue] = useState<Venue>(venues[0]);
  const [arrival, setArrival] = useState("10:30–10:45");
  const [toast, setToast] = useState("");
  const [friends, setFriends] = useState(["Maya", "Dev", "Arjun"]);
  const [lineReport, setLineReport] = useState("Moderate");

  function notify(value: string) {
    setToast(value);
    window.setTimeout(() => setToast(""), 2600);
  }

  function openVenue(venue: Venue) {
    setSelectedVenue(venue);
    setFlow("venue");
  }

  function openTab(next: StudentTab) {
    setTab(next);
    setFlow(next === "tonight" ? "feed" : next === "plans" ? "plan" : "feed");
  }

  return (
    <section className="prototype-stage student-app">
      <div className="prototype-notes">
        <p className="eyebrow">Interactive prototype</p>
        <h1>Friday night, start to finish.</h1>
        <p>Every primary action works in demo mode. The same states map to the Supabase plan, member, attendance, and report architecture.</p>
        <div className="prototype-progress">
          {["Discover", "Coordinate", "Commit", "Arrive", "Verify"].map((item, index) => (
            <span className={["feed", "venue", "create", "plan", "arrive", "report", "complete"].indexOf(flow) >= index ? "done" : ""} key={item}>
              <b>{index + 1}</b>{item}
            </span>
          ))}
        </div>
      </div>
      <article className="app-phone">
        <div className="phone-notch" />
        <header className="native-header">
          <div>
            <p>{tab === "tonight" ? "UIUC · Friday" : "Pull Up"}</p>
            <h2>{flow === "feed" ? "Tonight" : flow === "venue" ? selectedVenue.name : flow === "create" ? "Start a plan" : flow === "arrive" ? "You made it" : flow === "report" ? "What’s it like?" : flow === "complete" ? "Signal sent" : tab === "crew" ? "Your crew" : tab === "profile" ? "You" : "Crew plan"}</h2>
          </div>
          {flow !== "feed" && tab === "tonight" && <button className="icon-button" onClick={() => setFlow("feed")} aria-label="Back">←</button>}
          {flow === "feed" && <button className="avatar-mini" onClick={() => openTab("profile")}>{auth.displayName.split(" ").map((p) => p[0]).join("").slice(0, 2)}</button>}
        </header>

        <div className="native-content">
          {tab === "tonight" && flow === "feed" && (
            <>
              <div className="tonight-pulse">
                <span><i /> Campus is warming up</span>
                <b>Best movement: 10:15–11:00</b>
              </div>
              <div className="filter-row"><button className="selected">For you</button><button>Near me</button><button>No cover</button><button>21+</button></div>
              <div className="native-feed">
                {venues.map((venue) => (
                  <button className="native-venue" key={venue.name} onClick={() => openVenue(venue)}>
                    <div className="native-venue-top">
                      <span className={`pulse-dot momentum-${venue.momentum}`} />
                      <div><strong>{venue.name}</strong><small>{venue.walkTime} · {venue.age}</small></div>
                      <em className={`state momentum-${venue.momentum}`}>{momentumCopy(venue.momentum)}</em>
                    </div>
                    <h3>{venue.arrivalWindow}</h3>
                    <p>{venue.explanation}</p>
                    <div className="social-proof"><b>{venue.crewIntent}</b><span>{venue.updated}</span></div>
                    <div className="quick-facts"><span>{venue.cover}</span><span>{venue.line}</span><span>{confidenceCopy(venue.confidence)}</span></div>
                  </button>
                ))}
              </div>
            </>
          )}

          {tab === "tonight" && flow === "venue" && (
            <div className="detail-flow">
              <div className={`venue-glow momentum-${selectedVenue.momentum}`}>
                <span className={`state momentum-${selectedVenue.momentum}`}>{momentumCopy(selectedVenue.momentum)}</span>
                <h3>{selectedVenue.arrivalWindow}</h3>
                <p>{selectedVenue.explanation}</p>
              </div>
              <div className="friend-stack"><span>SP</span><span>MK</span><span>DR</span><span>+1</span><b>{selectedVenue.crewIntent}</b></div>
              <div className="detail-grid">
                <span><small>Walk</small><b>{selectedVenue.walkTime}</b></span>
                <span><small>Cover</small><b>{selectedVenue.cover}</b></span>
                <span><small>Line</small><b>{selectedVenue.line}</b></span>
                <span><small>Entry</small><b>{selectedVenue.age}</b></span>
              </div>
              <section className="why-card"><strong>Why Pull Up thinks this</strong>{selectedVenue.evidence.map((item) => <span key={item}>✓ {item}</span>)}<small>{confidenceCopy(selectedVenue.confidence)} · {selectedVenue.updated}</small></section>
              <button className="full-button" onClick={() => setFlow("create")}>{selectedVenue.momentum === "no-reliable-call" ? "Watch for a cleaner call" : "Make this the move"}</button>
            </div>
          )}

          {tab === "tonight" && flow === "create" && (
            <div className="detail-flow">
              <div className="plan-summary"><span>{selectedVenue.name}</span><strong>{selectedVenue.arrivalWindow}</strong><small>{selectedVenue.cover} · {selectedVenue.line}</small></div>
              <label className="choice-label">When should the crew arrive?</label>
              <div className="arrival-options">{["10:15–10:30", "10:30–10:45", "10:45–11:00"].map((time) => <button className={arrival === time ? "selected" : ""} onClick={() => setArrival(time)} key={time}>{time}</button>)}</div>
              <label className="choice-label">Invite your crew</label>
              <div className="invite-list">{["Maya", "Dev", "Arjun", "Priya"].map((friend) => <button className={friends.includes(friend) ? "selected" : ""} onClick={() => setFriends((current) => current.includes(friend) ? current.filter((name) => name !== friend) : [...current, friend])} key={friend}><span>{friend[0]}</span><b>{friend}</b><i>{friends.includes(friend) ? "✓" : "+"}</i></button>)}</div>
              <div className="privacy-note">Only invited friends see names and intent. Venues receive aggregate demand, never your crew list or live location.</div>
              <button className="full-button" onClick={() => { setTab("plans"); setFlow("plan"); notify("Plan created — 3 friends invited"); }}>Create plan</button>
            </div>
          )}

          {tab === "plans" && flow === "plan" && (
            <div className="detail-flow">
              <div className="plan-hero live-plan"><span>Tonight · {selectedVenue.name}</span><h4>{arrival}</h4><p>Leave in 42 minutes to hit the best window.</p></div>
              <div className="crew-list">
                <span><b>Sarah</b><em>Going</em></span>
                <span><b>Maya</b><em>Going · 10:30</em></span>
                <span><b>Dev</b><em>Needs 10 min</em></span>
                <span><b>Arjun</b><em>Waiting on cover</em></span>
              </div>
              <div className="plan-actions"><button onClick={() => { navigator.clipboard?.writeText("https://pullup.app/p/demo"); notify("Private invite link copied"); }}>Invite more</button><button onClick={() => notify("Crew nudged — no location shared")}>Nudge crew</button></div>
              <button className="full-button" onClick={() => setFlow("arrive")}>I’m here</button>
              <button className="text-button" onClick={() => { setTab("tonight"); setFlow("feed"); }}>Change the move</button>
              <p className="status-line">{planState}</p>
            </div>
          )}

          {tab === "plans" && flow === "arrive" && (
            <div className="arrival-screen">
              <div className="arrival-orbit"><span>✓</span></div>
              <h3>Checked in at {selectedVenue.name}</h3>
              <p>Your arrival is private. Pull Up only adds it to the verified aggregate.</p>
              <button className="full-button" onClick={() => setFlow("report")}>Share a 10-second update</button>
              <button className="text-button" onClick={() => setFlow("complete")}>Not now</button>
            </div>
          )}

          {tab === "plans" && flow === "report" && (
            <div className="detail-flow">
              <p className="report-question">How’s the line?</p>
              <div className="report-options">{["None", "Short", "Moderate", "Long"].map((item) => <button className={lineReport === item ? "selected" : ""} onClick={() => setLineReport(item)} key={item}>{item}</button>)}</div>
              <p className="report-question">How does it feel inside?</p>
              <div className="vibe-meter"><button>Quiet</button><button className="selected">Filling up</button><button>Busy</button><button>Packed</button></div>
              <label className="form-field">Cover right now<input defaultValue="$5" /></label>
              <button className="full-button" onClick={() => setFlow("complete")}>Send verified update</button>
            </div>
          )}

          {tab === "plans" && flow === "complete" && (
            <div className="arrival-screen complete-screen">
              <div className="arrival-orbit"><span>↑</span></div>
              <h3>You made tonight clearer.</h3>
              <p>Your {lineReport.toLowerCase()} line report joins other evidence for one hour. It never changes momentum by itself.</p>
              <div className="impact-card"><small>Signal confidence</small><strong>High</strong><span>42 → 43 verified arrivals</span></div>
              <button className="full-button" onClick={() => { setTab("tonight"); setFlow("feed"); }}>Back to Tonight</button>
            </div>
          )}

          {tab === "crew" && (
            <div className="detail-flow">
              <div className="crew-identity"><div className="avatar">QN</div><div><strong>Quad Night</strong><small>5 friends · Friday regulars</small></div></div>
              <div className="crew-list">{["Sarah · You", "Maya · Going out", "Dev · Free after 10", "Arjun · Watching Joe’s", "Priya · Undecided"].map((item) => <span key={item}><b>{item.split(" · ")[0]}</b><em>{item.split(" · ")[1]}</em></span>)}</div>
              <button className="full-button" onClick={() => notify("Private invite link copied")}>Invite to crew</button>
              <section className="why-card"><strong>Built for coordination, not tracking</strong><span>Friends see what you choose to share.</span><span>No background location trails.</span><span>Leave or mute a crew anytime.</span></section>
            </div>
          )}

          {tab === "profile" && (
            <div className="detail-flow">
              <div className="profile-top"><div className="avatar">{auth.displayName.split(" ").map((part) => part[0]).join("").slice(0, 2)}</div><div><strong>{auth.displayName}</strong><small>{auth.email}</small></div></div>
              <div className="settings-list">
                <button><b>Night preferences</b><span>Live energy · low cover · walkable</span><i>›</i></button>
                <button><b>Intent visibility</b><span>Friends only</span><i>›</i></button>
                <button><b>Location</b><span>Ask each time</span><i>›</i></button>
                <button><b>Notifications</b><span>Plan changes · momentum shifts</span><i>›</i></button>
                <button><b>Safety & blocks</b><span>Manage controls</span><i>›</i></button>
              </div>
              {auth.canHostUnofficial && <a className="full-button" href="/host">Create unofficial party</a>}
            </div>
          )}
        </div>

        <nav className="native-tabs" aria-label="Student navigation">
          {([["tonight", "⌁", "Tonight"], ["crew", "◎", "Crew"], ["plans", "◇", "Plans"], ["profile", "○", "You"]] as const).map(([value, icon, label]) => <button className={tab === value ? "active" : ""} onClick={() => openTab(value)} key={value}><i>{icon}</i><span>{label}</span></button>)}
        </nav>
        {toast && <div className="toast">{toast}</div>}
      </article>
    </section>
  );
}

function TonightFeed({
  publicPreview = false,
  onVenueAction,
}: {
  publicPreview?: boolean;
  onVenueAction: (action: string, venueName: string) => void;
}) {
  return (
    <>
      <div className="search-pill">Champaign campus • Friday 9:15 PM</div>
      <div className="feed-list">
        {venues.map((venue) => (
          <VenueCard
            key={venue.name}
            venue={venue}
            publicPreview={publicPreview}
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
  onVenueAction,
}: {
  venue: Venue;
  publicPreview: boolean;
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
      <button className="full-button" onClick={() => onVenueAction(venue.action, venue.name)}>{venue.action}</button>
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
