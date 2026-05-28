"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

import { SessionHydrationRecovery } from "@/components/auth/session-hydration-recovery";
import {
  hydrationErrorMessage,
  logAuthHydration,
  logPwaDisplayContext,
  SESSION_HYDRATION_TIMEOUT_MS,
  withTimeout,
} from "@/lib/auth-hydration";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { hasSupabaseEnv } from "@/lib/supabase/env";
import { syncProfileStateFromSupabase } from "@/lib/supabase/client-persistence";
import { useAppStore } from "@/store/use-app-store";

function ensureAuthReady(
  hydrateLoggedOut: () => void,
  resetToDemoDefaults: () => void,
  reason: string
) {
  const { authReady } = useAppStore.getState();
  if (authReady) {
    logAuthHydration("auth_ready_already_set", { reason });
    return;
  }
  const demo =
    typeof window !== "undefined" && window.localStorage.getItem("pu_demo_mode") === "1";
  if (demo) {
    resetToDemoDefaults();
  } else {
    hydrateLoggedOut();
  }
  logAuthHydration("auth_ready_set", { reason, demo });
}

export function SessionSync() {
  const router = useRouter();
  const hydrateFromSupabase = useAppStore((s) => s.hydrateFromSupabase);
  const hydrateLoggedOut = useAppStore((s) => s.hydrateLoggedOut);
  const resetToDemoDefaults = useAppStore((s) => s.resetToDemoDefaults);
  const clearSessionScopedState = useAppStore((s) => s.clearSessionScopedState);
  const logout = useAppStore((s) => s.logout);

  const [restoreFailed, setRestoreFailed] = useState(false);
  const [recoveryMessage, setRecoveryMessage] = useState<string | null>(null);
  const [retryBusy, setRetryBusy] = useState(false);
  const mountedRef = useRef(true);
  const syncInFlightRef = useRef(false);

  const runSync = useCallback(
    async (trigger: string) => {
      const before = useAppStore.getState();
      logAuthHydration("boot_start", { trigger, path: typeof window !== "undefined" ? window.location.pathname : null });
      logAuthHydration("store_auth_state_before_boot", {
        trigger,
        authReady: before.authReady,
        authUserId: before.authUserId ?? null,
        path: typeof window !== "undefined" ? window.location.pathname : null,
      });
      if (syncInFlightRef.current) {
        logAuthHydration("session_restore_skipped", { trigger, reason: "in_flight" });
        return;
      }
      syncInFlightRef.current = true;
      setRetryBusy(true);
      setRestoreFailed(false);
      setRecoveryMessage(null);

      logAuthHydration("session_restore_start", { trigger });

      try {
        if (!hasSupabaseEnv()) {
          const demo =
            typeof window !== "undefined" &&
            window.localStorage.getItem("pu_demo_mode") === "1";
          if (demo) {
            resetToDemoDefaults();
          } else {
            hydrateLoggedOut();
          }
          logAuthHydration("session_restore_success", { trigger, mode: "no_env" });
          logAuthHydration("hydration_complete", { trigger, mode: "no_env" });
          logAuthHydration("auth_ready_set", { reason: "no_env", demo });
          return;
        }

        clearSessionScopedState();
        logAuthHydration("profile_fetch_start", { trigger });

        const data = await withTimeout(
          syncProfileStateFromSupabase({ log: true }),
          SESSION_HYDRATION_TIMEOUT_MS,
          "syncProfileStateFromSupabase"
        );

        if (!mountedRef.current) return;

        logAuthHydration("profile_fetch_end", { trigger, hasUser: Boolean(data) });
        logAuthHydration("supabase_session_result", {
          trigger,
          path: typeof window !== "undefined" ? window.location.pathname : null,
          hasSession: Boolean(data),
          authUserId: data?.userId ?? null,
          profileExists: Boolean(data?.profile),
          onboarding_complete: data?.profile?.onboardingComplete ?? null,
        });

        const demo =
          typeof window !== "undefined" &&
          window.localStorage.getItem("pu_demo_mode") === "1";

        if (!data) {
          if (demo) {
            resetToDemoDefaults();
          } else {
            hydrateLoggedOut();
          }
          logAuthHydration("session_restore_success", { trigger, mode: "logged_out" });
          logAuthHydration("hydration_complete", { trigger, mode: "logged_out" });
          logAuthHydration("auth_ready_set", { reason: "no_session", demo });
          logAuthHydration("route_decision", {
            trigger,
            path: typeof window !== "undefined" ? window.location.pathname : null,
            hasSession: false,
            authUserId: null,
            authReady: true,
            profileExists: false,
            onboarding_complete: null,
            destination: "/login",
          });
          return;
        }

        if (demo && typeof window !== "undefined") {
          window.localStorage.removeItem("pu_demo_mode");
        }
        hydrateFromSupabase(data);
        logAuthHydration("session_restore_success", { trigger, mode: "hydrated" });
        logAuthHydration("hydration_complete", { trigger, userId: data.userId });
        logAuthHydration("auth_ready_set", { reason: "hydrated", demo: false });
        logAuthHydration("route_decision", {
          trigger,
          path: typeof window !== "undefined" ? window.location.pathname : null,
          hasSession: true,
          authUserId: data.userId,
          authReady: true,
          profileExists: true,
          onboarding_complete: data.profile.onboardingComplete,
          destination: data.profile.onboardingComplete ? "/" : "/onboarding",
        });
      } catch (err: unknown) {
        const message = hydrationErrorMessage(err);
        console.warn("[auth-hydration]", {
          event: "session_restore_failed",
          trigger,
          message: err instanceof Error ? err.message : String(err),
        });
        if (!mountedRef.current) return;
        setRestoreFailed(true);
        setRecoveryMessage(message);
        ensureAuthReady(hydrateLoggedOut, resetToDemoDefaults, "error_fallback");
        logAuthHydration("hydration_complete", { trigger, mode: "error_fallback" });
      } finally {
        syncInFlightRef.current = false;
        if (mountedRef.current) {
          ensureAuthReady(hydrateLoggedOut, resetToDemoDefaults, "finally_guard");
          setRetryBusy(false);
        }
      }
    },
    [
      clearSessionScopedState,
      hydrateFromSupabase,
      hydrateLoggedOut,
      resetToDemoDefaults,
    ]
  );

  useEffect(() => {
    mountedRef.current = true;
    logPwaDisplayContext();
    void runSync("mount");

    if (!hasSupabaseEnv()) {
      return () => {
        mountedRef.current = false;
      };
    }

    const supabase = createSupabaseBrowserClient();
    const { data: authListener } = supabase.auth.onAuthStateChange((event) => {
      logAuthHydration("auth_state_change", { event });
      void runSync(`auth:${event}`);
    });

    return () => {
      mountedRef.current = false;
      authListener.subscription.unsubscribe();
    };
  }, [runSync]);

  async function handleLogout() {
    setRetryBusy(true);
    await logout();
    setRestoreFailed(false);
    setRecoveryMessage(null);
    setRetryBusy(false);
    router.replace("/");
    router.refresh();
  }

  if (!restoreFailed) return null;

  return (
    <SessionHydrationRecovery
      message={
        recoveryMessage ??
        "Couldn’t restore your session. Try again or sign out to reset."
      }
      busy={retryBusy}
      onRetry={() => void runSync("retry")}
      onLogout={() => void handleLogout()}
    />
  );
}
