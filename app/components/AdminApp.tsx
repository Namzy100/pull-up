"use client";

import { useState } from "react";
import { Panel, PrototypeTag } from "./ui";
import { adminQueue, riskCopy } from "../pull-up-data";
import type { Session } from "../lib/session";

export default function AdminApp({ onSignOut }: { session: Session; onSignOut: () => void }) {
  const [decided, setDecided] = useState<Record<string, string>>({});
  const [toast, setToast] = useState<string | null>(null);

  function decide(key: string, decision: string) {
    setDecided((current) => ({ ...current, [key]: decision }));
    setToast(decision === "keep" ? "Kept abstained" : "Host report downweighted");
    window.setTimeout(() => setToast(null), 2400);
  }

  return (
    <main className="app-shell ops-shell">
      <div className="student-scene" aria-hidden />
      <div className="ops-frame">
        <header className="ops-topbar">
          <div>
            <span className="topbar-kicker">Trust console · UIUC</span>
            <strong className="topbar-title">Protect the call</strong>
          </div>
          <PrototypeTag />
        </header>

        <div className="ops-body">
          <div className="ops-col">
            <Panel title="Needs a decision">
              <ul className="queue">
                {adminQueue.map((item) => (
                  <li key={item.title} className={`queue-row risk-${item.risk}`}>
                    <div>
                      <strong>{item.title}</strong>
                      <small>{item.venue} · {item.detail}</small>
                    </div>
                    <span className={`risk-pill risk-${item.risk}`}>{riskCopy(item.risk)}</span>
                  </li>
                ))}
              </ul>
            </Panel>
          </div>

          <div className="ops-col">
            <Panel title="Evidence replay · The Red Lion">
              <div className="signal-tiles four">
                <div className="signal-tile tone-hold"><span className="signal-tile-label">Student sees</span><strong className="signal-tile-value">No call</strong></div>
                <div className="signal-tile"><span className="signal-tile-label">Confidence</span><strong className="signal-tile-value">Low</strong></div>
                <div className="signal-tile"><span className="signal-tile-label">Report age</span><strong className="signal-tile-value">31m</strong></div>
                <div className="signal-tile tone-hold"><span className="signal-tile-label">Manipulation</span><strong className="signal-tile-value">High</strong></div>
              </div>
              <ul className="ledger">
                <li>Host report<b>line building</b></li>
                <li>Verified arrivals<b>too sparse</b></li>
                <li>Ambassador report<b>missing</b></li>
                <li>Current effect<b>{decided["redlion"] === "downweight" ? "host downweighted" : "kept abstained"}</b></li>
              </ul>
              <div className="ops-actions">
                <button className={`btn ${decided["redlion"] === "keep" ? "btn-primary" : "btn-secondary"}`} onClick={() => decide("redlion", "keep")}>Keep abstained</button>
                <button className={`btn ${decided["redlion"] === "downweight" ? "btn-primary" : "btn-secondary"}`} onClick={() => decide("redlion", "downweight")}>Downweight host report</button>
              </div>
            </Panel>

            <Panel title="Reporter reliability">
              <ul className="setting-list">
                <li><b>Facts that match evidence</b><span>Accepted</span></li>
                <li><b>Repeated overstatement</b><span>Lowers weight</span></li>
                <li><b>Weak evidence</b><span>Publishes “no call”</span></li>
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
