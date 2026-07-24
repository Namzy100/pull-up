"use client";

import { useMemo, useState } from "react";

type Role = "user" | "host" | "admin";
type VenueState = "rising" | "stable" | "uncertain";
type Risk = "low" | "watch" | "high";

type Signal = {
  label: string;
  count: number;
  trust: number;
  freshness: number;
  verification: number;
};

type Venue = {
  id: string;
  name: string;
  host: string;
  type: string;
  state: VenueState;
  distance: string;
  cover: string;
  age: string;
  lastUpdated: string;
  arrivalTrend: string;
  friendIntent: string;
  hostNote: string;
  confidence: number;
  calibration: number;
  risk: Risk;
  capacity: number;
  demand: number;
  reports: string[];
  signals: Signal[];
};

type AdminItem = {
  title: string;
  venue: string;
  severity: Risk;
  detail: string;
  action: string;
};

const venues: Venue[] = [
  {
    id: "joes",
    name: "Joes Brewery",
    host: "Joes ops desk",
    type: "Campus bar",
    state: "rising",
    distance: "0.4 mi",
    cover: "$5 after 10:30",
    age: "19+",
    lastUpdated: "8 min ago",
    arrivalTrend: "+42 verified arrivals",
    friendIntent: "18 friends saved or heading there",
    hostNote: "Line moved from patio to corner. No comped placement attached.",
    confidence: 86,
    calibration: 1.08,
    risk: "low",
    capacity: 78,
    demand: 91,
    reports: [
      "Ambassador Maya checked line movement twice in 20 minutes.",
      "Two friend groups switched from pregame to Joes after 10:05.",
      "Venue capacity report matches normal Friday pattern.",
    ],
    signals: [
      { label: "Verified check-ins", count: 42, trust: 0.94, freshness: 0.91, verification: 1 },
      { label: "Friend intent", count: 18, trust: 0.82, freshness: 0.84, verification: 0.72 },
      { label: "Ambassador report", count: 3, trust: 0.96, freshness: 0.88, verification: 0.95 },
    ],
  },
  {
    id: "canopy",
    name: "Canopy Club",
    host: "Canopy show team",
    type: "Live event",
    state: "rising",
    distance: "1.1 mi",
    cover: "$12 advance",
    age: "18+",
    lastUpdated: "5 min ago",
    arrivalTrend: "+34 recent arrivals",
    friendIntent: "7 friends committed",
    hostNote: "Ticket scans accelerated after opener. Door team reports steady entry.",
    confidence: 79,
    calibration: 1.02,
    risk: "low",
    capacity: 64,
    demand: 83,
    reports: [
      "Ticket scans accelerated after opener ended.",
      "Student org report confirms a large group is en route.",
      "No paid placement attached to this ranking.",
    ],
    signals: [
      { label: "Arrival pings", count: 34, trust: 0.84, freshness: 0.95, verification: 0.87 },
      { label: "Group commitments", count: 7, trust: 0.88, freshness: 0.9, verification: 0.8 },
      { label: "Operator capacity note", count: 1, trust: 0.78, freshness: 0.83, verification: 0.76 },
    ],
  },
  {
    id: "kams",
    name: "KAMS",
    host: "KAMS promotions",
    type: "Nightlife staple",
    state: "stable",
    distance: "0.7 mi",
    cover: "$10",
    age: "19+",
    lastUpdated: "11 min ago",
    arrivalTrend: "+25 verified arrivals",
    friendIntent: "9 friends watching",
    hostNote: "Baseline demand is healthy, but arrival velocity flattened after 10:15.",
    confidence: 71,
    calibration: 0.96,
    risk: "watch",
    capacity: 58,
    demand: 68,
    reports: [
      "Strong baseline demand, but arrivals flattened after 10:15.",
      "One duplicate report cluster was downweighted.",
      "Ambassador says line is moving, not spiking.",
    ],
    signals: [
      { label: "Verified check-ins", count: 25, trust: 0.9, freshness: 0.76, verification: 1 },
      { label: "Saves", count: 31, trust: 0.68, freshness: 0.8, verification: 0.5 },
      { label: "Ambassador report", count: 2, trust: 0.91, freshness: 0.74, verification: 0.92 },
    ],
  },
  {
    id: "murphys",
    name: "Murphys Pub",
    host: "Murphys manager",
    type: "Pub",
    state: "uncertain",
    distance: "0.5 mi",
    cover: "No cover",
    age: "21+",
    lastUpdated: "27 min ago",
    arrivalTrend: "Sparse recent arrivals",
    friendIntent: "4 friends interested",
    hostNote: "Host report conflicts with verified arrivals. Needs neutral review.",
    confidence: 39,
    calibration: 0.88,
    risk: "high",
    capacity: 36,
    demand: 41,
    reports: [
      "Signals are old and mostly unverified saves.",
      "One ambassador report conflicts with check-in data.",
      "Pull Up abstains from calling this active tonight.",
    ],
    signals: [
      { label: "Unverified saves", count: 16, trust: 0.42, freshness: 0.39, verification: 0.25 },
      { label: "Verified check-ins", count: 6, trust: 0.86, freshness: 0.31, verification: 0.9 },
      { label: "Conflicting report", count: 1, trust: 0.55, freshness: 0.54, verification: 0.48 },
    ],
  },
];

