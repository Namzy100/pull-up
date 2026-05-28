"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { SessionHydrationRecovery } from "@/components/auth/session-hydration-recovery";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  hydrationErrorMessage,
  logAuthHydration,
  logPwaDisplayContext,
  SESSION_HYDRATION_TIMEOUT_MS,
  withTimeout,
} from "@/lib/auth-hydration";
import { INTEREST_OPTIONS } from "@/lib/recommendations";
import {
  persistConsentEvent,
  syncProfileStateFromSupabase,
} from "@/lib/supabase/client-persistence";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { hasSupabaseEnv } from "@/lib/supabase/env";
import { formatSupabasePostgrestError } from "@/lib/supabase/postgrest-error";
import type { DbProfile } from "@/lib/supabase/repositories";
import { fetchProfileForAuthUser, replaceInterests, upsertProfile } from "@/lib/supabase/repositories";
import { ensureMinimalStudentProfileIfMissing } from "@/lib/supabase/signup-bootstrap";
import type { PuInterestId } from "@/lib/types";
import { useAppStore } from "@/store/use-app-store";

const CAMPUS_OPTIONS: readonly string[] = [
  "University of Illinois · Urbana-Champaign",
  "UIUC / Champaign-Urbana",
  "Other",
];

const LOGIN_NEXT = "/login?next=%2Fonboarding";

type OnboardingBootOutcome =
  | { status: "no_env" }
  | { status: "no_user" }
  | { status: "ready" }
  | { status: "redirect"; href: string; label: string; reason: string }
  | { status: "profile_ensure_failed"; message: string }
  | { status: "profile_read_failed"; message: string };

async function finalizeOnboardingBootAuthState(trigger: string) {
  const store = useAppStore.getState();
  if (store.authReady) {
    logAuthHydration("onboarding_auth_ready_skip", { trigger });
    return;
  }
  if (!hasSupabaseEnv()) {
    store.hydrateLoggedOut();
    logAuthHydration("onboarding_auth_ready_set", { trigger, mode: "no_env" });
    return;
  }
  try {
    const supabase = createSupabaseBrowserClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      store.hydrateLoggedOut();
      logAuthHydration("onboarding_auth_ready_set", { trigger, mode: "no_session" });
      return;
    }
    const synced = await withTimeout(
      syncProfileStateFromSupabase({ log: false }),
      SESSION_HYDRATION_TIMEOUT_MS,
      `onboarding-authReady-sync:${trigger}`
    ).catch(() => null);
    if (synced) {
      store.hydrateFromSupabase(synced);
      logAuthHydration("onboarding_auth_ready_set", { trigger, mode: "hydrated" });
    } else {
      useAppStore.setState({ authReady: true, authUserId: user.id });
      logAuthHydration("onboarding_auth_ready_set", { trigger, mode: "minimal_session" });
    }
  } catch {
    useAppStore.getState().hydrateLoggedOut();
    logAuthHydration("onboarding_auth_ready_set", { trigger, mode: "error" });
  }
}

