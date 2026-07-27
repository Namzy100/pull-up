"use client";

import { useEffect, useState, type ReactNode } from "react";
import {
  AvatarStack,
  MomentumMeter,
  Panel,
  PrototypeTag,
  SignalTile,
  StateScreen,
} from "./ui";
import {
  arrivalWindows,
  confidenceCopy,
  crewMembers,
  momentumCopy,
  venues,
  type Venue,
} from "../pull-up-data";
import type { Session } from "../lib/session";
import { getAccessToken } from "../lib/supabaseClient";

type Tab = "tonight" | "crew" | "plans" | "profile";
type Flow = null | "detail" | "create" | "invite" | "commit" | "checkin" | "report" | "planned";

type PlanStatus = "none" | "interested" | "going" | "arrived" | "reported";

type Plan = {
  venue: Venue;
  crew: string[];
  arrival: string | null;
  status: PlanStatus;
  note?: string;
};

type LiveEvent = {
  id: string;
  title: string;
  status: string;
  starts_at: string;
  cover: string;
  age_rule: string;
};

type AttendanceRow = {
  id: string;
  event_id: string;
  status: string;
  updated_at?: string;
  events?: { title?: string } | null;
};

type LoadState = "loading" | "ready" | "error" | "expired";

const STATUS_LABEL: Record<PlanStatus, string> = {
  none: "Not started",
  interested: "Plan started",
  going: "Locked in",
  arrived: "Checked in",
  reported: "Reported",
};

