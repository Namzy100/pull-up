"use client";

import { useEffect, useMemo, useSyncExternalStore } from "react";
import Entry from "./Entry";
import StudentApp from "./StudentApp";
import HostApp from "./HostApp";
import AdminApp from "./AdminApp";
import { Brand, StateScreen } from "./ui";
import { clearSession, loadSession, safeReturnTo, type Session } from "../lib/session";
import { getSupabaseSession, signOutSupabase } from "../lib/supabaseAuth";
import type { AccountType } from "../pull-up-data";

function destinationForRole(role: AccountType) {
  if (role === "host") return "/host";
  if (role === "admin") return "/admin";
  return "/student";
}

function isAllowed(session: Session, role: AccountType): boolean {
  if (session.accountType === role) return true;
  // A student enabled for unofficial hosting may open the host surface.
  return role === "host" && session.accountType === "student" && session.canHostUnofficial;
}

// Hydration-safe "are we on the client?" without setState-in-effect.
function useIsClient() {
  return useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );
}

export default function PullUpClientApp({ requiredRole }: { requiredRole?: AccountType }) {
  const isClient = useIsClient();
  const session = useMemo<Session | null>(() => (isClient ? loadSession() : null), [isClient]);
  const redirectingHome = Boolean(isClient && !requiredRole && session);

  // Entry route: authenticated users go straight to their app (navigation only).
  useEffect(() => {
    if (redirectingHome && session) {
      window.location.replace(destinationForRole(session.accountType));
    }
  }, [redirectingHome, session]);

  // Reconcile a stored real session against Supabase: if the auth session is
  // gone (signed out elsewhere / refresh token expired), drop the stale app session.
  useEffect(() => {
    if (!isClient || !session || session.isPreview) return;
    let cancelled = false;
    getSupabaseSession()
      .then((supabaseSession) => {
        if (!cancelled && !supabaseSession) {
          clearSession();
          window.location.reload();
        }
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [isClient, session]);

  async function signOut() {
    try {
      await signOutSupabase();
    } catch {
      // ignore — clear local state regardless
    }
    clearSession();
    window.location.assign("/");
  }

  // Neutral shell during SSR + first client paint (localStorage is client-only).
  if (!isClient || redirectingHome) return <Boot />;

  // Entry route ("/").
  if (!requiredRole) {
    if (session) return <Boot />; // redirect in flight
    const params = new URLSearchParams(window.location.search);
    return <Entry returnTo={safeReturnTo(params.get("returnTo"))} />;
  }

  // Protected routes with no session → send to entry, preserving destination.
  if (!session) {
    return <Entry returnTo={`/${requiredRole}`} />;
  }

  // Wrong role → permission denied, with a door to their own app.
  if (!isAllowed(session, requiredRole)) {
    return (
      <main className="app-shell auth-shell">
        <div className="auth-ambient" aria-hidden />
        <div className="auth-panel">
          <div className="auth-brand-row"><Brand /></div>
          <StateScreen
            kind="denied"
            title={`This is the ${requiredRole} door`}
            body={`You're signed in as a ${session.accountType}. Pull Up keeps student, host, and admin surfaces separate so private data never crosses over.`}
            action="Go to my app"
            onAction={() => window.location.assign(destinationForRole(session.accountType))}
            secondaryAction="Sign out"
            onSecondary={signOut}
          />
        </div>
      </main>
    );
  }

  if (requiredRole === "student") return <StudentApp session={session} onSignOut={signOut} />;
  if (requiredRole === "host") return <HostApp session={session} onSignOut={signOut} />;
  return <AdminApp session={session} onSignOut={signOut} />;
}

function Boot() {
  return (
    <main className="app-shell boot-shell">
      <div className="auth-ambient" aria-hidden />
      <div className="boot-inner">
        <Brand />
        <span className="boot-spinner" aria-hidden />
      </div>
    </main>
  );
}
