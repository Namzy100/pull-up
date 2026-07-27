"use client";

import type { ReactNode } from "react";
import type { MomentumState } from "../pull-up-data";

/** Brand wordmark with the green→blue identity. */
export function Brand({ small }: { small?: boolean }) {
  return (
    <span className={small ? "brand brand-sm" : "brand"}>
      <span className="brand-dot" aria-hidden />
      Pull Up
    </span>
  );
}

/** Stacked friend avatars for social proof. */
export function AvatarStack({ people, size }: { people: string[]; size?: "sm" | "md" }) {
  const shown = people.slice(0, 4);
  const extra = people.length - shown.length;
  return (
    <div className={`avatar-stack ${size === "md" ? "avatar-stack-md" : ""}`} aria-hidden>
      {shown.map((initials, index) => (
        <span key={`${initials}-${index}`} style={{ zIndex: shown.length - index }}>
          {initials}
        </span>
      ))}
      {extra > 0 && <span className="avatar-extra">+{extra}</span>}
    </div>
  );
}

/** Momentum bar; renders an honest "holding" state when there is no reliable call. */
export function MomentumMeter({ momentum, pct }: { momentum: MomentumState; pct: number }) {
  if (momentum === "no-reliable-call") {
    return (
      <div className="momentum-meter is-holding" aria-label="No reliable call yet">
        <span className="momentum-holding-track" />
      </div>
    );
  }
  return (
    <div className={`momentum-meter momentum-${momentum}`} aria-label={`Momentum ${pct} percent`}>
      <span className="momentum-fill" style={{ width: `${Math.max(8, Math.min(100, pct))}%` }} />
    </div>
  );
}

/** Small labelled signal tile so momentum / timing / confidence / freshness stay visually distinct. */
export function SignalTile({
  label,
  value,
  sub,
  tone,
}: {
  label: string;
  value: string;
  sub?: string;
  tone?: "go" | "hold" | "neutral";
}) {
  return (
    <div className={`signal-tile tone-${tone ?? "neutral"}`}>
      <span className="signal-tile-label">{label}</span>
      <strong className="signal-tile-value">{value}</strong>
      {sub && <small className="signal-tile-sub">{sub}</small>}
    </div>
  );
}

export type StateKind = "loading" | "empty" | "weak" | "denied" | "expired" | "success" | "error";

/** One shared full-surface state screen for loading / empty / error / denied / expired / success. */
export function StateScreen({
  kind,
  title,
  body,
  action,
  onAction,
  secondaryAction,
  onSecondary,
}: {
  kind: StateKind;
  title: string;
  body: string;
  action?: string;
  onAction?: () => void;
  secondaryAction?: string;
  onSecondary?: () => void;
}) {
  const icon: Record<StateKind, string> = {
    loading: "◌",
    empty: "☾",
    weak: "≈",
    denied: "⛌",
    expired: "⏲",
    success: "✓",
    error: "!",
  };
  return (
    <div className={`state-screen state-${kind}`} role={kind === "error" || kind === "denied" ? "alert" : "status"}>
      <span className={`state-icon ${kind === "loading" ? "is-spinning" : ""}`} aria-hidden>
        {icon[kind]}
      </span>
      <h2>{title}</h2>
      <p>{body}</p>
      {(action || secondaryAction) && (
        <div className="state-actions">
          {action && (
            <button className="btn btn-primary" onClick={onAction} type="button">
              {action}
            </button>
          )}
          {secondaryAction && (
            <button className="btn btn-ghost" onClick={onSecondary} type="button">
              {secondaryAction}
            </button>
          )}
        </div>
      )}
    </div>
  );
}

/** Quiet, single global disclosure that the night is sample activity. */
export function PrototypeTag({ className }: { className?: string }) {
  return (
    <span className={`prototype-tag ${className ?? ""}`} title="Sample activity for this prototype">
      <span className="prototype-dot" aria-hidden />
      Prototype night · sample activity
    </span>
  );
}

export function Panel({
  title,
  children,
  aside,
}: {
  title?: string;
  children: ReactNode;
  aside?: ReactNode;
}) {
  return (
    <section className="panel">
      {(title || aside) && (
        <div className="panel-head">
          {title && <h3>{title}</h3>}
          {aside}
        </div>
      )}
      {children}
    </section>
  );
}