const adminQueue: AdminItem[] = [
  {
    title: "Duplicate intent cluster",
    venue: "KAMS",
    severity: "watch",
    detail: "Nine saves came from adjacent accounts in a six-minute window.",
    action: "Downweight cluster",
  },
  {
    title: "Conflicting host claim",
    venue: "Murphys Pub",
    severity: "high",
    detail: "Host reports a line; verified arrivals and ambassadors do not confirm.",
    action: "Keep abstained",
  },
  {
    title: "Ambassador confidence lift",
    venue: "Joes Brewery",
    severity: "low",
    detail: "Two trusted field reports match arrival velocity and friend intent.",
    action: "Approve rising",
  },
];

const hostChecklist = [
  "Submit one operational note, never a ranking claim.",
  "Report cover, age rule, line state, and capacity pressure.",
  "See attribution and demand quality, not private user trails.",
  "Paid promotion stays separate from organic momentum.",
];

function scoreVenue(venue: Venue) {
  const raw = venue.signals.reduce((sum, signal) => {
    return sum + signal.count * signal.trust * signal.freshness * signal.verification;
  }, 0);
  return Math.round(Math.min(99, raw * venue.calibration));
}

function stateCopy(state: VenueState) {
  if (state === "rising") return "Rising";
  if (state === "stable") return "Stable";
  return "Not enough signal";
}

function roleCopy(role: Role) {
  if (role === "user") {
    return {
      eyebrow: "Student view",
      title: "Pick the move without trusting rumor.",
      body: "Students see a confidence-labeled Tonight feed, evidence, friend intent, and a clear abstention when Pull Up cannot verify momentum.",
    };
  }

  if (role === "host") {
    return {
      eyebrow: "Host view",
      title: "Hosts can inform the night, not buy the truth.",
      body: "Party hosts and venues see demand quality, submitted reports, capacity pressure, and attribution without receiving private social graphs or location trails.",
    };
  }

  return {
    eyebrow: "Admin view",
    title: "The team protects the signal layer.",
    body: "Admins review manipulation flags, replay scores from raw signals, approve evidence summaries, and decide when the product should abstain.",
  };
}

function riskLabel(risk: Risk) {
  if (risk === "low") return "clean";
  if (risk === "watch") return "watch";
  return "review";
}

