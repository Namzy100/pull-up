type VenueState = "rising" | "stable" | "uncertain";
type Risk = "low" | "watch" | "high";

type Venue = {
  name: string;
  host: string;
  type: string;
  state: VenueState;
  confidence: number;
  distance: string;
  cover: string;
  age: string;
  friends: string;
  proof: string;
  risk: Risk;
};

type AdminItem = {
  title: string;
  venue: string;
  detail: string;
  risk: Risk;
};

const venues: Venue[] = [
  {
    name: "Joes Brewery",
    host: "Joes ops desk",
    type: "Campus bar",
    state: "rising",
    confidence: 86,
    distance: "0.4 mi",
    cover: "$5 after 10:30",
    age: "19+",
    friends: "18 friends saved or heading there",
    proof: "42 verified arrivals, 3 ambassador checks",
    risk: "low",
  },
  {
    name: "Canopy Club",
    host: "Canopy show team",
    type: "Live event",
    state: "rising",
    confidence: 79,
    distance: "1.1 mi",
    cover: "$12 advance",
    age: "18+",
    friends: "7 friends committed",
    proof: "Ticket scans accelerated after opener",
    risk: "low",
  },
  {
    name: "KAMS",
    host: "KAMS promotions",
    type: "Nightlife staple",
    state: "stable",
    confidence: 71,
    distance: "0.7 mi",
    cover: "$10",
    age: "19+",
    friends: "9 friends watching",
    proof: "Arrivals flattened after 10:15",
    risk: "watch",
  },
  {
    name: "Murphys Pub",
    host: "Murphys manager",
    type: "Pub",
    state: "uncertain",
    confidence: 39,
    distance: "0.5 mi",
    cover: "No cover",
    age: "21+",
    friends: "4 friends interested",
    proof: "Host report conflicts with check-ins",
    risk: "high",
  },
];

const adminQueue: AdminItem[] = [
  {
    title: "Conflicting host claim",
    venue: "Murphys Pub",
    detail: "Host says line is building; verified arrivals are stale.",
    risk: "high",
  },
  {
    title: "Duplicate intent cluster",
    venue: "KAMS",
    detail: "Nine saves from adjacent accounts inside six minutes.",
    risk: "watch",
  },
  {
    title: "Ambassador lift",
    venue: "Joes Brewery",
    detail: "Trusted field reports match check-in velocity.",
    risk: "low",
  },
];

const productLayers = [
  "Auth: Supabase Auth verifies every student, host org, and admin session.",
  "Access: admins never see student/host UX; host orgs never see student trails.",
  "Student hosting: students can opt into unofficial party hosting without becoming a pub/frat account.",
  "AI: server-only recommendation assistant uses approved events and privacy-safe profile preferences.",
];

const accessRules = [
  {
    role: "Student",
    scope: "Tonight, friends, profile, attendance, optional unofficial party hosting.",
    denied: "No admin queue. No host aggregate dashboard unless they create an unofficial event.",
  },
  {
    role: "Host org",
    scope: "Pub, frat, bar, club, or org account for events, reports, demand quality.",
    denied: "No individual student movement, private attendance, or admin decisions.",
  },
  {
    role: "Admin",
    scope: "Review queue, score replay, moderation, account verification, safety controls.",
    denied: "No consumer Tonight app. No pretending to be a student or host in the same session.",
  },
];

function stateCopy(state: VenueState) {
  if (state === "rising") return "Rising";
  if (state === "stable") return "Stable";
  return "No call";
}

function riskCopy(risk: Risk) {
  if (risk === "low") return "Clean";
  if (risk === "watch") return "Watch";
  return "Review";
}

