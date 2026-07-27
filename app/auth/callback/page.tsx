"use client";

import { useEffect, useState } from "react";
import type { Session as SupabaseSession } from "@supabase/supabase-js";
import { Brand, StateScreen } from "../../components/ui";
import { parseCallbackParams } from "../../lib/authRules";
import { readConfig, requireReadyConfig } from "../../lib/config";
import { getSupabaseClient } from "../../lib/supabaseClient";
import {
  ensureProfile,
  exchangeCodeForSession,
  getSupabaseSession,
  updatePassword,
  verifyTokenHash,
} from "../../lib/supabaseAuth";
import { saveSession, sessionFromSupabase, safeReturnTo } from "../../lib/session";
import type { AccountType } from "../../pull-up-data";

type Phase =
  | { kind: "working" }
  | { kind: "error"; title: string; body: string }
  | { kind: "recover"; email: string };

const FRIENDLY_AUTH_ERRORS: Record<string, string> = {
  otp_expired: "This link has expired. Request a fresh one and it will work.",
  access_denied: "This link is no longer valid. Request a fresh one to continue.",
};

function destinationForRole(role: AccountType) {
  if (role === "host") return "/host";
  if (role === "admin") return "/admin";
  return safeReturnTo("/student");
}

export default function AuthCallbackPage() {
  const [phase, setPhase] = useState<Phase>({ kind: "working" });
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    const fail = (title: string, body: string) => {
      if (!cancelled) setPhase({ kind: "error", title, body });
    };

    async function run() {
      const params = parseCallbackParams(window.location.hash, window.location.search);
      // Never let credentials linger in the address bar.
      window.history.replaceState(null, "", window.location.pathname);

      if (params.kind === "error") {
        fail(
          "Link no longer valid",
          (params.errorCode && FRIENDLY_AUTH_ERRORS[params.errorCode]) ||
            "This link is invalid or has expired. Request a fresh one to continue.",
        );
        return;
      }
      if (params.kind === "none") {
        fail(
          "Nothing to confirm",
          "This page finishes a Pull Up email link. Open the most recent link from your inbox, or head back to sign in.",
        );
        return;
      }

      let ready;
      try {
        ready = requireReadyConfig(await readConfig());
      } catch {
        fail("We hit a snag", "Pull Up could not be reached. Try the link again in a moment.");
        return;
      }
      if (!ready) {
        fail(
          "Not available in preview",
          "Email confirmation runs on the deployed Pull Up app. In local preview you can jump straight in from the entry screen.",
        );
        return;
      }

      let session: SupabaseSession;
      try {
        if (params.kind === "code") {
          session = await exchangeCodeForSession(params.code!);
        } else if (params.kind === "token_hash") {
          session = await verifyTokenHash(params.type, params.tokenHash!);
        } else {
          // implicit hash tokens (legacy fallback)
          const supabase = await getSupabaseClient();
          if (!supabase || !params.refreshToken) throw new Error("no-session");
          const { data, error } = await supabase.auth.setSession({
            access_token: params.accessToken!,
            refresh_token: params.refreshToken,
          });
          if (error || !data.session) throw new Error("no-session");
          session = data.session;
        }
      } catch {
        fail(
          "Link no longer valid",
          "We could not complete this link. Request a fresh confirmation or reset email and try again.",
        );
        return;
      }

      // Password recovery: collect a new password before entering the app.
      if (params.type === "recovery") {
        if (!cancelled) setPhase({ kind: "recover", email: session.user.email ?? "" });
        return;
      }

      // Email confirmation / magic sign-in: create/read profile and enter the app.
      try {
        const email = session.user.email ?? "";
        const profile = await ensureProfile(session.access_token, email);
        saveSession(sessionFromSupabase(session, profile));
        if (!cancelled) window.location.replace(destinationForRole(profile.account_type));
      } catch {
        fail(
          "Almost there",
          "Your email is confirmed, but we could not finish sign-in automatically. Please sign in from the entry screen.",
        );
      }
    }

    run();
    return () => {
      cancelled = true;
    };
  }, []);

  async function submitNewPassword() {
    setFormError(null);
    if (password.length < 8) {
      setFormError("Use at least 8 characters.");
      return;
    }
    if (password !== confirm) {
      setFormError("Those passwords do not match.");
      return;
    }
    setSubmitting(true);
    try {
      await updatePassword(password);
      const session = await getSupabaseSession();
      if (!session) throw new Error("no-session");
      const profile = await ensureProfile(session.access_token, session.user.email ?? "");
      saveSession(sessionFromSupabase(session, profile));
      window.location.replace(destinationForRole(profile.account_type));
    } catch (error) {
      setFormError(error instanceof Error ? error.message : "We could not update your password.");
      setSubmitting(false);
    }
  }

  return (
    <main className="app-shell auth-shell">
      <div className="auth-ambient" aria-hidden />
      <div className="auth-panel">
        <div className="auth-brand-row">
          <Brand />
        </div>

        {phase.kind === "working" && (
          <StateScreen kind="loading" title="Finishing up" body="Confirming your Pull Up link…" />
        )}

        {phase.kind === "error" && (
          <StateScreen
            kind={phase.title === "Almost there" ? "success" : "expired"}
            title={phase.title}
            body={phase.body}
            action="Back to sign in"
            onAction={() => window.location.replace("/")}
          />
        )}

        {phase.kind === "recover" && (
          <form
            className="auth-form"
            onSubmit={(event) => {
              event.preventDefault();
              submitNewPassword();
            }}
          >
            <div className="auth-heading">
              <p className="eyebrow">Reset password</p>
              <h1>Choose a new password</h1>
              <p className="auth-sub">{phase.email ? `For ${phase.email}` : "Set a new password to get back in."}</p>
            </div>
            <label className="field">
              New password
              <input
                type="password"
                autoComplete="new-password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
              />
            </label>
            <label className="field">
              Confirm password
              <input
                type="password"
                autoComplete="new-password"
                value={confirm}
                onChange={(event) => setConfirm(event.target.value)}
              />
            </label>
            {formError && <p className="form-error" role="alert">{formError}</p>}
            <button className="btn btn-primary btn-block" type="submit" disabled={submitting}>
              {submitting ? "Saving…" : "Save and continue"}
            </button>
          </form>
        )}
      </div>
    </main>
  );
}
