"use client";

import { useEffect, useMemo, useState } from "react";
import {
  AccountType,
  adminQueue,
  demoProfiles,
  riskCopy,
  stateCopy,
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
  const [email, setEmail] = useState("naman@illinois.edu");
  const [password, setPassword] = useState("pullup-demo-pass");
  const [accountType, setAccountType] = useState<AccountType>("student");
  const [message, setMessage] = useState("Demo mode is available until Supabase keys are added.");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const saved = window.localStorage.getItem(STORAGE_KEY);
    if (saved) setAuth(JSON.parse(saved) as AuthState);
  }, []);

  useEffect(() => {
    if (!auth) return;
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(auth));
  }, [auth]);

  const activeRole = requiredRole ?? auth?.accountType ?? accountType;
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

      const profileResponse = await fetch("/api/supabase/profile", {
        headers: { authorization: `Bearer ${result.access_token}` },
      });
      if (!profileResponse.ok) {
        throw new Error("Signed in, but no Pull Up profile exists for this account yet.");
      }
      const profileResult = (await profileResponse.json()) as { profiles?: Array<{
        account_type: AccountType;
        can_host_unofficial: boolean;
        display_name: string;
        email: string;
      }> };
      const profile = profileResult.profiles?.[0];
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
    setMessage("Signed out. Choose a role to preview or connect Supabase for real users.");
  }

  if (!auth) {
    return (
      <main className="app-shell">
        <section className="auth-screen">
          <div className="auth-copy">
            <p className="eyebrow">Pull Up app</p>
            <h1>Sign in, then land in exactly one nightlife app.</h1>
            <p>
              Students get Tonight. Host organizations get event operations.
              Admins get review and trust controls. The backend is the boundary,
              not a tab switch.
            </p>
            <div className="door-grid">
              <Door role="student" title="Student app" body="Tonight, friends, check-ins, profile, and optional unofficial hosting." />
              <Door role="host" title="Host app" body="Frats, pubs, bars, clubs, and orgs create events and report facts." />
              <Door role="admin" title="Admin app" body="The Pull Up team reviews events, accounts, signals, and safety calls." />
            </div>
          </div>
          <form className="auth-card" onSubmit={(event) => event.preventDefault()}>
            <div>
              <p className="eyebrow">Authentication</p>
              <h2>Account door</h2>
            </div>
            <label>
              Email
              <input value={email} onChange={(event) => setEmail(event.target.value)} />
            </label>
            <label>
              Password
              <input type="password" value={password} onChange={(event) => setPassword(event.target.value)} />
            </label>
            <label>
              Demo role
              <select value={accountType} onChange={(event) => setAccountType(event.target.value as AccountType)}>
                <option value="student">Student</option>
                <option value="host">Host org</option>
                <option value="admin">Admin</option>
              </select>
            </label>
            <div className="auth-actions">
              <button type="button" onClick={() => signIn("signin")} disabled={loading}>
                Sign in
              </button>
              <button type="button" onClick={() => signIn("signup")} disabled={loading}>
                Sign up
              </button>
            </div>
            <button className="ghost-button" type="button" onClick={() => startDemo(accountType)}>
              Open demo {accountType} app
            </button>
            <p className="status-line">{message}</p>
          </form>
        </section>
      </main>
    );
  }

  if (!isAllowed) {
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
      <AppHeader auth={auth} onSignOut={signOut} />
      {activeRole === "student" && <StudentApp auth={auth} />}
      {activeRole === "host" && <HostApp auth={auth} />}
      {activeRole === "admin" && <AdminApp auth={auth} />}
    </main>
  );
}

function Door({ role, title, body }: { role: AccountType; title: string; body: string }) {
  return (
    <a className={`door-card ${role}`} href={`/${role}`}>
      <strong>{title}</strong>
      <span>{body}</span>
    </a>
  );
}

function AppHeader({ auth, onSignOut }: { auth: AuthState; onSignOut: () => void }) {
  return (
    <header className="top-bar">
      <a className="brand" href="/">Pull Up</a>
      <div>
        <span>{auth.displayName}</span>
        <small>{auth.accountType}{auth.isDemo ? " demo" : ""}</small>
      </div>
      <button onClick={onSignOut}>Sign out</button>
    </header>
  );
}