export default function Home() {
  return (
    <main>
      <section className="hero">
        <div className="hero-copy">
          <p className="eyebrow">Pull Up product system</p>
          <h1>Three apps, one nightlife signal layer.</h1>
          <p>
            Students, hosts, and admins should never feel like they are using the
            same account with different tabs. They each get a purpose-built
            surface, backed by the same event, attendance, signal, and review
            backend.
          </p>
        </div>
        <div className="system-card">
          <p className="eyebrow">Backend spine</p>
          <div className="system-list">
            {productLayers.map((layer) => (
              <span key={layer}>{layer}</span>
            ))}
          </div>
        </div>
      </section>

      <section className="access-section">
        <SurfaceCopy
          label="Authentication and privacy"
          title="Separate doors, shared data spine."
          body="The backend now models account type as an authorization boundary. Students, host organizations, and admins can share the same event graph without sharing the same screens or private data."
        />
        <div className="access-grid">
          {accessRules.map((rule) => (
            <article className="access-card" key={rule.role}>
              <h3>{rule.role}</h3>
              <p>{rule.scope}</p>
              <small>{rule.denied}</small>
            </article>
          ))}
        </div>
      </section>

      <section className="surface-section student">
        <SurfaceCopy
          label="Student mobile app"
          title="Find the move, coordinate, check in."
          body="Students only see places and parties that are useful for deciding tonight. Their profile, friends, saves, attendance, and check-ins feed the signal layer without exposing private trails to hosts."
        />
        <div className="phone-grid">
          <StudentTonight />
          <StudentDetail />
          <StudentProfile />
        </div>
      </section>

      <section className="surface-section host">
        <SurfaceCopy
          label="Host mobile app"
          title="Create events and report facts."
          body="Frats, bars, pubs, student orgs, and house-party hosts get tools to submit events and operational updates. They can see demand quality and aggregate attribution, but they cannot buy organic rank or inspect individual movement."
        />
        <div className="phone-grid">
          <HostDashboard />
          <HostCreateEvent />
          <HostReport />
        </div>
      </section>

      <section className="surface-section admin">
        <SurfaceCopy
          label="Admin review console"
          title="Protect trust before anything reaches students."
          body="The Pull Up team sees queues, signal replay, manipulation flags, host claims, and moderation decisions. Admin is the middle layer that approves, downweights, escalates, or abstains."
        />
        <div className="admin-layout">
          <AdminQueue />
          <AdminEventReview />
          <AdminBackend />
        </div>
      </section>
    </main>
  );
}

function SurfaceCopy({ label, title, body }: { label: string; title: string; body: string }) {
  return (
    <div className="surface-copy">
      <p className="eyebrow">{label}</p>
      <h2>{title}</h2>
      <p>{body}</p>
    </div>
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
        <div>
          <p>{audience}</p>
          <h3>{title}</h3>
        </div>
        <span>UIUC</span>
      </header>
      <div className="phone-content">{children}</div>
      <nav className="phone-tabs" aria-label={`${audience} tabs`}>
        {tabs.map((tab, index) => (
          <span className={index === 0 ? "active" : ""} key={tab}>
            {tab}
          </span>
        ))}
      </nav>
    </article>
  );
}

function StudentTonight() {
  return (
    <PhoneFrame audience="Student" title="Tonight" tabs={["Tonight", "Friends", "Profile"]}>
      <div className="search-pill">Near campus • Thu 10:18 PM</div>
      <div className="feed-list">
        {venues.map((venue, index) => (
          <div className="venue-card" key={venue.name}>
            <span className="rank">{index + 1}</span>
            <div>
              <strong>{venue.name}</strong>
              <small>
                {venue.distance} • {venue.cover} • {venue.age}
              </small>
              <span className={`state ${venue.state}`}>{stateCopy(venue.state)}</span>
            </div>
            <b>{venue.confidence}</b>
          </div>
        ))}
      </div>
    </PhoneFrame>
  );
}

function StudentDetail() {
  const venue = venues[0];
  return (
    <PhoneFrame audience="Student" title={venue.name} tabs={["Evidence", "Friends", "Go"]}>
      <div className="big-score">
        <span>{venue.confidence}</span>
        <small>confidence</small>
      </div>
      <div className="detail-block">
        <strong>{venue.proof}</strong>
        <p>{venue.friends}</p>
      </div>
      <div className="evidence-list">
        <span>Verified check-ins <b>42</b></span>
        <span>Friend intent <b>18</b></span>
        <span>Ambassador reports <b>3</b></span>
      </div>
      <div className="button-row">
        <button>Going</button>
        <button>Check in</button>
      </div>
    </PhoneFrame>
  );
}

