"use client";

import { useState } from "react";
import { Panel, PrototypeTag } from "./ui";
import type { Session } from "../lib/session";

export default function HostApp({ session, onSignOut }: { session: Session; onSignOut: () => void }) {
  const unofficial = session.accountType === "student";
  const [line, setLine] = useState("moving");
  const [capacity, setCapacity] = useState(72);
  const [submitted, setSubmitted] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  function flash(message: string) {
    setToast(message);
    window.setTimeout(() => setToast((c) => (c === message ? null : c)), 2400);
  }

  const lines = [
    { id: "quiet", label: "Quiet" },
    { id: "moving", label: "Moving steadily" },
    { id: "building", label: "Building fast" },
    { id: "capacity", label: "At capacity" },
  ];

  return (
    <main className="app-shell ops-shell">
      <div className="student-scene" aria-hidden />
      <div className="ops-frame">
        <header className="ops-topbar">
          <div>
            <span className="topbar-kicker">{unofficial ? "Unofficial host" : "Host console"} · UIUC</span>
            <strong className="topbar-title">{unofficial ? "Your party" : "Tonight at Joe's"}</strong>
          </div>
          <PrototypeTag />
        </header>

        <div className="ops-body">
          <div className="ops-col">
            <Panel title="Submit an event" aside={<span className="pill-status">{submitted ? "In review" : "Draft"}</span>}>
              <form
                className="ops-form"
                onSubmit={(event) => {
                  event.preventDefault();
                  setSubmitted(true);
                  flash("Sent to Pull Up review");
                }}
              >
                <label className="field">Event name<input defaultValue={unofficial ? "Apartment pregame" : "Friday Night at Joe's"} /></label>
                <div className="field-2col">
                  <label className="field">
                    Type
                    <select defaultValue={unofficial ? "house" : "bar"}>
                      <option value="bar">Bar</option>
                      <option value="frat">Frat</option>
                      <option value="pub">Pub</option>
                      <option value="house">House party</option>
                    </select>
                  </label>
                  <label className="field">Age rule<input defaultValue="19+" /></label>
                </div>
                <div className="field-2col">
                  <label className="field">Cover<input defaultValue="$5 after 10:30" /></label>
                  <label className="field">Doors<input defaultValue="10:00 PM" /></label>
                </div>
                <button className="btn btn-primary btn-block" type="submit">
                  {submitted ? "Update review request" : "Submit for review"}
                </button>
              </form>
            </Panel>
          </div>

          <div className="ops-col">
            <Panel title="Report live conditions">
              <p className="muted">Facts you report are attributable and reviewable. They inform evidence — they never set ranking directly.</p>
              <div className="line-choices">
                {lines.map((option) => (
                  <button key={option.id} type="button" className={`line-choice ${line === option.id ? "on" : ""}`} onClick={() => setLine(option.id)}>
                    {option.label}
                  </button>
                ))}
              </div>
              <label className="field">
                Capacity pressure · {capacity}%
                <input type="range" min={0} max={100} value={capacity} onChange={(event) => setCapacity(Number(event.target.value))} />
              </label>
              <div className="capacity-track" aria-hidden><span style={{ width: `${capacity}%` }} /></div>
              <button className="btn btn-primary btn-block" type="button" onClick={() => flash("Factual update sent")}>Send update</button>
            </Panel>

            <Panel title="What Pull Up shows you">
              <ul className="setting-list">
                <li><b>Aggregate demand</b><span>Yes</span></li>
                <li><b>Student names or crews</b><span>Never</span></li>
                <li><b>Setting momentum directly</b><span>Not allowed</span></li>
              </ul>
            </Panel>

            <Panel title="Account">
              <button className="btn btn-secondary btn-block" onClick={onSignOut}>Sign out</button>
            </Panel>
          </div>
        </div>

        {toast && <div className="student-toast" role="status">{toast}</div>}
      </div>
    </main>
  );
}