function StudentApp({ auth }: { auth: AuthState }) {
  return (
    <section className="mobile-product student-app">
      <PhoneFrame audience="Student" title="Tonight" tabs={["Tonight", "Friends", "Profile"]}>
        <div className="search-pill">Near campus • live now</div>
        <div className="feed-list">
          {venues.map((venue, index) => (
            <div className="venue-card" key={venue.name}>
              <span className="rank">{index + 1}</span>
              <div>
                <strong>{venue.name}</strong>
                <small>{venue.distance} • {venue.cover} • {venue.age}</small>
                <span className={`state ${venue.state}`}>{stateCopy(venue.state)}</span>
              </div>
              <b>{venue.confidence}</b>
            </div>
          ))}
        </div>
      </PhoneFrame>
      <PhoneFrame audience="Student" title="Joes Brewery" tabs={["Evidence", "Friends", "Go"]}>
        <div className="big-score"><span>86</span><small>confidence</small></div>
        <div className="detail-block">
          <strong>Recommendation: go now with your crew.</strong>
          <p>AI weighs your saved bars, friends already moving, cover, and verified check-ins.</p>
        </div>
        <div className="button-row">
          <button>Going</button>
          <button>Check in</button>
        </div>
      </PhoneFrame>
      <PhoneFrame audience="Student" title={auth.displayName} tabs={["Profile", "Plans", "Crew"]}>
        <div className="profile-top">
          <div className="avatar">{auth.displayName.split(" ").map((part) => part[0]).join("").slice(0, 2)}</div>
          <div><strong>{auth.displayName}</strong><small>{auth.email}</small></div>
        </div>
        <div className="profile-grid">
          <span><b>12</b> nights out</span>
          <span><b>8</b> trusted signals</span>
          <span><b>5</b> crews</span>
          <span><b>0</b> host trails</span>
        </div>
        {auth.canHostUnofficial && <button className="full-button">Create unofficial party</button>}
      </PhoneFrame>
    </section>
  );
}

function HostApp({ auth }: { auth: AuthState }) {
  return (
    <section className="mobile-product host-app">
      <PhoneFrame audience="Host" title={auth.accountType === "student" ? "Unofficial party" : "Joes ops"} tabs={["Home", "Events", "Reports"]}>
        <div className="host-hero">
          <p>Tonight event</p>
          <h4>{auth.accountType === "student" ? "Apartment pregame" : "Friday Night at Joes"}</h4>
          <span className="state rising">Organic rising</span>
        </div>
        <div className="metric-grid">
          <span><b>91%</b> demand quality</span>
          <span><b>78%</b> capacity pressure</span>
          <span><b>42</b> verified arrivals</span>
          <span><b>18</b> friend intents</span>
        </div>
      </PhoneFrame>
      <PhoneFrame audience="Host" title="Create event" tabs={["Draft", "Preview", "Submit"]}>
        <div className="form-stack">
          <label>Event name<input defaultValue="Friday Night at Joes" /></label>
          <label>Host type<select defaultValue={auth.accountType === "student" ? "house" : "bar"}><option value="bar">bar</option><option value="frat">frat</option><option value="house">house party</option></select></label>
          <label>Cover<input defaultValue="$5 after 10:30" /></label>
          <label>Age rule<input defaultValue="19+" /></label>
        </div>
        <button className="full-button">Submit to Pull Up review</button>
      </PhoneFrame>
      <PhoneFrame audience="Host" title="Live report" tabs={["Line", "Capacity", "Send"]}>
        <div className="report-stack">
          <button className="selected">Moving steadily</button>
          <button>Building fast</button>
          <button>Quiet</button>
          <button>At capacity</button>
        </div>
        <div className="slider-card"><span>Capacity pressure</span><b>78%</b><div><i style={{ width: "78%" }} /></div></div>
        <button className="full-button">Send operational note</button>
      </PhoneFrame>
    </section>
  );
}

function AdminApp() {
  return (
    <section className="admin-app">
      <section className="admin-panel">
        <div className="admin-heading"><p className="eyebrow">Queue</p><h3>Review workbench</h3></div>
        {adminQueue.map((item) => (
          <div className="admin-row" key={item.title}>
            <div><strong>{item.title}</strong><small>{item.venue} • {item.detail}</small></div>
            <span className={`risk ${item.risk}`}>{riskCopy(item.risk)}</span>
          </div>
        ))}
      </section>
      <section className="admin-panel review-large">
        <div className="admin-heading"><p className="eyebrow">Event review</p><h3>Murphys Pub</h3></div>
        <div className="review-grid"><span><b>39</b> displayed confidence</span><span><b>35</b> replay score</span><span><b>27m</b> signal age</span><span><b>High</b> privacy review</span></div>
        <div className="ledger"><span>Host report <b>line building</b></span><span>Verified arrivals <b>6 stale</b></span><span>Ambassador report <b>conflict</b></span></div>
        <div className="button-row"><button>Keep abstained</button><button>Escalate</button></div>
      </section>
      <section className="admin-panel">
        <div className="admin-heading"><p className="eyebrow">Backend running model</p><h3>What powers the screens</h3></div>
        <div className="backend-map"><span>supabase.auth.users → verified identity</span><span>profiles.account_type → student / host / admin</span><span>profiles.can_host_unofficial → student party host</span><span>moderation_reviews → admin-only decisions</span><span>ai/recommendations → privacy-safe assistant</span></div>
      </section>
    </section>
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