export default function StudentApp({ session, onSignOut }: { session: Session; onSignOut: () => void }) {
  const lead = venues[0];
  const alternatives = venues.slice(1);

  const [tab, setTab] = useState<Tab>("tonight");
  const [flow, setFlow] = useState<Flow>(null);
  const [activeVenue, setActiveVenue] = useState<Venue>(lead);
  const [plan, setPlan] = useState<Plan | null>(null);
  const [busy, setBusy] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  // Supabase-backed data (real sessions only).
  const [loadState, setLoadState] = useState<LoadState>(session.isPreview ? "ready" : "loading");
  const [events, setEvents] = useState<LiveEvent[]>([]);
  const [history, setHistory] = useState<AttendanceRow[]>([]);

  const selectedEvent = events[0] ?? null;

  useEffect(() => {
    if (session.isPreview) return;
    let cancelled = false;
    (async () => {
      try {
        const [ev, at] = await Promise.all([
          api<{ events: LiveEvent[] }>(session, "/api/supabase/events"),
          api<{ attendances: AttendanceRow[] }>(session, "/api/supabase/attendance"),
        ]);
        if (cancelled) return;
        setEvents((ev.events ?? []).filter((e) => ["approved", "live", "ended"].includes(e.status)));
        setHistory(at.attendances ?? []);
        setLoadState("ready");
      } catch (error) {
        if (cancelled) return;
        setLoadState(error instanceof Error && error.name === "Expired" ? "expired" : "error");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [session]);

  function flash(message: string) {
    setToast(message);
    window.setTimeout(() => setToast((current) => (current === message ? null : current)), 2600);
  }

  function openVenue(venue: Venue) {
    setActiveVenue(venue);
    setTab("tonight");
    setFlow("detail");
  }

  function goTab(next: Tab) {
    setTab(next);
    setFlow(null);
  }

  async function persist(status: "interested" | "going" | "arrived") {
    if (session.isPreview || !selectedEvent) return true;
    try {
      await api(session, "/api/supabase/attendance", {
        method: "POST",
        body: JSON.stringify({
          eventId: selectedEvent.id,
          status,
          visibility: "friends",
          arrivalWindow: plan?.arrival ?? null,
        }),
      });
      const at = await api<{ attendances: AttendanceRow[] }>(session, "/api/supabase/attendance");
      setHistory(at.attendances ?? []);
      return true;
    } catch (error) {
      if (error instanceof Error && error.name === "Expired") setLoadState("expired");
      else flash("That didn't save. Check your connection and try again.");
      return false;
    }
  }

  async function startPlan() {
    setBusy(true);
    const ok = await persist("interested");
    setBusy(false);
    if (!ok) return;
    setPlan({ venue: activeVenue, crew: ["Maya", "Dev"], arrival: null, status: "interested" });
    setFlow("invite");
    setTab("crew");
  }

  function toggleCrew(name: string) {
    setPlan((current) =>
      current
        ? { ...current, crew: current.crew.includes(name) ? current.crew.filter((n) => n !== name) : [...current.crew, name] }
        : current,
    );
  }

  async function commitArrival() {
    if (!plan?.arrival) {
      flash("Pick an arrival window first.");
      return;
    }
    setBusy(true);
    const ok = await persist("going");
    setBusy(false);
    if (!ok) return;
    setPlan((current) => (current ? { ...current, status: "going" } : current));
    setFlow("checkin");
    setTab("tonight");
    flash(`Locked in for ${plan.venue.name}`);
  }

  async function checkIn() {
    setBusy(true);
    const ok = await persist("arrived");
    setBusy(false);
    if (!ok) return;
    setPlan((current) => (current ? { ...current, status: "arrived" } : current));
    setFlow("report");
  }

  async function submitReport(note: string) {
    setBusy(true);
    if (!session.isPreview && selectedEvent) {
      try {
        await api(session, "/api/supabase/conditions", {
          method: "POST",
          body: JSON.stringify({ eventId: selectedEvent.id, lineState: "moving", cover: selectedEvent.cover, note }),
        });
      } catch (error) {
        setBusy(false);
        if (error instanceof Error && error.name === "Expired") setLoadState("expired");
        else flash("Report didn't send. Try again.");
        return;
      }
    }
    setBusy(false);
    setPlan((current) => (current ? { ...current, status: "reported", note } : current));
    setFlow("planned");
  }

  // ---- Full-surface states -------------------------------------------------

  if (loadState === "loading") {
    return (
      <Shell tab={tab} onTab={goTab} plan={plan}>
        <StateScreen kind="loading" title="Reading tonight" body="Pulling the latest campus signal…" />
      </Shell>
    );
  }
  if (loadState === "expired") {
    return (
      <Shell tab={tab} onTab={goTab} plan={plan}>
        <StateScreen
          kind="expired"
          title="You've been signed out"
          body="For your privacy, Pull Up ends sessions after a while. Sign in again to pick up your plan."
          action="Sign in again"
          onAction={onSignOut}
        />
      </Shell>
    );
  }
  if (loadState === "error") {
    return (
      <Shell tab={tab} onTab={goTab} plan={plan}>
        <StateScreen
          kind="error"
          title="Tonight didn't load"
          body="Something got in the way of loading the feed. Give it another try."
          action="Try again"
          onAction={() => window.location.reload()}
          secondaryAction="Sign out"
          onSecondary={onSignOut}
        />
      </Shell>
    );
  }

  return (
    <Shell tab={tab} onTab={goTab} plan={plan} toast={busy ? "Saving…" : toast}>
      {tab === "tonight" && flow === null && (
        <Tonight
          lead={lead}
          alternatives={alternatives}
          plan={plan}
          onSeeMove={() => openVenue(lead)}
          onStartPlan={() => { setActiveVenue(lead); setFlow("create"); }}
          onOpenVenue={openVenue}
          onGoCrew={() => goTab("crew")}
          onGoPlans={() => goTab("plans")}
        />
      )}

      {tab === "tonight" && flow === "detail" && (
        <VenueDetail
          venue={activeVenue}
          onBack={() => setFlow(null)}
          onStartPlan={() => setFlow("create")}
        />
      )}

      {tab === "tonight" && flow === "create" && (
        <FlowShell title="Start a plan" step={1} onBack={() => setFlow(activeVenue === lead ? null : "detail")}>
          <div className="plan-lead">
            <span className={`chip chip-${activeVenue.momentum}`}>{momentumCopy(activeVenue.momentum)}</span>
            <h2>Make {activeVenue.name} the move</h2>
            <p>Your crew sees the plan. Venues only ever see aggregate demand — never your name or your friends.</p>
          </div>
          <button className="btn btn-primary btn-block" disabled={busy} onClick={startPlan}>
            {busy ? "Saving…" : "Start the plan"}
          </button>
        </FlowShell>
      )}

      {tab === "crew" && (flow === "invite" || flow === null) && (
        <FlowShell
          title="Invite your crew"
          step={2}
          onBack={() => { setTab("tonight"); setFlow("create"); }}
          hideBack={flow === null}
        >
          {plan ? (
            <>
              <div className="plan-lead compact">
                <span className="mini-kicker">{plan.venue.name}</span>
                <h2>Who&apos;s coming?</h2>
                <p>Crew names stay private to your plan.</p>
              </div>
              <div className="crew-grid">
                {crewMembers.map((name) => {
                  const on = plan.crew.includes(name);
                  return (
                    <button key={name} className={`crew-chip ${on ? "on" : ""}`} onClick={() => toggleCrew(name)} type="button">
                      <span className="crew-ava">{name[0]}</span>
                      <b>{name}</b>
                      <i>{on ? "Added" : "Add"}</i>
                    </button>
                  );
                })}
              </div>
              <button className="btn btn-primary btn-block" onClick={() => setFlow("commit")}>
                Continue · {plan.crew.length} in
              </button>
            </>
          ) : (
            <StateScreen
              kind="empty"
              title="No crew plan yet"
              body="Start a plan from Tonight and your crew shows up here."
              action="Go to Tonight"
              onAction={() => goTab("tonight")}
            />
          )}
        </FlowShell>
      )}

      {tab === "crew" && flow === "commit" && plan && (
        <FlowShell title="Commit a time" step={3} onBack={() => setFlow("invite")}>
          <div className="plan-lead compact">
            <span className="mini-kicker">{plan.venue.name}</span>
            <h2>When are you arriving?</h2>
            <p>{plan.crew.length} in your crew · recommended before 10:45 while the line is short.</p>
          </div>
          <div className="arrival-choices">
            {arrivalWindows.map((window) => (
              <button
                key={window}
                type="button"
                className={`arrival-choice ${plan.arrival === window ? "on" : ""} ${window === arrivalWindows[1] ? "rec" : ""}`}
                onClick={() => setPlan((current) => (current ? { ...current, arrival: window } : current))}
              >
                <b>{window}</b>
                {window === arrivalWindows[1] && <i>Recommended</i>}
              </button>
            ))}
          </div>
          <button className="btn btn-primary btn-block" disabled={busy} onClick={commitArrival}>
            {busy ? "Saving…" : "Commit arrival time"}
          </button>
        </FlowShell>
      )}

      {tab === "tonight" && flow === "checkin" && plan && (
        <FlowShell title="Check in" step={4} onBack={() => { setTab("crew"); setFlow("commit"); }}>
          <div className="checkin-hero">
            <span className="checkin-ring" aria-hidden>✓</span>
            <h2>At {plan.venue.name}?</h2>
            <p>Check in to lock your arrival and add a verified signal for everyone still deciding.</p>
          </div>
          <button className="btn btn-primary btn-block" disabled={busy} onClick={checkIn}>
            {busy ? "Saving…" : "I'm here — check in"}
          </button>
          <button className="btn btn-ghost btn-block" onClick={() => goTab("plans")}>Not yet</button>
        </FlowShell>
      )}

      {tab === "tonight" && flow === "report" && plan && (
        <ReportForm venue={plan.venue} busy={busy} onBack={() => setFlow("checkin")} onSubmit={submitReport} />
      )}

      {tab === "tonight" && flow === "planned" && plan && (
        <FlowShell title="You're set" step={5} onBack={() => setFlow(null)}>
          <StateScreen
            kind="success"
            title={`See you at ${plan.venue.name}`}
            body={`Arriving ${plan.arrival ?? "soon"} with ${plan.crew.length} in your crew. Your report is helping the next person decide.`}
            action="Back to Tonight"
            onAction={() => goTab("tonight")}
            secondaryAction="View plan"
            onSecondary={() => goTab("plans")}
          />
        </FlowShell>
      )}

      {tab === "crew" && flow !== "invite" && flow !== "commit" && (
        <CrewView plan={plan} onGoTonight={() => goTab("tonight")} onResume={() => { setTab("crew"); setFlow(plan?.arrival ? "commit" : "invite"); }} />
      )}

      {tab === "plans" && (
        <PlansView plan={plan} history={session.isPreview ? [] : history} isPreview={session.isPreview} onGoTonight={() => goTab("tonight")} />
      )}

      {tab === "profile" && <ProfileView session={session} planCount={plan ? 1 : 0} historyCount={history.length} onSignOut={onSignOut} />}
    </Shell>
  );
}

// ---- Shell -----------------------------------------------------------------

function Shell({
  tab,
  onTab,
  plan,
  toast,
  children,
}: {
  tab: Tab;
  onTab: (t: Tab) => void;
  plan: Plan | null;
  toast?: string | null;
  children: ReactNode;
}) {
  return (
    <main className="app-shell student-shell">
      <div className="student-scene" aria-hidden />
      <div className="student-frame">
        <header className="student-topbar">
          <div>
            <span className="topbar-kicker">Friday night · UIUC</span>
            <strong className="topbar-title">
              {tab === "tonight" && "What's the move?"}
              {tab === "crew" && "Your crew"}
              {tab === "plans" && "Your plans"}
              {tab === "profile" && "Profile"}
            </strong>
          </div>
          <PrototypeTag className="topbar-tag" />
        </header>

        <div className="student-body">{children}</div>

        {toast && <div className="student-toast" role="status">{toast}</div>}

        <nav className="bottom-nav" aria-label="Student navigation">
          {(["tonight", "crew", "plans", "profile"] as Tab[]).map((item) => (
            <button
              key={item}
              type="button"
              className={tab === item ? "active" : ""}
              aria-current={tab === item ? "page" : undefined}
              onClick={() => onTab(item)}
            >
              <NavIcon name={item} />
              <span>{item[0].toUpperCase() + item.slice(1)}</span>
              {item === "crew" && plan && <em className="nav-dot" aria-label="active plan" />}
            </button>
          ))}
        </nav>
      </div>
    </main>
  );
}

// ---- Tonight ---------------------------------------------------------------

function Tonight({
  lead,
  alternatives,
  plan,
  onSeeMove,
  onStartPlan,
  onOpenVenue,
  onGoCrew,
  onGoPlans,
}: {
  lead: Venue;
  alternatives: Venue[];
  plan: Plan | null;
  onSeeMove: () => void;
  onStartPlan: () => void;
  onOpenVenue: (v: Venue) => void;
  onGoCrew: () => void;
  onGoPlans: () => void;
}) {
  const [lean1, lean2] = crewMembers;
  const watching = Math.max(0, lead.friendCount - 2);
  const watchWord = watching === 1 ? "One" : watching === 2 ? "Two" : String(watching);
  const crewLine =
    watching > 0
      ? `${lean1} and ${lean2} are leaning ${lead.name}. ${watchWord} more ${watching === 1 ? "is" : "are"} watching.`
      : `${lean1} and ${lean2} are leaning ${lead.name}.`;

  return (
    <div className="tonight">
      <div className="tonight-main">
        <article className="move-hero">
          <div className="move-hero-top">
            <span className="move-kicker">Tonight&apos;s call</span>
            <span className={`chip chip-${lead.momentum}`}>{momentumCopy(lead.momentum)}</span>
          </div>

          <div className="move-headline">
            <h1 className="move-name">{lead.name}</h1>
            <MomentumMeter momentum={lead.momentum} pct={lead.momentumPct} />
          </div>

          <div className="crew-lean">
            <AvatarStack people={lead.friends} size="md" />
            <p>{crewLine}</p>
          </div>

          <div className="arrive-hero">
            <div className="arrive-main">
              <span className="arrive-label">Best window</span>
              <strong className="arrive-value">{lead.arrivalWindow}</strong>
              <span className="arrive-sub">{lead.peak}</span>
            </div>
            <div className="arrive-support">
              <span className="support-chip"><i className="dot dot-go" aria-hidden />{confidenceCopy(lead.confidence)}</span>
              <span className="support-chip">{lead.updated}</span>
            </div>
          </div>

          <div className="ops-line">
            <span>{lead.cover}</span>
            <span>{lead.age}</span>
            <span>{lead.walkTime}</span>
          </div>

          <div className="hero-actions">
            <button className="btn btn-primary btn-block" onClick={onStartPlan}>Start a plan</button>
            <button className="btn btn-quiet" onClick={onSeeMove} type="button">See why →</button>
          </div>

          <details className="why-call">
            <summary>How Pull Up made this call</summary>
            <p className="why-explain">{lead.explanation}</p>
            <ul className="why-list">
              {lead.evidence.map((item) => <li key={item}>{item}</li>)}
            </ul>
          </details>
        </article>

        <div className="alt-header">
          <h2>Other options</h2>
          <span>ranked by live signal</span>
        </div>
        <div className="alt-list">
          {alternatives.map((venue) => (
            <button key={venue.name} type="button" className={`alt-row momentum-${venue.momentum}`} onClick={() => onOpenVenue(venue)}>
              <span className="alt-row-main">
                <strong>{venue.name}</strong>
                <span className="alt-row-sub">{venue.arrivalWindow} · {venue.walkTime}</span>
              </span>
              <span className="alt-row-side">
                <span className={`chip chip-sm chip-${venue.momentum}`}>{momentumCopy(venue.momentum)}</span>
                <span className="alt-row-friends"><AvatarStack people={venue.friends} /> {venue.friendCount}</span>
              </span>
            </button>
          ))}
        </div>
      </div>

      <aside className="tonight-aside">
        {plan && (
          <Panel title="Tonight's plan">
            <div className="aside-plan">
              <strong>{plan.venue.name}</strong>
              <span className={`plan-status status-${plan.status}`}>{STATUS_LABEL[plan.status]}</span>
              <small>{plan.arrival ? `Arriving ${plan.arrival}` : "Pick a time to lock it in"}</small>
              <button className="btn btn-ghost btn-block" onClick={onGoPlans}>View plan</button>
            </div>
          </Panel>
        )}

        <div className="crew-aside">
          <div className="crew-aside-head">
            <AvatarStack people={lead.friends} size="md" />
            <div>
              <strong>Your crew tonight</strong>
              <small>{lead.crewSubtext}</small>
            </div>
          </div>
          <button className="btn btn-ghost btn-block" onClick={onGoCrew}>Open crew</button>
        </div>
      </aside>
    </div>
  );
}

// ---- Venue detail ----------------------------------------------------------

function VenueDetail({ venue, onBack, onStartPlan }: { venue: Venue; onBack: () => void; onStartPlan: () => void }) {
  const weak = venue.momentum === "no-reliable-call";
  return (
    <div className="detail">
      <button className="back-btn" onClick={onBack} type="button">← Back to tonight</button>
      <div className={`detail-hero ${weak ? "is-weak" : ""}`}>
        <span className={`chip chip-${venue.momentum}`}>{momentumCopy(venue.momentum)}</span>
        <h1>{venue.name}</h1>
        <p>{venue.explanation}</p>
        {!weak ? (
          <div className="social-proof">
            <AvatarStack people={venue.friends} size="md" />
            <div><strong>{venue.crewIntent}</strong><small>{venue.crewSubtext}</small></div>
          </div>
        ) : (
          <div className="weak-note">
            <span aria-hidden>≈</span>
            <p>Pull Up is holding this call until arrivals and host reports agree. We&apos;d rather say &ldquo;not yet&rdquo; than guess.</p>
          </div>
        )}
      </div>

      <div className="signal-tiles four">
        <SignalTile label="Momentum" value={momentumCopy(venue.momentum)} tone={weak ? "hold" : "go"} />
        <SignalTile label="Arrive" value={venue.arrivalWindow} tone={weak ? "hold" : "go"} />
        <SignalTile label="Confidence" value={confidenceCopy(venue.confidence)} />
        <SignalTile label="Freshness" value={venue.updated.replace("Updated ", "")} />
      </div>

      <Panel title="What we're seeing">
        <ul className="evidence">
          {venue.evidence.map((item) => <li key={item}>{item}</li>)}
        </ul>
      </Panel>

      <div className="ops-line detail-ops">
        <span>{venue.cover}</span>
        <span>{venue.age}</span>
        <span>{venue.line}</span>
        <span>{venue.walkTime}</span>
      </div>

      {weak ? (
        <button className="btn btn-secondary btn-block" onClick={onBack}>Watch this spot</button>
      ) : (
        <button className="btn btn-primary btn-block" onClick={onStartPlan}>Start a plan here</button>
      )}
    </div>
  );
}

// ---- Report ----------------------------------------------------------------

function ReportForm({ venue, busy, onBack, onSubmit }: { venue: Venue; busy: boolean; onBack: () => void; onSubmit: (note: string) => void }) {
  const [line, setLine] = useState("moving");
  const [note, setNote] = useState("Line moving steadily; cover matched the listing.");
  const lines = [
    { id: "quiet", label: "Quiet" },
    { id: "moving", label: "Moving steadily" },
    { id: "building", label: "Building fast" },
    { id: "capacity", label: "At capacity" },
  ];
  return (
    <FlowShell title="Report conditions" step={5} onBack={onBack}>
      <div className="plan-lead compact">
        <span className="mini-kicker">{venue.name}</span>
        <h2>How is it right now?</h2>
        <p>Your report is reviewable and never shares a live location trail.</p>
      </div>
      <div className="line-choices">
        {lines.map((option) => (
          <button key={option.id} type="button" className={`line-choice ${line === option.id ? "on" : ""}`} onClick={() => setLine(option.id)}>
            {option.label}
          </button>
        ))}
      </div>
      <label className="field">
        Add a note (optional)
        <input value={note} onChange={(event) => setNote(event.target.value)} />
      </label>
      <button className="btn btn-primary btn-block" disabled={busy} onClick={() => onSubmit(note)}>
        {busy ? "Sending…" : "Submit report"}
      </button>
    </FlowShell>
  );
}

// ---- Crew / Plans / Profile ------------------------------------------------

function CrewView({ plan, onGoTonight, onResume }: { plan: Plan | null; onGoTonight: () => void; onResume: () => void }) {
  if (!plan) {
    return (
      <StateScreen
        kind="empty"
        title="No crew plan yet"
        body="When you start a plan, your crew and their status live here."
        action="Find tonight's move"
        onAction={onGoTonight}
      />
    );
  }
  return (
    <div className="stack">
      <Panel title={`Crew for ${plan.venue.name}`}>
        <div className="crew-people">
          {plan.crew.map((name) => (
            <div key={name} className="crew-person">
              <span className="crew-ava">{name[0]}</span>
              <b>{name}</b>
              <i>{plan.status === "arrived" || plan.status === "reported" ? "There" : "In"}</i>
            </div>
          ))}
          {plan.crew.length === 0 && <p className="muted">No one added yet.</p>}
        </div>
      </Panel>
      <Panel title="Plan status">
        <div className="aside-plan">
          <span className={`plan-status status-${plan.status}`}>{STATUS_LABEL[plan.status]}</span>
          <small>{plan.arrival ? `Arriving ${plan.arrival}` : "No time locked yet"}</small>
        </div>
        <button className="btn btn-primary btn-block" onClick={onResume}>
          {plan.arrival ? "Adjust time" : "Invite & commit"}
        </button>
      </Panel>
    </div>
  );
}

function PlansView({
  plan,
  history,
  isPreview,
  onGoTonight,
}: {
  plan: Plan | null;
  history: AttendanceRow[];
  isPreview: boolean;
  onGoTonight: () => void;
}) {
  if (!plan && history.length === 0) {
    return (
      <StateScreen
        kind="empty"
        title="No plans yet"
        body="Join tonight's move and it'll show up here — with your crew and arrival time."
        action="See tonight"
        onAction={onGoTonight}
      />
    );
  }
  return (
    <div className="stack">
      {plan && (
        <Panel title="Tonight">
          <div className="plan-card">
            <div className="plan-card-top">
              <strong>{plan.venue.name}</strong>
              <span className={`plan-status status-${plan.status}`}>{STATUS_LABEL[plan.status]}</span>
            </div>
            <div className="plan-card-meta">
              <span>{plan.arrival ? `Arriving ${plan.arrival}` : "No time yet"}</span>
              <span>{plan.crew.length} in crew</span>
            </div>
            {plan.note && <p className="plan-note">“{plan.note}”</p>}
          </div>
        </Panel>
      )}
      {!isPreview && history.length > 0 && (
        <Panel title="Saved to your account">
          <ul className="history-list">
            {history.map((item) => (
              <li key={item.id}>
                <b>{item.events?.title ?? "Tonight's plan"}</b>
                <span className={`plan-status status-${normalizeStatus(item.status)}`}>{prettyStatus(item.status)}</span>
              </li>
            ))}
          </ul>
        </Panel>
      )}
    </div>
  );
}

function ProfileView({
  session,
  planCount,
  historyCount,
  onSignOut,
}: {
  session: Session;
  planCount: number;
  historyCount: number;
  onSignOut: () => void;
}) {
  const initials = session.displayName.split(" ").map((p) => p[0]).join("").slice(0, 2).toUpperCase();
  return (
    <div className="stack">
      <div className="profile-head">
        <span className="profile-ava">{initials}</span>
        <div>
          <strong>{session.displayName}</strong>
          <small>{session.email}</small>
        </div>
      </div>

      <Panel title="Privacy">
        <ul className="setting-list">
          <li><b>Who sees your plans</b><span>Your crew — never venues</span></li>
          <li><b>Location</b><span>Intent only · no live trail</span></li>
          <li><b>Tonight</b><span>{planCount ? "1 active plan" : "No active plan"}</span></li>
          <li><b>Saved history</b><span>{session.isPreview ? "Preview only" : `${historyCount} item${historyCount === 1 ? "" : "s"}`}</span></li>
        </ul>
      </Panel>

      {session.canHostUnofficial && (
        <Panel title="Hosting">
          <p className="muted">You can start an unofficial party plan for your crew.</p>
          <a className="btn btn-ghost btn-block" href="/host">Open hosting</a>
        </Panel>
      )}

      <Panel title="Account">
        {session.isPreview && <p className="preview-note">You&apos;re in preview mode with sample activity.</p>}
        <button className="btn btn-secondary btn-block" onClick={onSignOut}>Sign out</button>
      </Panel>

      <PrototypeTag className="profile-tag" />
    </div>
  );
}

// ---- Small building blocks -------------------------------------------------

function FlowShell({
  title,
  step,
  onBack,
  hideBack,
  children,
}: {
  title: string;
  step: number;
  onBack: () => void;
  hideBack?: boolean;
  children: ReactNode;
}) {
  return (
    <div className="flow">
      <div className="flow-head">
        {!hideBack ? (
          <button className="back-btn" type="button" onClick={onBack}>← Back</button>
        ) : (
          <span />
        )}
        <span className="flow-title">{title}</span>
        <span className="flow-step">Step {step} of 5</span>
      </div>
      <div className="flow-progress" aria-hidden>
        {[1, 2, 3, 4, 5].map((n) => (
          <i key={n} className={n <= step ? "on" : ""} />
        ))}
      </div>
      <div className="flow-body">{children}</div>
    </div>
  );
}

function NavIcon({ name }: { name: Tab }) {
  const paths: Record<Tab, ReactNode> = {
    tonight: <path d="M12 3l2.4 5.6L20 11l-5.6 2.4L12 19l-2.4-5.6L4 11l5.6-2.4z" />,
    crew: (
      <>
        <circle cx="8" cy="9" r="3" />
        <circle cx="16" cy="9" r="3" />
        <path d="M3 19c0-2.8 2.2-5 5-5s5 2.2 5 5M13 19c0-2.8 2.2-5 5-5" />
      </>
    ),
    plans: (
      <>
        <rect x="4" y="5" width="16" height="15" rx="2" />
        <path d="M4 9h16M8 3v4M16 3v4" />
      </>
    ),
    profile: (
      <>
        <circle cx="12" cy="8" r="3.4" />
        <path d="M5 20c0-3.6 3.1-6 7-6s7 2.4 7 6" />
      </>
    ),
  };
  return (
    <svg viewBox="0 0 24 24" fill={name === "tonight" ? "currentColor" : "none"} stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      {paths[name]}
    </svg>
  );
}

// ---- Data helpers ----------------------------------------------------------

async function api<T>(session: Session, path: string, init: RequestInit = {}): Promise<T> {
  // Use a fresh (auto-refreshed) access token for real sessions.
  const token = session.isPreview ? session.accessToken : (await getAccessToken()) ?? session.accessToken;
  const response = await fetch(path, {
    ...init,
    headers: {
      authorization: `Bearer ${token}`,
      "content-type": "application/json",
      ...(init.headers ?? {}),
    },
  });
  if (response.status === 401) {
    const error = new Error("expired");
    error.name = "Expired";
    throw error;
  }
  if (!response.ok) throw new Error(`Request failed with ${response.status}`);
  return (await response.json()) as T;
}

function normalizeStatus(status: string): PlanStatus {
  if (status === "arrived") return "arrived";
  if (status === "going") return "going";
  if (status === "interested") return "interested";
  return "none";
}

function prettyStatus(status: string) {
  return STATUS_LABEL[normalizeStatus(status)];
}
