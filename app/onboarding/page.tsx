"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { INTEREST_OPTIONS } from "@/lib/recommendations";
import {
  persistConsentEvent,
  syncProfileStateFromSupabase,
} from "@/lib/supabase/client-persistence";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { hasSupabaseEnv } from "@/lib/supabase/env";
import { formatSupabasePostgrestError } from "@/lib/supabase/postgrest-error";
import { getProfileById, replaceInterests, upsertProfile } from "@/lib/supabase/repositories";
import type { PuInterestId } from "@/lib/types";
import { useAppStore } from "@/store/use-app-store";

const CAMPUS_OPTIONS: readonly string[] = [
  "University of Illinois · Urbana-Champaign",
  "UIUC / Champaign-Urbana",
  "Other",
];

export default function OnboardingPage() {
  const router = useRouter();
  const hydrateFromSupabase = useAppStore((s) => s.hydrateFromSupabase);
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

  const loadProfile = useCallback(async () => {
    if (!envConfigured) {
      return;
    }
    const supabase = createSupabaseBrowserClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      router.replace("/login?next=/onboarding");
      return;
    }
    const row = await getProfileById(supabase, user.id);
    if (!row) {
      router.replace("/signup");
      return;
    }
    if (row.role !== "regular_user") {
      router.replace("/profile");
      return;
    }
    if (row.requested_role === "host" || row.requested_role === "business") {
      if (row.verification_status === "pending") {
        router.replace("/onboarding/pending");
        return;
      }
      if (row.verification_status === "rejected") {
        router.replace("/onboarding/rejected");
        return;
      }
    }
    setUsername(row.username);
    setFullName(row.full_name ?? "");
    setCampus(row.campus ?? CAMPUS_OPTIONS[0]);
    setInterests((row.interests ?? []) as PuInterestId[]);
    setConsentAnalytics(row.consent_analytics);
    setConsentPersonalization(row.consent_personalization);
    setConsentLocation(row.consent_location);
    setConsentMarketing(row.consent_marketing);
    if (row.onboarding_complete) {
      router.replace("/profile");
      return;
    }
    return "ready" as const;
  }, [envConfigured, router]);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      if (!envConfigured) {
        if (!cancelled) setBootLoading(false);
        return;
      }
      const outcome = await loadProfile();
      if (cancelled) return;
      if (outcome === "ready") setBootLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [envConfigured, loadProfile]);

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
    const supabase = createSupabaseBrowserClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      setError("Session expired. Please sign in again.");
      setBusy(false);
      router.replace("/login?next=/onboarding");
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
    const synced = await syncProfileStateFromSupabase();
    if (synced) hydrateFromSupabase(synced);
    router.replace("/profile");
    router.refresh();
  }

  if (bootLoading) {
    return (
      <div className="pu-screen flex min-h-dvh items-center justify-center px-4">
        <p className="pu-meta">Loading your profile…</p>
      </div>
    );
  }

  return (
    <div className="pu-screen min-h-dvh px-4 py-10">
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