function StudentProfile() {
  return (
    <PhoneFrame audience="Student" title="Naman" tabs={["Profile", "Plans", "Crew"]}>
      <div className="profile-top">
        <div className="avatar">NB</div>
        <div>
          <strong>Naman Behl</strong>
          <small>UIUC • Class of 2027</small>
        </div>
      </div>
      <div className="profile-grid">
        <span><b>12</b> nights out</span>
        <span><b>8</b> trusted signals</span>
        <span><b>5</b> crews</span>
        <span><b>0</b> host trails</span>
      </div>
      <div className="privacy-note">
        Precise location expires quickly. Friends see intent; hosts only see aggregate demand.
      </div>
      <button className="full-button">Enable unofficial hosting</button>
    </PhoneFrame>
  );
}

function HostDashboard() {
  return (
    <PhoneFrame audience="Host" title="Joes ops" tabs={["Home", "Events", "Reports"]}>
      <div className="host-hero">
        <p>Tonight event</p>
        <h4>Friday Night at Joes</h4>
        <span className="state rising">Organic rising</span>
      </div>
      <div className="metric-grid">
        <span><b>91%</b> demand quality</span>
        <span><b>78%</b> capacity pressure</span>
        <span><b>42</b> verified arrivals</span>
        <span><b>18</b> friend intents</span>
      </div>
      <div className="privacy-note">
        Hosts see demand quality and attribution, never student-by-student location.
      </div>
    </PhoneFrame>
  );
}

function HostCreateEvent() {
  return (
    <PhoneFrame audience="Host" title="Create event" tabs={["Draft", "Preview", "Submit"]}>
      <div className="form-stack">
        <label>Event name<input value="Friday Night at Joes" readOnly /></label>
        <label>Host type<select defaultValue="bar"><option>bar</option><option>frat</option><option>house party</option></select></label>
        <label>Cover<input value="$5 after 10:30" readOnly /></label>
        <label>Age rule<input value="19+" readOnly /></label>
        <label>Invite mode<select defaultValue="open"><option>open</option><option>invite link</option><option>friends of friends</option></select></label>
      </div>
      <button className="full-button">Submit to Pull Up review</button>
    </PhoneFrame>
  );
}

function HostReport() {
  return (
    <PhoneFrame audience="Host" title="Live report" tabs={["Line", "Capacity", "Send"]}>
      <div className="report-stack">
        <button className="selected">Moving steadily</button>
        <button>Building fast</button>
        <button>Quiet</button>
        <button>At capacity</button>
      </div>
      <div className="slider-card">
        <span>Capacity pressure</span>
        <b>78%</b>
        <div><i style={{ width: "78%" }} /></div>
      </div>
      <button className="full-button">Send operational note</button>
    </PhoneFrame>
  );
}

function AdminQueue() {
  return (
    <section className="admin-panel">
      <div className="admin-heading">
        <p className="eyebrow">Queue</p>
        <h3>Review workbench</h3>
      </div>
      {adminQueue.map((item) => (
        <div className="admin-row" key={item.title}>
          <div>
            <strong>{item.title}</strong>
            <small>{item.venue} • {item.detail}</small>
          </div>
          <span className={`risk ${item.risk}`}>{riskCopy(item.risk)}</span>
        </div>
      ))}
    </section>
  );
}

function AdminEventReview() {
  return (
    <section className="admin-panel review-large">
      <div className="admin-heading">
        <p className="eyebrow">Event review</p>
        <h3>Murphys Pub</h3>
      </div>
      <div className="review-grid">
        <span><b>39</b> displayed confidence</span>
        <span><b>35</b> replay score</span>
        <span><b>27m</b> signal age</span>
      </div>
      <div className="ledger">
        <span>Host report <b>line building</b></span>
        <span>Verified arrivals <b>6 stale</b></span>
        <span>Ambassador report <b>conflict</b></span>
      </div>
      <div className="button-row">
        <button>Keep abstained</button>
        <button>Escalate</button>
      </div>
    </section>
  );
}

function AdminBackend() {
  return (
    <section className="admin-panel">
      <div className="admin-heading">
        <p className="eyebrow">Backend running model</p>
        <h3>What powers the screens</h3>
      </div>
      <div className="backend-map">
        <span>supabase.auth.users → verified identity</span>
        <span>profiles.account_type → student / host / admin</span>
        <span>profiles.can_host_unofficial → student party host</span>
        <span>host_organizations → pubs, bars, frats, orgs</span>
        <span>moderation_reviews → admin-only decisions</span>
        <span>ai/recommendations → privacy-safe assistant</span>
      </div>
    </section>
  );
}
