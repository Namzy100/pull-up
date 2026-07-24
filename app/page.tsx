"use client";

import { useMemo, useState } from "react";

type VenueState = "rising" | "stable" | "uncertain";

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
  type: string;
  state: VenueState;
  distance: string;
  cover: string;
  age: string;
  lastUpdated: string;
  arrivalTrend: string;
  friendIntent: string;
  confidence: number;
  calibration: number;
  risk: "low" | "watch" | "high";
  reports: string[];
  signals: Signal[];
};

const venues: Venue[] = [
  {
    id: "joes",
    name: "Joes Brewery",
    type: "Campus bar",
    state: "rising",
    distance: "0.4 mi",
    cover: "$5 after 10:30",
    age: "19+",
    lastUpdated: "8 min ago",
    arrivalTrend: "+42 verified arrivals",
    friendIntent: "18 friends saved or heading there",
    confidence: 86,
    calibration: 1.08,
    risk: "low",
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
    id: "kams",
    name: "KAMS",
    type: "Nightlife staple",
    state: "stable",
    distance: "0.7 mi",
    cover: "$10",
    age: "19+",
    lastUpdated: "11 min ago",
    arrivalTrend: "+25 verified arrivals",
    friendIntent: "9 friends watching",
    confidence: 71,
    calibration: 0.96,
    risk: "watch",
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
    id: "canopy",
    name: "Canopy Club",
    type: "Live event",
    state: "rising",
    distance: "1.1 mi",
    cover: "$12 advance",
    age: "18+",
    lastUpdated: "5 min ago",
    arrivalTrend: "+34 recent arrivals",
    friendIntent: "7 friends committed",
    confidence: 79,
    calibration: 1.02,
    risk: "low",
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
    id: "murphys",
    name: "Murphys Pub",
    type: "Pub",
    state: "uncertain",
    distance: "0.5 mi",
    cover: "No cover",
    age: "21+",
    lastUpdated: "27 min ago",
    arrivalTrend: "Sparse recent arrivals",
    friendIntent: "4 friends interested",
    confidence: 39,
    calibration: 0.88,
    risk: "high",
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

const researchTasks = [
  "Run the concierge Tonight briefing with five friend groups this weekend.",
  "Tag every signal with source, timestamp, expiry, verification, and weight.",
  "Interview students within 12 hours of going out and reconstruct their decision path.",
  "Keep sponsored placements separate from organic momentum.",
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

export default function Home() {
  const [selectedVenueId, setSelectedVenueId] = useState(venues[0].id);
  const [view, setView] = useState<"tonight" | "console">("tonight");
  const selectedVenue = venues.find((venue) => venue.id === selectedVenueId) ?? venues[0];
  const rankedVenues = useMemo(
    () => [...venues].sort((a, b) => b.confidence - a.confidence),
    [],
  );
  const strongestSignal = selectedVenue.signals.reduce((top, signal) =>
    signal.count > top.count ? signal : top,
  );

  return (
    <main className="min-h-screen bg-[var(--background)] text-[var(--foreground)]">
      <section className="top-shell">
        <nav className="nav-bar" aria-label="Primary">
          <div>
            <p className="eyebrow">UIUC closed beta</p>
            <h1>Pull Up</h1>
          </div>
          <div className="view-toggle" aria-label="Choose app view">
            <button
              className={view === "tonight" ? "active" : ""}
              onClick={() => setView("tonight")}
              type="button"
            >
              Tonight
            </button>
            <button
              className={view === "console" ? "active" : ""}
              onClick={() => setView("console")}
              type="button"
            >
              Console
            </button>
          </div>
        </nav>

        <div className="hero-grid">
          <div className="hero-copy">
            <p className="contract">Ranking contract</p>
            <h2>Know where the night is going before you commit.</h2>
            <p>
              Pull Up ranks campus nightlife only when verified momentum is fresh
              enough to trust. Weak evidence becomes an abstention, not a fake
              crowd claim.
            </p>
            <div className="contract-strip" aria-label="Product guardrails">
              <span>No paid ranking</span>
              <span>No surveillance trail</span>
              <span>No invented crowd claims</span>
            </div>
          </div>

          <div className="pulse-panel" aria-label="Tonight signal summary">
            <div>
              <p className="eyebrow">Tonight window</p>
              <strong>Thu-Sat, 9:45 PM-1:30 AM</strong>
            </div>
            <div className="pulse-meter">
              <span style={{ width: "86%" }} />
            </div>
            <div className="pulse-stats">
              <span>
                <b>4</b>
                venues watched
              </span>
              <span>
                <b>119</b>
                live signals
              </span>
              <span>
                <b>1</b>
                abstention
              </span>
            </div>
          </div>
        </div>
      </section>

      {view === "tonight" ? (
        <section className="app-grid" aria-label="Tonight momentum view">
          <div className="feed-panel">
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

          <aside className="detail-panel" aria-label={`${selectedVenue.name} evidence`}>
            <div className="detail-top">
              <div>
                <p className="eyebrow">Evidence replay</p>
                <h3>{selectedVenue.name}</h3>
              </div>
              <span className={`risk ${selectedVenue.risk}`}>{selectedVenue.risk}</span>
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

            <div className="signal-stack">
              {selectedVenue.signals.map((signal) => (
                <div className="signal-row" key={signal.label}>
                  <div>
                    <strong>{signal.label}</strong>
                    <small>
                      trust {Math.round(signal.trust * 100)}%, freshness{" "}
                      {Math.round(signal.freshness * 100)}%
                    </small>
                  </div>
                  <span>{signal.count}</span>
                </div>
              ))}
            </div>

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
      ) : (
        <section className="console-grid" aria-label="Internal moderation console">
          <div className="moderation-panel">
            <div className="section-heading">
              <div>
                <p className="eyebrow">Signal quality</p>
                <h3>Moderation console</h3>
              </div>
              <span>Internal only</span>
            </div>
            <div className="review-table">
              {venues.map((venue) => {
                const replayScore = scoreVenue(venue);
                return (
                  <div className="review-row" key={venue.id}>
                    <div>
                      <strong>{venue.name}</strong>
                      <small>
                        replay score {replayScore} | displayed {venue.confidence}
                      </small>
                    </div>
                    <span className={`state-pill ${venue.state}`}>
                      {stateCopy(venue.state)}
                    </span>
                    <span className={`risk ${venue.risk}`}>{venue.risk}</span>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="ops-panel">
            <div>
              <p className="eyebrow">Strongest live signal</p>
              <h3>{strongestSignal.label}</h3>
              <p>
                {selectedVenue.name} is currently driven by {strongestSignal.count}{" "}
                recent signal events. This is the input an operator can inspect
                before publishing a Tonight briefing.
              </p>
            </div>
            <div className="task-list">
              {researchTasks.map((task) => (
                <label key={task}>
                  <input type="checkbox" />
                  <span>{task}</span>
                </label>
              ))}
            </div>
          </div>
        </section>
      )}
    </main>
  );
}