export default function Home() {
  const [role, setRole] = useState<Role>("user");
  const [selectedVenueId, setSelectedVenueId] = useState(venues[0].id);
  const selectedVenue = venues.find((venue) => venue.id === selectedVenueId) ?? venues[0];
  const rankedVenues = useMemo(
    () => [...venues].sort((a, b) => b.confidence - a.confidence),
    [],
  );
  const strongestSignal = selectedVenue.signals.reduce((top, signal) =>
    signal.count > top.count ? signal : top,
  );
  const currentRole = roleCopy(role);

  return (
    <main>
      <section className="top-shell">
        <nav className="nav-bar" aria-label="Primary">
          <div>
            <p className="eyebrow">UIUC closed beta</p>
            <h1>Pull Up</h1>
          </div>
          <div className="role-toggle" aria-label="Choose interface">
            {(["user", "host", "admin"] as Role[]).map((nextRole) => (
              <button
                className={role === nextRole ? "active" : ""}
                key={nextRole}
                onClick={() => setRole(nextRole)}
                type="button"
              >
                {nextRole === "user" ? "User" : nextRole === "host" ? "Host" : "Admin"}
              </button>
            ))}
          </div>
        </nav>

        <div className="hero-grid">
          <div className="hero-copy">
            <p className="contract">{currentRole.eyebrow}</p>
            <h2>{currentRole.title}</h2>
            <p>{currentRole.body}</p>
            <div className="contract-strip" aria-label="Product guardrails">
              <span>No paid ranking</span>
              <span>No private trails</span>
              <span>Abstain on weak data</span>
            </div>
          </div>

          <div className="live-card" aria-label="Tonight signal summary">
            <div className="live-orbit">
              <span />
              <b>119</b>
              <small>live signals</small>
            </div>
            <div>
              <p className="eyebrow">Tonight window</p>
              <strong>Thu-Sat, 9:45 PM-1:30 AM</strong>
            </div>
            <div className="mini-stats">
              <span>
                <b>4</b>
                watched
              </span>
              <span>
                <b>1</b>
                abstained
              </span>
              <span>
                <b>3</b>
                host notes
              </span>
            </div>
          </div>
        </div>
      </section>

      {role === "user" && (
        <section className="workspace-grid" aria-label="User Tonight view">
          <div className="panel">
            <div className="section-heading">
              <div>
                <p className="eyebrow">Ranked shortlist</p>
                <h3>Tonight</h3>
              </div>
              <span>Freshness under 30 min</span>
            </div>

            <div className="venue-list">
              {rankedVenues.map((venue, index) => (
                <button
                  className={`venue-card ${selectedVenueId === venue.id ? "selected" : ""}`}
                  key={venue.id}
                  onClick={() => setSelectedVenueId(venue.id)}
                  type="button"
                >
                  <span className="rank">{index + 1}</span>
                  <span className="venue-main">
                    <span className="venue-title">
                      <strong>{venue.name}</strong>
                      <small>{venue.type}</small>
                    </span>
                    <span className="venue-meta">
                      {venue.distance} | {venue.cover} | {venue.age}
                    </span>
                    <span className={`state-pill ${venue.state}`}>{stateCopy(venue.state)}</span>
                  </span>
                  <span className="confidence">
                    <b>{venue.confidence}</b>
                    confidence
                  </span>
                </button>
              ))}
            </div>
          </div>

          <aside className="panel detail-panel" aria-label={`${selectedVenue.name} evidence`}>
            <div className="detail-top">
              <div>
                <p className="eyebrow">Evidence replay</p>
                <h3>{selectedVenue.name}</h3>
              </div>
              <span className={`risk ${selectedVenue.risk}`}>{riskLabel(selectedVenue.risk)}</span>
            </div>

            <div className="score-ring" aria-label={`Confidence ${selectedVenue.confidence}`}>
              <span>{selectedVenue.confidence}</span>
              <small>confidence</small>
            </div>

            <div className="momentum-copy">
              <strong>{selectedVenue.arrivalTrend}</strong>
              <p>{selectedVenue.friendIntent}</p>
              <small>Updated {selectedVenue.lastUpdated}</small>
            </div>

            <SignalStack venue={selectedVenue} />

            <div className="reports">
              {selectedVenue.reports.map((report) => (
                <p key={report}>{report}</p>
              ))}
            </div>

            <div className="action-row">
              <button type="button">Commit with friends</button>
              <button type="button">Verify arrival</button>
            </div>
          </aside>
        </section>
      )}

      {role === "host" && (
        <section className="workspace-grid host-grid" aria-label="Host operations view">
          <div className="panel host-command">
            <div className="section-heading">
              <div>
                <p className="eyebrow">Host dashboard</p>
                <h3>{selectedVenue.host}</h3>
              </div>
              <span>{selectedVenue.name}</span>
            </div>

            <div className="host-metrics">
              <Metric label="Demand quality" value={`${selectedVenue.demand}%`} tone="green" />
              <Metric label="Capacity pressure" value={`${selectedVenue.capacity}%`} tone="amber" />
              <Metric label="Public confidence" value={`${selectedVenue.confidence}`} tone="blue" />
            </div>

            <div className="host-note">
              <p className="eyebrow">Latest host note</p>
              <strong>{selectedVenue.hostNote}</strong>
              <p>
                Hosts can improve the evidence layer with operational facts. Pull Up
                decides whether those facts are enough to affect the user ranking.
              </p>
            </div>

            <div className="submit-box" aria-label="Host report form mockup">
              <label>
                Line state
                <select defaultValue="moving">
                  <option value="moving">Moving steadily</option>
                  <option value="building">Building fast</option>
                  <option value="quiet">Quiet</option>
                </select>
              </label>
              <label>
                Capacity pressure
                <input defaultValue={`${selectedVenue.capacity}%`} />
              </label>
              <label>
                Ops note
                <textarea defaultValue={selectedVenue.hostNote} />
              </label>
              <button type="button">Submit report for review</button>
            </div>
          </div>

          <aside className="panel">
            <div className="section-heading">
              <div>
                <p className="eyebrow">Host boundaries</p>
                <h3>What hosts see</h3>
              </div>
            </div>
            <div className="venue-list compact">
              {rankedVenues.map((venue) => (
                <button
                  className={`venue-card host-row ${selectedVenueId === venue.id ? "selected" : ""}`}
                  key={venue.id}
                  onClick={() => setSelectedVenueId(venue.id)}
                  type="button"
                >
                  <span className="venue-main">
                    <span className="venue-title">
                      <strong>{venue.name}</strong>
                      <small>{venue.host}</small>
                    </span>
                    <span className={`state-pill ${venue.state}`}>{stateCopy(venue.state)}</span>
                  </span>
                  <span className="confidence">
                    <b>{venue.demand}</b>
                    demand
                  </span>
                </button>
              ))}
            </div>
            <div className="task-list">
              {hostChecklist.map((item) => (
                <label key={item}>
                  <input type="checkbox" defaultChecked />
                  <span>{item}</span>
                </label>
              ))}
            </div>
          </aside>
        </section>
      )}

      {role === "admin" && (
        <section className="workspace-grid admin-grid" aria-label="Admin review view">
          <div className="panel">
            <div className="section-heading">
              <div>
                <p className="eyebrow">Signal integrity</p>
                <h3>Admin review queue</h3>
              </div>
              <span>Middle layer</span>
            </div>

            <div className="review-table">
              {adminQueue.map((item) => (
                <div className="review-row" key={item.title}>
                  <div>
                    <strong>{item.title}</strong>
                    <small>
                      {item.venue} | {item.detail}
                    </small>
                  </div>
                  <span className={`risk ${item.severity}`}>{riskLabel(item.severity)}</span>
                  <button type="button">{item.action}</button>
                </div>
              ))}
            </div>
          </div>

          <aside className="panel admin-rail">
            <div>
              <p className="eyebrow">Score replay</p>
              <h3>{selectedVenue.name}</h3>
              <p>
                Displayed confidence is {selectedVenue.confidence}; replay from raw
                signals returns {scoreVenue(selectedVenue)}. Admins inspect the
                delta before publishing or suppressing claims.
              </p>
            </div>

            <SignalStack venue={selectedVenue} />

            <div className="admin-actions">
              <button type="button">Approve summary</button>
              <button type="button">Abstain tonight</button>
              <button type="button">Escalate manipulation</button>
            </div>

            <div className="venue-list compact">
              {rankedVenues.map((venue) => (
                <button
                  className={`venue-card host-row ${selectedVenueId === venue.id ? "selected" : ""}`}
                  key={venue.id}
                  onClick={() => setSelectedVenueId(venue.id)}
                  type="button"
                >
                  <span className="venue-main">
                    <span className="venue-title">
                      <strong>{venue.name}</strong>
                      <small>{venue.lastUpdated}</small>
                    </span>
                  </span>
                  <span className={`risk ${venue.risk}`}>{riskLabel(venue.risk)}</span>
                </button>
              ))}
            </div>
          </aside>
        </section>
      )}
    </main>
  );
}

function Metric({ label, value, tone }: { label: string; value: string; tone: string }) {
  return (
    <div className={`metric ${tone}`}>
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

function SignalStack({ venue }: { venue: Venue }) {
  return (
    <div className="signal-stack">
      {venue.signals.map((signal) => (
        <div className="signal-row" key={signal.label}>
          <div>
            <strong>{signal.label}</strong>
            <small>
              trust {Math.round(signal.trust * 100)}%, freshness{" "}
              {Math.round(signal.freshness * 100)}%, verified{" "}
              {Math.round(signal.verification * 100)}%
            </small>
          </div>
          <span>{signal.count}</span>
        </div>
      ))}
    </div>
  );
}
