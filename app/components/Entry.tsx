"use client";

import { useState } from "react";
import { Brand, PrototypeTag } from "./ui";
import { venues, type AccountType } from "../pull-up-data";
import { saveSession, sessionFromSupabase } from "../lib/session";
import { CAMPUS_EMAIL_HINT, isCampusEmail } from "../lib/authRules";
import { readConfig, requireReadyConfig } from "../lib/config";
import {
  ensureProfile,
  requestPasswordReset,
  signIn,
  signUp,
} from "../lib/supabaseAuth";

type Mode = "signin" | "signup" | "reset";

function destinationForRole(role: AccountType, returnTo: string) {
  if (role === "host") return "/host";
  if (role === "admin") return "/admin";
  return returnTo || "/student";
}

export default function Entry({ returnTo }: { returnTo: string }) {
  const [mode, setMode] = useState<Mode>("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [sentTo, setSentTo] = useState<string | null>(null);

  const lead = venues[0];

  function enterPreview() {
    saveSession({
      accessToken: "preview",
      accountType: "student",
      canHostUnofficial: true,
      displayName: "Sarah Patel",
      email: "sarah@illinois.edu",
      isPreview: true,
    });
    window.location.assign(returnTo || "/student");
  }

  async function submit() {
    setError(null);
    setNotice(null);
    if (!email.trim()) {
      setError("Enter your campus email to continue.");
      return;
    }
    if (mode !== "reset" && password.length < 6) {
      setError("Enter your password to continue.");
      return;
    }
    if (mode === "signup" && !isCampusEmail(email)) {
      setError(CAMPUS_EMAIL_HINT);
      return;
    }
    setLoading(true);
    try {
      const ready = requireReadyConfig(await readConfig());
      if (!ready) {
        setNotice(
          "Real accounts turn on once Supabase keys are set for this environment. For now, tap “Preview tonight” to explore the app.",
        );
        return;
      }
      const redirectTo = `${window.location.origin}/auth/callback`;
      const address = email.trim();

      if (mode === "reset") {
        await requestPasswordReset(address, redirectTo);
        setSentTo(address);
        setNotice(null);
        return;
      }

      if (mode === "signup") {
        const { session, needsConfirmation } = await signUp(address, password, redirectTo);
        if (needsConfirmation || !session) {
          setSentTo(address);
          return;
        }
        const profile = await ensureProfile(session.access_token, session.user.email ?? address);
        saveSession(sessionFromSupabase(session, profile));
        window.location.assign(destinationForRole(profile.account_type, returnTo));
        return;
      }

      const session = await signIn(address, password);
      const profile = await ensureProfile(session.access_token, session.user.email ?? address);
      saveSession(sessionFromSupabase(session, profile));
      window.location.assign(destinationForRole(profile.account_type, returnTo));
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Something went wrong. Try again.");
    } finally {
      setLoading(false);
    }
  }

  if (sentTo) {
    return (
      <main className="app-shell auth-shell">
        <div className="auth-ambient" aria-hidden />
        <div className="auth-panel">
          <div className="auth-brand-row">
            <Brand />
          </div>
          <div className="auth-heading">
            <span className="check-mark" aria-hidden>✓</span>
            <h1>Check your inbox</h1>
            <p className="auth-sub">
              We sent a link to <strong>{sentTo}</strong>. Open it on this device to
              {mode === "reset" ? " reset your password" : " confirm your account"} and jump into tonight.
            </p>
          </div>
          <button className="btn btn-ghost btn-block" type="button" onClick={() => { setSentTo(null); setMode("signin"); }}>
            Back to sign in
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="app-shell auth-shell">
      <div className="auth-ambient" aria-hidden />

      <section className="auth-hero" aria-hidden>
        <div className="auth-hero-inner">
          <Brand />
          <p className="auth-hero-kicker">Friday night · UIUC</p>
          <h2 className="auth-hero-line">
            Know where campus is <em>actually</em> going tonight.
          </h2>
          <div className="auth-hero-card">
            <div className="ahc-top">
              <span className="ahc-kicker">What&apos;s the move?</span>
              <span className={`chip chip-${lead.momentum}`}>Building fast</span>
            </div>
            <strong className="ahc-name">{lead.name}</strong>
            <p className="ahc-sub">{lead.crewIntent} · {lead.arrivalWindow}</p>
            <div className="ahc-meter"><span style={{ width: `${lead.momentumPct}%` }} /></div>
          </div>
          <PrototypeTag />
        </div>
      </section>

      <div className="auth-panel">
        <div className="auth-brand-row auth-brand-row-mobile">
          <Brand />
        </div>
        <form
          className="auth-form"
          onSubmit={(event) => {
            event.preventDefault();
            submit();
          }}
        >
          <div className="auth-heading">
            <p className="eyebrow">{mode === "reset" ? "Reset password" : "Welcome"}</p>
            <h1>
              {mode === "signin" && "Sign in to Pull Up"}
              {mode === "signup" && "Create your account"}
              {mode === "reset" && "Reset your password"}
            </h1>
            <p className="auth-sub">
              {mode === "signin" && "Pick up tonight's plan and your crew."}
              {mode === "signup" && "Use your campus email so friend context stays private."}
              {mode === "reset" && "We'll email you a secure link to set a new password."}
            </p>
          </div>

          <label className="field">
            Campus email
            <input
              type="email"
              inputMode="email"
              autoComplete="email"
              placeholder="you@illinois.edu"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
            />
          </label>

          {mode !== "reset" && (
            <label className="field">
              <span className="field-row">
                Password
                {mode === "signin" && (
                  <button type="button" className="link-btn" onClick={() => { setMode("reset"); setError(null); setNotice(null); }}>
                    Forgot?
                  </button>
                )}
              </span>
              <input
                type="password"
                autoComplete={mode === "signup" ? "new-password" : "current-password"}
                placeholder="••••••••"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
              />
            </label>
          )}

          {error && <p className="form-error" role="alert">{error}</p>}
          {notice && <p className="form-notice" role="status">{notice}</p>}

          <button className="btn btn-primary btn-block" type="submit" disabled={loading}>
            {loading
              ? "Working…"
              : mode === "signin"
                ? "Sign in"
                : mode === "signup"
                  ? "Create account"
                  : "Send reset link"}
          </button>

          <button type="button" className="btn btn-preview btn-block" onClick={enterPreview}>
            Preview tonight
            <span className="btn-preview-sub">No account · sample night</span>
          </button>

          <p className="auth-switch">
            {mode === "signin" && (
              <>New here?{" "}
                <button type="button" className="link-btn" onClick={() => { setMode("signup"); setError(null); setNotice(null); }}>
                  Create an account
                </button>
              </>
            )}
            {mode === "signup" && (
              <>Already have an account?{" "}
                <button type="button" className="link-btn" onClick={() => { setMode("signin"); setError(null); setNotice(null); }}>
                  Sign in
                </button>
              </>
            )}
            {mode === "reset" && (
              <button type="button" className="link-btn" onClick={() => { setMode("signin"); setError(null); setNotice(null); }}>
                Back to sign in
              </button>
            )}
          </p>
        </form>
      </div>
    </main>
  );
}
