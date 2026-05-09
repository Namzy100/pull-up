"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

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
import {
  createAccessRequest,
  replaceInterests,
  upsertProfile,
} from "@/lib/supabase/repositories";
import type { PuInterestId, RequestedRole } from "@/lib/types";
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
  const [accountType, setAccountType] = useState<RequestedRole>("none");
  const [businessName, setBusinessName] = useState("");
  const [businessType, setBusinessType] = useState("");
  const [businessWebsite, setBusinessWebsite] = useState("");
  const [businessContact, setBusinessContact] = useState("");
  const [organizationName, setOrganizationName] = useState("");
  const [organizationType, setOrganizationType] = useState("");
  const [verificationNotes, setVerificationNotes] = useState("");
  const [consentAnalytics, setConsentAnalytics] = useState(false);
  const [consentPersonalization, setConsentPersonalization] = useState(false);
  const [consentLocation, setConsentLocation] = useState(false);
  const [consentMarketing, setConsentMarketing] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canSubmit = useMemo(
    () => {
      if (username.trim().length < 3 || interests.length === 0) return false;
      if (accountType === "business") {
        return (
          businessName.trim().length > 1 &&
          businessType.trim().length > 1 &&
          businessContact.trim().length > 3
        );
      }
      if (accountType === "host") {
        return (
          organizationName.trim().length > 1 &&
          organizationType.trim().length > 1 &&
          businessContact.trim().length > 3
        );
      }
      return true;
    },
    [
      accountType,
      businessContact,
      businessName,
      businessType,
      interests.length,
      organizationName,
      organizationType,
      username,
    ]
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
    const { error: profileError } = await upsertProfile(supabase, {
      id: user.id,
      username: username.trim(),
      full_name: fullName.trim() || null,
      campus,
      role: "regular_user",
      requested_role: accountType,
      verification_status: accountType === "none" ? "none" : "pending",
      business_name: businessName.trim() || null,
      business_type: businessType.trim() || null,
      business_website: businessWebsite.trim() || null,
      business_contact: businessContact.trim() || null,
      organization_name: organizationName.trim() || null,
      organization_type: organizationType.trim() || null,
      verification_notes: verificationNotes.trim() || null,
      onboarding_complete: true,
      interests,
      consent_analytics: consentAnalytics,
      consent_personalization: consentPersonalization,
      consent_location: consentLocation,
      consent_marketing: consentMarketing,
    });
    if (profileError) {
      setError(profileError.message);
      setBusy(false);
      return;
    }
    if (accountType !== "none") {
      const { error: requestError } = await createAccessRequest(
        supabase,
        user.id,
        accountType,
        verificationNotes.trim(),
        {
          businessName: businessName.trim() || null,
          businessType: businessType.trim() || null,
          businessWebsite: businessWebsite.trim() || null,
          businessContact: businessContact.trim() || null,
          organizationName: organizationName.trim() || null,
          organizationType: organizationType.trim() || null,
        }
      );
      if (requestError) {
        setError(requestError.message);
        setBusy(false);
        return;
      }
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

  return (
    <div className="pu-screen min-h-dvh px-4 py-10">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-[55vh] bg-[radial-gradient(ellipse_80%_55%_at_50%_-12%,oklch(0.55_0.22_328/0.24),transparent_62%)]" />
      <form
        onSubmit={completeOnboarding}
        className="relative mx-auto w-full max-w-lg space-y-5 rounded-2xl border border-pu-border bg-gradient-to-b from-pu-surface/90 to-black p-5"
      >
        <div className="space-y-2">
          <p className="pu-eyebrow">Set up identity</p>
          <h1 className="pu-display text-[2rem]">Onboarding</h1>
          <p className="pu-meta">
            Consent is opt-in only. Nothing is enabled unless you choose it.
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
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="full-name">Full name</Label>
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
          <Label>Account type</Label>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
            <AccountTypeButton
              active={accountType === "none"}
              label="Student / Regular"
              onClick={() => setAccountType("none")}
            />
            <AccountTypeButton
              active={accountType === "host"}
              label="Host / Org / Frat"
              onClick={() => setAccountType("host")}
            />
            <AccountTypeButton
              active={accountType === "business"}
              label="Local Business"
              onClick={() => setAccountType("business")}
            />
          </div>
          <p className="text-xs font-semibold text-white/60">
            Verification keeps the pulse trusted.
          </p>
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

        {accountType === "business" ? (
          <div className="space-y-3 rounded-xl border border-pu-border bg-black/35 p-4">
            <p className="text-xs font-bold uppercase tracking-wide text-white/65">
              Business verification
            </p>
            <Input
              value={businessName}
              onChange={(e) => setBusinessName(e.target.value)}
              className="h-10 rounded-xl border-pu-border bg-black/45"
              placeholder="Business name"
            />
            <Input
              value={businessType}
              onChange={(e) => setBusinessType(e.target.value)}
              className="h-10 rounded-xl border-pu-border bg-black/45"
              placeholder="Business type"
            />
            <Input
              value={businessWebsite}
              onChange={(e) => setBusinessWebsite(e.target.value)}
              className="h-10 rounded-xl border-pu-border bg-black/45"
              placeholder="Website or Instagram"
            />
            <Input
              value={businessContact}
              onChange={(e) => setBusinessContact(e.target.value)}
              className="h-10 rounded-xl border-pu-border bg-black/45"
              placeholder="Contact email/phone"
            />
            <Input
              value={verificationNotes}
              onChange={(e) => setVerificationNotes(e.target.value)}
              className="h-10 rounded-xl border-pu-border bg-black/45"
              placeholder="Verification notes (optional)"
            />
            <p className="text-xs font-semibold text-white/60">
              Businesses can drop offers once approved.
            </p>
          </div>
        ) : null}

        {accountType === "host" ? (
          <div className="space-y-3 rounded-xl border border-pu-border bg-black/35 p-4">
            <p className="text-xs font-bold uppercase tracking-wide text-white/65">
              Host verification
            </p>
            <Input
              value={organizationName}
              onChange={(e) => setOrganizationName(e.target.value)}
              className="h-10 rounded-xl border-pu-border bg-black/45"
              placeholder="Organization / chapter name"
            />
            <Input
              value={organizationType}
              onChange={(e) => setOrganizationType(e.target.value)}
              className="h-10 rounded-xl border-pu-border bg-black/45"
              placeholder="Org type"
            />
            <Input
              value={businessContact}
              onChange={(e) => setBusinessContact(e.target.value)}
              className="h-10 rounded-xl border-pu-border bg-black/45"
              placeholder="Contact email/phone"
            />
            <Input
              value={verificationNotes}
              onChange={(e) => setVerificationNotes(e.target.value)}
              className="h-10 rounded-xl border-pu-border bg-black/45"
              placeholder="Affiliation notes (optional)"
            />
            <p className="text-xs font-semibold text-white/60">
              We review host accounts to keep the feed trusted.
            </p>
          </div>
        ) : null}

        <div className="space-y-3 rounded-xl border border-pu-border bg-black/35 p-4">
          <p className="text-xs font-bold uppercase tracking-wide text-white/65">
            Privacy consent (optional)
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
          Finish onboarding
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

function AccountTypeButton({
  active,
  label,
  onClick,
}: {
  active: boolean;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={
        active
          ? "rounded-xl border border-pu-magenta/55 bg-pu-magenta-dim/30 px-3 py-2 text-xs font-black uppercase tracking-wide text-white"
          : "rounded-xl border border-pu-border bg-black/35 px-3 py-2 text-xs font-black uppercase tracking-wide text-white/70"
      }
    >
      {label}
    </button>
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