export default function OnboardingPage() {
  const router = useRouter();
  const hydrateFromSupabase = useAppStore((s) => s.hydrateFromSupabase);
  const logout = useAppStore((s) => s.logout);
  const envConfigured = hasSupabaseEnv();

  const [username, setUsername] = useState("");
  const [fullName, setFullName] = useState("");
  const [campus, setCampus] = useState(CAMPUS_OPTIONS[0]);
  const [interests, setInterests] = useState<PuInterestId[]>([]);
  const [consentAnalytics, setConsentAnalytics] = useState(false);
  const [consentPersonalization, setConsentPersonalization] = useState(false);
  const [consentLocation, setConsentLocation] = useState(false);
  const [consentMarketing, setConsentMarketing] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [bootLoading, setBootLoading] = useState(true);
  const [bootFailed, setBootFailed] = useState(false);
  const [bootError, setBootError] = useState<string | null>(null);
  const [bootRetryBusy, setBootRetryBusy] = useState(false);
  const [bootRedirect, setBootRedirect] = useState<{ href: string; label: string } | null>(null);
  const [bootFailureKind, setBootFailureKind] = useState<"read" | "ensure" | "generic">("generic");

  const bootStartedRef = useRef(false);

  const applyProfileRow = useCallback((row: DbProfile) => {
    setUsername(row.username);
    setFullName(row.full_name ?? "");
    setCampus(row.campus ?? CAMPUS_OPTIONS[0]);
    setInterests((row.interests ?? []) as PuInterestId[]);
    setConsentAnalytics(row.consent_analytics);
    setConsentPersonalization(row.consent_personalization);
    setConsentLocation(row.consent_location);
    setConsentMarketing(row.consent_marketing);
  }, []);

  const loadProfile = useCallback(async (): Promise<OnboardingBootOutcome> => {
    if (!envConfigured) {
      return { status: "no_env" };
    }

    logAuthHydration("onboarding_profile_fetch_start");
    const supabase = createSupabaseBrowserClient();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError) {
      logAuthHydration("onboarding_profile_fetch_auth_error", {
        code: authError.code ?? null,
      });
      throw authError;
    }

    logAuthHydration("onboarding_profile_fetch_auth_end", { hasUser: Boolean(user) });

    if (!user) {
      return { status: "no_user" };
    }

    let profRes = await fetchProfileForAuthUser(supabase, user.id);
    logAuthHydration("onboarding_profile_fetch_row_end", {
      profileOk: profRes.ok,
      hasProfile: Boolean(profRes.row),
    });

    if (!profRes.ok) {
      const message = profRes.error
        ? formatSupabasePostgrestError(profRes.error)
        : "Could not load your profile.";
      return { status: "profile_read_failed", message };
    }

    let row = profRes.row;

    if (!row) {
      console.info(
        "[auth-routing]",
        JSON.stringify({ event: "profile_missing_for_auth_user", authUserId: user.id })
      );
      logAuthHydration("onboarding_profile_missing_ensure_start", { authUserId: user.id });
      const ensured = await ensureMinimalStudentProfileIfMissing(supabase, user);
      if (!ensured.ok) {
        logAuthHydration("onboarding_profile_ensure_failed", {
          authUserId: user.id,
          code: ensured.code ?? null,
        });
        return { status: "profile_ensure_failed", message: ensured.error };
      }
      profRes = await fetchProfileForAuthUser(supabase, user.id);
      if (!profRes.ok) {
        const message = profRes.error
          ? formatSupabasePostgrestError(profRes.error)
          : "Could not load your profile after setup.";
        return { status: "profile_read_failed", message };
      }
      row = profRes.row;
      if (!row) {
        logAuthHydration("onboarding_profile_ensure_still_missing", { authUserId: user.id });
        return {
          status: "profile_ensure_failed",
          message: "We could not create your profile. Check your connection and try again.",
        };
      }
      logAuthHydration("onboarding_profile_ensure_ok", {
        authUserId: user.id,
        created: ensured.created,
      });
    }

    if (row.role !== "regular_user") {
      const href = "/profile";
      console.info(
        "[auth-routing]",
        JSON.stringify({
          event: "onboarding_redirect_decision",
          authUserId: user.id,
          href,
          reason: "non_student_role",
        })
      );
      return { status: "redirect", href, label: "Open profile", reason: "non_student_role" };
    }

    if (row.requested_role === "host" || row.requested_role === "business") {
      if (row.verification_status === "pending") {
        const href = "/onboarding/pending";
        console.info(
          "[auth-routing]",
          JSON.stringify({
            event: "onboarding_redirect_decision",
            authUserId: user.id,
            href,
            reason: "verification_pending",
          })
        );
        return {
          status: "redirect",
          href,
          label: "View pending verification",
          reason: "verification_pending",
        };
      }
      if (row.verification_status === "rejected") {
        const href = "/onboarding/rejected";
        console.info(
          "[auth-routing]",
          JSON.stringify({
            event: "onboarding_redirect_decision",
            authUserId: user.id,
            href,
            reason: "verification_rejected",
          })
        );
        return {
          status: "redirect",
          href,
          label: "View verification status",
          reason: "verification_rejected",
        };
      }
    }

    if (row.onboarding_complete) {
      const href = "/";
      console.info(
        "[auth-routing]",
        JSON.stringify({
          event: "onboarding_redirect_decision",
          authUserId: user.id,
          href,
          reason: "onboarding_complete",
        })
      );
      return { status: "redirect", href, label: "Go to Tonight", reason: "onboarding_complete" };
    }

    applyProfileRow(row);
    console.info(
      "[auth-routing]",
      JSON.stringify({
        event: "onboarding_profile_loaded",
        authUserId: user.id,
        onboardingComplete: row.onboarding_complete,
      })
    );
    logAuthHydration("onboarding_profile_fetch_ready");
    return { status: "ready" };
  }, [applyProfileRow, envConfigured]);

  const runBoot = useCallback(
    async (trigger: "mount" | "retry") => {
      setBootFailed(false);
      setBootError(null);
      setBootRedirect(null);
      setBootFailureKind("generic");
      setBootRetryBusy(true);
      setBootLoading(true);

      logAuthHydration("onboarding_boot_start", { trigger });
      logAuthHydration("boot_start", {
        trigger: `onboarding:${trigger}`,
        path: typeof window !== "undefined" ? window.location.pathname : null,
      });
      const s = useAppStore.getState();
      logAuthHydration("store_auth_state_before_boot", {
        trigger: `onboarding:${trigger}`,
        authReady: s.authReady,
        authUserId: s.authUserId ?? null,
        path: typeof window !== "undefined" ? window.location.pathname : null,
      });

      try {
        const outcome = await withTimeout(
          loadProfile(),
          SESSION_HYDRATION_TIMEOUT_MS,
          "onboarding-loadProfile"
        );

        logAuthHydration("onboarding_boot_complete", {
          trigger,
          status: outcome.status,
        });

        switch (outcome.status) {
          case "no_env":
            break;
          case "no_user":
            logAuthHydration("onboarding_guard_result", {
              path: typeof window !== "undefined" ? window.location.pathname : null,
              hasSession: false,
              authUserId: null,
              authReady: useAppStore.getState().authReady,
              profileExists: false,
              onboarding_complete: null,
              destination: "/login?next=/onboarding",
              result: "redirect_login_no_user",
            });
            router.replace(LOGIN_NEXT);
            break;
          case "ready":
            logAuthHydration("onboarding_guard_result", {
              path: typeof window !== "undefined" ? window.location.pathname : null,
              hasSession: true,
              authUserId: useAppStore.getState().authUserId ?? null,
              authReady: useAppStore.getState().authReady,
              profileExists: true,
              onboarding_complete: false,
              destination: "/onboarding",
              result: "allow_onboarding_form",
            });
            break;
          case "profile_read_failed":
            setBootFailed(true);
            setBootFailureKind("read");
            setBootError(outcome.message);
            break;
          case "profile_ensure_failed":
            setBootFailed(true);
            setBootFailureKind("ensure");
            setBootError(outcome.message);
            break;
          case "redirect":
            setBootRedirect({ href: outcome.href, label: outcome.label });
            logAuthHydration("onboarding_guard_result", {
              path: typeof window !== "undefined" ? window.location.pathname : null,
              hasSession: true,
              authUserId: useAppStore.getState().authUserId ?? null,
              authReady: useAppStore.getState().authReady,
              profileExists: true,
              onboarding_complete: outcome.reason === "onboarding_complete",
              destination: outcome.href,
              result: outcome.reason,
            });
            router.replace(outcome.href);
            break;
        }
      } catch (err: unknown) {
        const message = hydrationErrorMessage(err);
        console.warn("[auth-hydration]", {
          event: "onboarding_boot_failed",
          trigger,
          message: err instanceof Error ? err.message : String(err),
        });
        setBootFailed(true);
        setBootFailureKind("generic");
        setBootError(message);
      } finally {
        setBootLoading(false);
        setBootRetryBusy(false);
        await finalizeOnboardingBootAuthState(`boot_finally:${trigger}`);
        logAuthHydration("onboarding_boot_finally", { trigger });
      }
    },
    [loadProfile, router]
  );

  useEffect(() => {
    logPwaDisplayContext();
    if (bootStartedRef.current) return;
    bootStartedRef.current = true;

    const timer = window.setTimeout(() => {
      void runBoot("mount");
    }, 0);

    const hardStop = window.setTimeout(() => {
      setBootLoading((loading) => {
        if (!loading) return false;
        console.warn("[auth-hydration]", {
          event: "onboarding_boot_hard_stop",
          ms: SESSION_HYDRATION_TIMEOUT_MS + 500,
        });
        window.queueMicrotask(() => {
          setBootFailed(true);
          setBootFailureKind("generic");
          setBootError(
            "Profile loading took too long. Retry, sign in again, or log out to reset."
          );
          void finalizeOnboardingBootAuthState("hard_stop");
        });
        return false;
      });
    }, SESSION_HYDRATION_TIMEOUT_MS + 500);

    return () => {
      window.clearTimeout(timer);
      window.clearTimeout(hardStop);
    };
  }, [runBoot]);

  async function handleBootLogout() {
    setBootRetryBusy(true);
    await logout();
    setBootRetryBusy(false);
    setBootFailed(false);
    router.replace(LOGIN_NEXT);
    router.refresh();
  }

  async function handleRepairProfile() {
    if (!envConfigured) return;
    setBootRetryBusy(true);
    setBootError(null);
    try {
      const supabase = createSupabaseBrowserClient();
      const {
        data: { user },
      } = await withTimeout(supabase.auth.getUser(), SESSION_HYDRATION_TIMEOUT_MS, "repair-getUser");
      if (!user) {
        setBootError("Session expired. Please sign in again.");
        return;
      }
      const ensured = await ensureMinimalStudentProfileIfMissing(supabase, user);
      if (!ensured.ok) {
        setBootError(ensured.error);
      }
    } catch (err: unknown) {
      setBootError(hydrationErrorMessage(err));
    } finally {
      setBootRetryBusy(false);
      void runBoot("retry");
    }
  }

  const canSubmit = useMemo(
    () => username.trim().length >= 3 && interests.length > 0,
    [username, interests.length]
  );

  function toggleInterest(interest: PuInterestId) {
    setInterests((prev) =>
      prev.includes(interest) ? prev.filter((x) => x !== interest) : [...prev, interest]
    );
  }

  async function completeOnboarding(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    if (!envConfigured) {
      setError("Supabase env is not configured.");
      setBusy(false);
      return;
    }
    try {
      const supabase = createSupabaseBrowserClient();
      const {
        data: { user },
      } = await withTimeout(supabase.auth.getUser(), SESSION_HYDRATION_TIMEOUT_MS, "onboarding-submit-getUser");
      if (!user) {
        setError("Session expired. Please sign in again.");
        setBusy(false);
        router.replace(LOGIN_NEXT);
        return;
      }
      const { data: profileRow, error: profileError } = await upsertProfile(supabase, {
        id: user.id,
        username: username.trim().toLowerCase(),
        full_name: fullName.trim() || null,
        campus,
        role: "regular_user",
        requested_role: "none",
        verification_status: "none",
        onboarding_complete: true,
        interests,
        consent_analytics: consentAnalytics,
        consent_personalization: consentPersonalization,
        consent_location: consentLocation,
        consent_marketing: consentMarketing,
      });
      if (profileError) {
        const detail = formatSupabasePostgrestError(profileError);
        const email = user.email ?? null;
        const safeEmail = email
          ? `${email.slice(0, 2)}***@${email.split("@")[1] ?? "hidden"}`
          : null;
        console.error("[onboarding] upsertProfile failed", {
          authUserId: user.id,
          email: safeEmail,
          targetProfileId: user.id,
          error: detail,
          code: profileError.code,
        });
        setError(detail);
        setBusy(false);
        return;
      }
      if (!profileRow) {
        setError("Profile save returned no row.");
        setBusy(false);
        return;
      }
      const interestsResult = await replaceInterests(supabase, user.id, interests);
      if (interestsResult.error) {
        setError(interestsResult.error.message);
        setBusy(false);
        return;
      }
      await Promise.all([
        persistConsentEvent("analytics", consentAnalytics, "onboarding"),
        persistConsentEvent("personalization", consentPersonalization, "onboarding"),
        persistConsentEvent("location", consentLocation, "onboarding"),
        persistConsentEvent("marketing", consentMarketing, "onboarding"),
      ]);
      const synced = await withTimeout(
        syncProfileStateFromSupabase({ log: true }),
        SESSION_HYDRATION_TIMEOUT_MS,
        "onboarding-post-save-sync"
      );
      if (synced) hydrateFromSupabase(synced);
      router.replace("/");
      router.refresh();
    } catch (err: unknown) {
      setError(hydrationErrorMessage(err));
      setBusy(false);
    }
  }

  if (bootLoading && !bootFailed) {
    return (
      <div className="pu-screen flex min-h-dvh items-center justify-center px-4 pb-8">
        <p className="pu-meta">Loading your profile…</p>
      </div>
    );
  }

  if (bootFailed) {
    return (
      <div className="pu-screen flex min-h-dvh flex-col items-center justify-center px-4 pb-8">
        <SessionHydrationRecovery
          title={
            bootFailureKind === "read"
              ? "Could not load profile"
              : "Couldn’t load your profile"
          }
          message={
            bootError ??
            "Profile loading timed out. Retry, sign in again, or log out to reset."
          }
          busy={bootRetryBusy}
          onRetry={() => void runBoot("retry")}
          goToLoginHref={LOGIN_NEXT}
          onLogout={() => void handleBootLogout()}
          onRepair={bootFailureKind === "ensure" ? () => void handleRepairProfile() : undefined}
          repairLabel="Repair profile"
        />
      </div>
    );
  }

  if (bootRedirect) {
    return (
      <div className="pu-screen flex min-h-dvh flex-col items-center justify-center gap-4 px-4 pb-8 text-center">
        <p className="pu-meta">Taking you to the next step…</p>
        <Button asChild variant="outline" className="rounded-xl border-pu-border font-bold">
          <Link href={bootRedirect.href}>{bootRedirect.label}</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="pu-screen min-h-dvh px-4 py-10 pb-8">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-[55vh] bg-[radial-gradient(ellipse_80%_55%_at_50%_-12%,oklch(0.55_0.22_328/0.24),transparent_62%)]" />
      <form
        onSubmit={completeOnboarding}
        className="relative mx-auto w-full max-w-lg space-y-5 rounded-2xl border border-pu-border bg-gradient-to-b from-pu-surface/90 to-black p-5"
      >
        <div className="space-y-2">
          <p className="pu-eyebrow">Almost there</p>
          <h1 className="pu-display text-[2rem]">Student onboarding</h1>
          <p className="pu-meta">
            Tune campus, interests, and optional consent. Everything optional stays opt-in.
          </p>
          {!envConfigured ? (
            <p className="text-xs font-semibold text-pu-urgent-glow">
              Dev warning: Supabase env vars are missing.
            </p>
          ) : null}
        </div>

        <div className="space-y-2">
          <Label htmlFor="username">Username</Label>
          <Input
            id="username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="h-11 rounded-xl border-pu-border bg-black/45"
            required
            minLength={3}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="full-name">Display name</Label>
          <Input
            id="full-name"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            className="h-11 rounded-xl border-pu-border bg-black/45"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="campus">Campus</Label>
          <select
            id="campus"
            value={campus}
            onChange={(e) => setCampus(e.target.value)}
            className="h-11 w-full rounded-xl border border-pu-border bg-black/45 px-3 text-sm text-white"
          >
            {CAMPUS_OPTIONS.map((option) => (
              <option key={option} value={option} className="bg-zinc-900">
                {option}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-2">
          <Label>Interests</Label>
          <div className="flex flex-wrap gap-2">
            {INTEREST_OPTIONS.map((option) => {
              const active = interests.includes(option.id);
              return (
                <button
                  key={option.id}
                  type="button"
                  onClick={() => toggleInterest(option.id)}
                  className={
                    active
                      ? "rounded-full border border-pu-magenta/55 bg-pu-magenta-dim/30 px-3 py-1.5 text-[11px] font-black uppercase tracking-wide text-white"
                      : "rounded-full border border-pu-border bg-black/35 px-3 py-1.5 text-[11px] font-black uppercase tracking-wide text-white/62"
                  }
                >
                  {option.label}
                </button>
              );
            })}
          </div>
        </div>

        <div className="space-y-3 rounded-xl border border-pu-border bg-black/35 p-4">
          <p className="text-xs font-bold uppercase tracking-wide text-white/65">
            Privacy consent (optional)
          </p>
          <p className="text-[11px] font-medium text-white/45">
            Required notices live in Terms — these toggles are optional.
          </p>
          <ConsentRow
            label="Analytics"
            hint="Help improve performance and UX quality."
            checked={consentAnalytics}
            onCheckedChange={setConsentAnalytics}
          />
          <ConsentRow
            label="Personalization"
            hint="Tune recommendations around your lanes."
            checked={consentPersonalization}
            onCheckedChange={setConsentPersonalization}
          />
          <ConsentRow
            label="Location usage"
            hint="Use location context for nearby moves."
            checked={consentLocation}
            onCheckedChange={setConsentLocation}
          />
          <ConsentRow
            label="Marketing notifications"
            hint="Receive optional promos and launch updates."
            checked={consentMarketing}
            onCheckedChange={setConsentMarketing}
          />
        </div>

        {error ? <p className="text-sm font-semibold text-pu-urgent-glow">{error}</p> : null}

        <Button
          type="submit"
          disabled={busy || !canSubmit}
          className="h-11 w-full rounded-xl border-0 bg-gradient-to-r from-pu-magenta to-pu-amber font-black uppercase tracking-[0.08em]"
        >
          {busy ? "Saving…" : "Enter Pull Up"}
        </Button>
        <p className="text-center text-xs font-semibold text-white/55">
          Privacy-first beta. See{" "}
          <Link href="/privacy" className="text-pu-magenta hover:text-white">
            Privacy
          </Link>{" "}
          and{" "}
          <Link href="/terms" className="text-pu-magenta hover:text-white">
            Terms
          </Link>
          .
        </p>
      </form>
    </div>
  );
}

function ConsentRow({
  label,
  hint,
  checked,
  onCheckedChange,
}: {
  label: string;
  hint: string;
  checked: boolean;
  onCheckedChange: (value: boolean) => void;
}) {
  return (
    <label className="flex items-start justify-between gap-3">
      <span className="space-y-0.5">
        <span className="block text-sm font-semibold text-white">{label}</span>
        <span className="block text-xs text-white/55">{hint}</span>
      </span>
      <Switch checked={checked} onCheckedChange={onCheckedChange} aria-label={label} />
    </label>
  );
}
