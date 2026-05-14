"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { Loader2, Sparkles } from "lucide-react";

import type { SignupAccountPath, SignupBusinessType, SignupOrgType } from "@/lib/account-signup-types";
import { BUSINESS_TYPES, ORG_TYPES } from "@/lib/account-signup-types";
import { INTEREST_OPTIONS } from "@/lib/recommendations";
import { clearPendingSignupStorage, stashPendingSignup } from "@/lib/signup-pending-storage";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { hasSupabaseEnv } from "@/lib/supabase/env";
import type {
  BusinessSignupFields,
  HostSignupFields,
  StudentSignupFields,
} from "@/lib/supabase/signup-bootstrap";
import { completeSignupAfterAuth } from "@/lib/supabase/signup-bootstrap";
import type { PuInterestId } from "@/lib/types";

const CAMPUS_OPTIONS = [
  "University of Illinois · Urbana-Champaign",
  "UIUC / Champaign-Urbana",
  "Other",
] as const;

function PathCard({
  active,
  title,
  subtitle,
  onClick,
}: {
  active: boolean;
  title: string;
  subtitle: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={
        active
          ? "rounded-2xl border border-pu-magenta/55 bg-pu-magenta-dim/25 p-4 text-left transition-colors"
          : "rounded-2xl border border-pu-border bg-black/40 p-4 text-left transition-colors hover:border-white/20"
      }
    >
      <p className="text-sm font-black uppercase tracking-wide text-white">{title}</p>
      <p className="mt-1 text-xs font-medium text-white/60">{subtitle}</p>
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
  onCheckedChange: (v: boolean) => void;
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

export default function SignupPage() {
  const router = useRouter();
  const envConfigured = hasSupabaseEnv();
  const [path, setPath] = useState<SignupAccountPath | null>(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const [displayName, setDisplayName] = useState("");
  const [username, setUsername] = useState("");
  const [campus, setCampus] = useState<string>(CAMPUS_OPTIONS[0]);
  const [interests, setInterests] = useState<PuInterestId[]>([]);
  const [stAnalytics, setStAnalytics] = useState(false);
  const [stPersonalization, setStPersonalization] = useState(false);
  const [stLocation, setStLocation] = useState(false);
  const [stMarketing, setStMarketing] = useState(false);

  const [orgName, setOrgName] = useState("");
  const [orgType, setOrgType] = useState<SignupOrgType>("fraternity");
  const [hostContactName, setHostContactName] = useState("");
  const [hostContactChannel, setHostContactChannel] = useState("");
  const [hostCampus, setHostCampus] = useState<string>(CAMPUS_OPTIONS[0]);
  const [affiliationProofUrl, setAffiliationProofUrl] = useState("");
  const [socialUrl, setSocialUrl] = useState("");
  const [hostExplanation, setHostExplanation] = useState("");
  const [hPost, setHPost] = useState(false);
  const [hEventAn, setHEventAn] = useState(false);
  const [hVerContact, setHVerContact] = useState(false);
  const [hMkt, setHMkt] = useState(false);

  const [bizName, setBizName] = useState("");
  const [bizType, setBizType] = useState<SignupBusinessType>("bar");
  const [bizContactPerson, setBizContactPerson] = useState("");
  const [bizContactChannel, setBizContactChannel] = useState("");
  const [bizWeb, setBizWeb] = useState("");
  const [bizArea, setBizArea] = useState("");
  const [bizExplanation, setBizExplanation] = useState("");
  const [bVerStore, setBVerStore] = useState(false);
  const [bPerf, setBPerf] = useState(false);
  const [bVerContact, setBVerContact] = useState(false);
  const [bPromo, setBPromo] = useState(false);
  const [bPublic, setBPublic] = useState(false);

  const canSubmit = useMemo(() => {
    if (!path) return false;
    if (!email.trim() || password.length < 8) return false;
    if (path === "student") {
      return (
        displayName.trim().length > 0 &&
        username.trim().length >= 3 &&
        interests.length > 0
      );
    }
    if (path === "host") {
      return (
        orgName.trim().length > 1 &&
        hostContactName.trim().length > 1 &&
        hostContactChannel.trim().length > 3
      );
    }
    return (
      bizName.trim().length > 1 &&
      bizContactPerson.trim().length > 1 &&
      bizContactChannel.trim().length > 3 &&
      bizArea.trim().length > 2
    );
  }, [
    path,
    email,
    password,
    displayName,
    username,
    interests.length,
    orgName,
    hostContactName,
    hostContactChannel,
    bizName,
    bizContactPerson,
    bizContactChannel,
    bizArea,
  ]);

  function toggleInterest(id: PuInterestId) {
    setInterests((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  }

  function buildFields(): StudentSignupFields | HostSignupFields | BusinessSignupFields {
    if (path === "student") {
      return {
        displayName: displayName.trim(),
        username: username.trim(),
        campus,
        interests,
        consentAnalytics: stAnalytics,
        consentPersonalization: stPersonalization,
        consentLocation: stLocation,
        consentMarketing: stMarketing,
      };
    }
    if (path === "host") {
      return {
        organizationName: orgName.trim(),
        organizationType: orgType,
        contactPersonName: hostContactName.trim(),
        contactChannel: hostContactChannel.trim(),
        campus: hostCampus,
        affiliationProofUrl,
        socialUrl,
        explanation: hostExplanation,
        consentPostingStorage: hPost,
        consentEventAnalytics: hEventAn,
        consentVerificationContact: hVerContact,
        consentHostMarketing: hMkt,
      };
    }
    return {
      businessName: bizName.trim(),
      businessType: bizType,
      contactPerson: bizContactPerson.trim(),
      contactChannel: bizContactChannel.trim(),
      websiteOrSocial: bizWeb,
      area: bizArea.trim(),
      explanation: bizExplanation,
      consentVerificationStorage: bVerStore,
      consentPerformanceAnalytics: bPerf,
      consentVerificationContact: bVerContact,
      consentPromotionalOutreach: bPromo,
      consentPublicListing: bPublic,
    };
  }

  async function finalizeSession(user: { id: string; email?: string | null }) {
    if (!path) return;
    const supabase = createSupabaseBrowserClient();
    const fields = buildFields();
    const result = await completeSignupAfterAuth(supabase, user, path, fields);
    if (!result.ok) {
      setError(result.error);
      setBusy(false);
      return;
    }
    clearPendingSignupStorage();
    if (path === "student") {
      router.replace("/onboarding");
    } else {
      router.replace("/onboarding/pending");
    }
    router.refresh();
  }

  async function signUpPassword(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    setMessage(null);
    if (!envConfigured || !path) {
      setError(!envConfigured ? "Supabase env is not configured." : "Choose how you are joining.");
      setBusy(false);
      return;
    }

    const fields = buildFields();
    stashPendingSignup({ v: 1, path, fields });

    const supabase = createSupabaseBrowserClient();
    const origin = window.location.origin;
    const next = encodeURIComponent("/signup/complete");
    const { data, error: authError } = await supabase.auth.signUp({
      email: email.trim(),
      password,
      options: {
        emailRedirectTo: `${origin}/auth/callback?next=${next}`,
      },
    });
    if (authError) {
      setError(authError.message);
      setBusy(false);
      return;
    }
    if (data.user && !data.session) {
      setMessage("Check your email to confirm your account. After confirming, we will finish your profile.");
      setBusy(false);
      return;
    }
    if (data.user && data.session) {
      await finalizeSession(data.user);
    }
    setBusy(false);
  }

  async function signUpGoogle() {
    setBusy(true);
    setError(null);
    if (!envConfigured || path !== "student") {
      setError(
        path !== "student"
          ? "Host and business accounts must use email signup so we can verify your organization."
          : "Supabase env is not configured."
      );
      setBusy(false);
      return;
    }
    if (!canSubmit) {
      setError("Fill out the student form before continuing with Google.");
      setBusy(false);
      return;
    }
    const fields = buildFields() as StudentSignupFields;
    stashPendingSignup({ v: 1, path: "student", fields });
    const supabase = createSupabaseBrowserClient();
    const origin = window.location.origin;
    const next = encodeURIComponent("/signup/google-bridge");
    const { error: oauthError } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${origin}/auth/callback?next=${next}`,
      },
    });
    if (oauthError) {
      setError(oauthError.message);
      setBusy(false);
    }
  }

  return (
    <div className="pu-screen min-h-dvh px-4 py-10">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-[55vh] bg-[radial-gradient(ellipse_80%_55%_at_50%_-12%,oklch(0.55_0.22_328/0.24),transparent_62%)]" />
      <div className="relative mx-auto w-full max-w-lg space-y-5">
        <div className="space-y-2 text-center">
          <p className="pu-eyebrow">Join the pulse</p>
          <h1 className="pu-display text-[2.1rem]">Create account</h1>
          <p className="pu-meta">
            Choose how you are joining — then we will tailor signup before your account exists.
          </p>
          {!envConfigured ? (
            <p className="text-xs font-semibold text-pu-urgent-glow">
              Dev warning: Supabase env vars are missing.
            </p>
          ) : null}
        </div>

        <div className="space-y-3">
          <p className="text-center text-xs font-black uppercase tracking-[0.14em] text-white/55">
            What are you joining Pull Up as?
          </p>
          <div className="grid gap-2 sm:grid-cols-3">
            <PathCard
              active={path === "student"}
              title="Student"
              subtitle="Regular user · tonight feed"
              onClick={() => setPath("student")}
            />
            <PathCard
              active={path === "host"}
              title="Host / Org"
              subtitle="Frat · org · promoter"
              onClick={() => setPath("host")}
            />
            <PathCard
              active={path === "business"}
              title="Local business"
              subtitle="Deals & promos"
              onClick={() => setPath("business")}
            />
          </div>
        </div>

        {path ? (
          <form
            onSubmit={signUpPassword}
            className="space-y-4 rounded-2xl border border-pu-border bg-gradient-to-b from-pu-surface/90 to-black p-5"
          >
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="h-11 rounded-xl border-pu-border bg-black/45"
                  required
                />
              </div>
              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="h-11 rounded-xl border-pu-border bg-black/45"
                  minLength={8}
                  required
                />
              </div>
            </div>

            {path === "student" ? (
              <div className="space-y-4 border-t border-pu-border pt-4">
                <p className="text-xs font-black uppercase tracking-wide text-white/55">
                  Student profile
                </p>
                <div className="space-y-2">
                  <Label htmlFor="display">Display name</Label>
                  <Input
                    id="display"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    className="h-11 rounded-xl border-pu-border bg-black/45"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="username">Username</Label>
                  <Input
                    id="username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="h-11 rounded-xl border-pu-border bg-black/45"
                    minLength={3}
                    required
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
                    {CAMPUS_OPTIONS.map((o) => (
                      <option key={o} value={o} className="bg-zinc-900">
                        {o}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2">
                  <Label>Interests</Label>
                  <div className="flex flex-wrap gap-2">
                    {INTEREST_OPTIONS.map((opt) => {
                      const on = interests.includes(opt.id);
                      return (
                        <button
                          key={opt.id}
                          type="button"
                          onClick={() => toggleInterest(opt.id)}
                          className={
                            on
                              ? "rounded-full border border-pu-magenta/55 bg-pu-magenta-dim/30 px-3 py-1.5 text-[11px] font-black uppercase tracking-wide text-white"
                              : "rounded-full border border-pu-border bg-black/35 px-3 py-1.5 text-[11px] font-black uppercase tracking-wide text-white/62"
                          }
                        >
                          {opt.label}
                        </button>
                      );
                    })}
                  </div>
                </div>
                <div className="space-y-3 rounded-xl border border-pu-border bg-black/35 p-4">
                  <p className="text-xs font-bold uppercase tracking-wide text-white/65">
                    Optional consent (opt-in)
                  </p>
                  <p className="text-[11px] font-medium text-white/45">
                    Required legal notices are in Terms — nothing here is required to use Pull Up.
                  </p>
                  <ConsentRow
                    label="Personalization"
                    hint="Tune recommendations around your lanes."
                    checked={stPersonalization}
                    onCheckedChange={setStPersonalization}
                  />
                  <ConsentRow
                    label="Analytics"
                    hint="Help improve performance and UX quality."
                    checked={stAnalytics}
                    onCheckedChange={setStAnalytics}
                  />
                  <ConsentRow
                    label="Location usage"
                    hint="Nearby moves and map context."
                    checked={stLocation}
                    onCheckedChange={setStLocation}
                  />
                  <ConsentRow
                    label="Marketing / push"
                    hint="Optional promos and launch updates."
                    checked={stMarketing}
                    onCheckedChange={setStMarketing}
                  />
                </div>
              </div>
            ) : null}

            {path === "host" ? (
              <div className="space-y-4 border-t border-pu-border pt-4">
                <p className="text-xs font-black uppercase tracking-wide text-white/55">
                  Host / organization
                </p>
                <div className="space-y-2">
                  <Label>Organization name</Label>
                  <Input
                    value={orgName}
                    onChange={(e) => setOrgName(e.target.value)}
                    className="h-11 rounded-xl border-pu-border bg-black/45"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label>Organization type</Label>
                  <Select value={orgType} onValueChange={(v) => setOrgType(v as SignupOrgType)}>
                    <SelectTrigger className="h-11 rounded-xl border-pu-border bg-black/45 text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="border-pu-border bg-zinc-950">
                      {ORG_TYPES.map((t) => (
                        <SelectItem key={t} value={t} className="text-white focus:bg-white/10">
                          {t.replace(/_/g, " ")}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Contact person</Label>
                  <Input
                    value={hostContactName}
                    onChange={(e) => setHostContactName(e.target.value)}
                    className="h-11 rounded-xl border-pu-border bg-black/45"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label>Contact email or phone</Label>
                  <Input
                    value={hostContactChannel}
                    onChange={(e) => setHostContactChannel(e.target.value)}
                    className="h-11 rounded-xl border-pu-border bg-black/45"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label>Campus</Label>
                  <select
                    value={hostCampus}
                    onChange={(e) => setHostCampus(e.target.value)}
                    className="h-11 w-full rounded-xl border border-pu-border bg-black/45 px-3 text-sm text-white"
                  >
                    {CAMPUS_OPTIONS.map((o) => (
                      <option key={o} value={o} className="bg-zinc-900">
                        {o}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2">
                  <Label>Affiliation proof URL (optional)</Label>
                  <Input
                    value={affiliationProofUrl}
                    onChange={(e) => setAffiliationProofUrl(e.target.value)}
                    className="h-11 rounded-xl border-pu-border bg-black/45"
                    placeholder="https://"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Instagram or website (optional)</Label>
                  <Input
                    value={socialUrl}
                    onChange={(e) => setSocialUrl(e.target.value)}
                    className="h-11 rounded-xl border-pu-border bg-black/45"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Short explanation</Label>
                  <Input
                    value={hostExplanation}
                    onChange={(e) => setHostExplanation(e.target.value)}
                    className="h-11 rounded-xl border-pu-border bg-black/45"
                    placeholder="Why you should be verified"
                  />
                </div>
                <div className="space-y-3 rounded-xl border border-pu-border bg-black/35 p-4">
                  <p className="text-xs font-bold uppercase tracking-wide text-white/65">
                    Host consent (opt-in)
                  </p>
                  <ConsentRow
                    label="Posting & verification data storage"
                    hint="Store the details you submit for moderation."
                    checked={hPost}
                    onCheckedChange={setHPost}
                  />
                  <ConsentRow
                    label="Event performance analytics"
                    hint="Aggregate stats on how your posts perform."
                    checked={hEventAn}
                    onCheckedChange={setHEventAn}
                  />
                  <ConsentRow
                    label="Contact for verification"
                    hint="We may reach out about your request."
                    checked={hVerContact}
                    onCheckedChange={setHVerContact}
                  />
                  <ConsentRow
                    label="Marketing / promotion emails"
                    hint="Product updates for hosts."
                    checked={hMkt}
                    onCheckedChange={setHMkt}
                  />
                </div>
              </div>
            ) : null}

            {path === "business" ? (
              <div className="space-y-4 border-t border-pu-border pt-4">
                <p className="text-xs font-black uppercase tracking-wide text-white/55">
                  Business profile
                </p>
                <div className="space-y-2">
                  <Label>Business name</Label>
                  <Input
                    value={bizName}
                    onChange={(e) => setBizName(e.target.value)}
                    className="h-11 rounded-xl border-pu-border bg-black/45"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label>Business type</Label>
                  <Select value={bizType} onValueChange={(v) => setBizType(v as SignupBusinessType)}>
                    <SelectTrigger className="h-11 rounded-xl border-pu-border bg-black/45 text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="border-pu-border bg-zinc-950">
                      {BUSINESS_TYPES.map((t) => (
                        <SelectItem key={t} value={t} className="text-white focus:bg-white/10">
                          {t}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Contact person</Label>
                  <Input
                    value={bizContactPerson}
                    onChange={(e) => setBizContactPerson(e.target.value)}
                    className="h-11 rounded-xl border-pu-border bg-black/45"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label>Business contact email or phone</Label>
                  <Input
                    value={bizContactChannel}
                    onChange={(e) => setBizContactChannel(e.target.value)}
                    className="h-11 rounded-xl border-pu-border bg-black/45"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label>Website or Instagram</Label>
                  <Input
                    value={bizWeb}
                    onChange={(e) => setBizWeb(e.target.value)}
                    className="h-11 rounded-xl border-pu-border bg-black/45"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Business address / area</Label>
                  <Input
                    value={bizArea}
                    onChange={(e) => setBizArea(e.target.value)}
                    className="h-11 rounded-xl border-pu-border bg-black/45"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label>Short explanation</Label>
                  <Input
                    value={bizExplanation}
                    onChange={(e) => setBizExplanation(e.target.value)}
                    className="h-11 rounded-xl border-pu-border bg-black/45"
                    placeholder="What you plan to post on Pull Up"
                  />
                </div>
                <div className="space-y-3 rounded-xl border border-pu-border bg-black/35 p-4">
                  <p className="text-xs font-bold uppercase tracking-wide text-white/65">
                    Business consent (opt-in)
                  </p>
                  <ConsentRow
                    label="Business verification data storage"
                    checked={bVerStore}
                    onCheckedChange={setBVerStore}
                    hint="Store details you submit for moderation."
                  />
                  <ConsentRow
                    label="Deal & event performance analytics"
                    checked={bPerf}
                    onCheckedChange={setBPerf}
                    hint="Aggregate performance of your offers."
                  />
                  <ConsentRow
                    label="Contact for verification"
                    checked={bVerContact}
                    onCheckedChange={setBVerContact}
                    hint="We may reach out about your request."
                  />
                  <ConsentRow
                    label="Marketing / promotional outreach"
                    checked={bPromo}
                    onCheckedChange={setBPromo}
                    hint="Partnership and promo opportunities."
                  />
                  <ConsentRow
                    label="Public business profile listing"
                    checked={bPublic}
                    onCheckedChange={setBPublic}
                    hint="Show your approved business on Pull Up after verification."
                  />
                </div>
              </div>
            ) : null}

            {error ? (
              <p className="text-sm font-semibold text-pu-urgent-glow">{error}</p>
            ) : null}
            {message ? (
              <p className="text-sm font-semibold text-pu-live">{message}</p>
            ) : null}

            <Button
              type="submit"
              disabled={busy || !canSubmit}
              className="h-11 w-full rounded-xl border-0 bg-gradient-to-r from-pu-magenta to-pu-amber font-black uppercase tracking-[0.08em]"
            >
              {busy ? <Loader2 className="size-4 animate-spin" /> : "Create account"}
            </Button>
            {path === "student" ? (
              <Button
                type="button"
                variant="outline"
                onClick={signUpGoogle}
                disabled={busy || !canSubmit}
                className="h-11 w-full rounded-xl border-pu-border bg-black/35 font-bold text-white"
              >
                <Sparkles className="mr-2 size-4 text-pu-amber" />
                Continue with Google
              </Button>
            ) : (
              <p className="text-center text-[11px] font-semibold text-white/45">
                Google sign-in is available for student accounts so we can route verification orgs
                through email signup.
              </p>
            )}
          </form>
        ) : null}

        <p className="text-center text-sm text-white/60">
          Already have an account?{" "}
          <Link href="/login" className="font-semibold text-pu-magenta hover:text-white">
            Sign in
          </Link>
        </p>
        <p className="text-center text-xs font-semibold text-white/45">
          By continuing you agree to our{" "}
          <Link href="/terms" className="text-pu-magenta hover:text-white">
            Terms
          </Link>{" "}
          and{" "}
          <Link href="/privacy" className="text-pu-magenta hover:text-white">
            Privacy
          </Link>
          .
        </p>
      </div>
    </div>
  );
}
