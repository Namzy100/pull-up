"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

import { AdminSubmitToolsCard } from "@/components/portal/admin-submit-tools";
import { PortalBusinessEventPromoForm } from "@/components/portal/portal-business-event-promo-form";
import { PortalBusinessForm } from "@/components/portal/portal-business-form";
import { PortalHostForm } from "@/components/portal/portal-host-form";
import { PortalRegularUser } from "@/components/portal/portal-regular-user";
import { PortalRoleSwitcher } from "@/components/portal/portal-role-switcher";
import {
  AdminPageAmbient,
  BusinessSectionLabel,
  BusinessSubmitAmbient,
  BusinessSurface,
  HostSectionLabel,
  HostSubmitAmbient,
  HostSurface,
} from "@/components/role-surfaces/role-surfaces";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { hasSupabaseEnv } from "@/lib/supabase/env";
import {
  listBusinessSubmissionsByUser,
  listHostSubmissionsByUser,
} from "@/lib/supabase/repositories";
import {
  businessSubmissionRowToPending,
  hostSubmissionRowToPending,
} from "@/lib/supabase/submission-views";
import type {
  PendingBusinessDealSubmission,
  PendingHostEventSubmission,
} from "@/lib/portal-types";
import type { MockProfileSession, MockUserRole, RequestedRole, VerificationStatus } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { useAppStore } from "@/store/use-app-store";
import { cn } from "@/lib/utils";

type PostPortalProps = {
  forcedRole?: MockUserRole;
  forcedRequestedRole?: RequestedRole;
  forcedVerificationStatus?: VerificationStatus;
  /** Admin previewing business/host submit surfaces — not live role. */
  previewSurface?: boolean;
};

export function PostPortal({
  forcedRole,
  forcedRequestedRole,
  forcedVerificationStatus,
  previewSurface,
}: PostPortalProps) {
  const role = useAppStore((s) => s.mockUserRole);
  const profile = useAppStore((s) => s.mockProfile);
  const setRole = useAppStore((s) => s.setMockUserRole);
  const effectiveRole = forcedRole ?? role;
  const requestedRole = forcedRequestedRole ?? profile.requestedRole;
  const verificationStatus = forcedVerificationStatus ?? profile.verificationStatus;
  const showPending =
    effectiveRole === "regular_user" &&
    requestedRole !== "none" &&
    verificationStatus === "pending";
  const showRejected =
    effectiveRole === "regular_user" &&
    requestedRole !== "none" &&
    verificationStatus === "rejected";

  const surfaceKey = `${effectiveRole}-${requestedRole}-${verificationStatus}`;

  return (
    <div className="pu-screen pb-4 pt-8 sm:pt-10">
      {effectiveRole === "business" ? (
        <BusinessSubmitAmbient />
      ) : effectiveRole === "host" ? (
        <HostSubmitAmbient />
      ) : effectiveRole === "admin" ? (
        <AdminPageAmbient />
      ) : (
        <div className="pointer-events-none absolute inset-x-0 top-0 h-[360px] bg-[radial-gradient(ellipse_85%_55%_at_50%_-12%,oklch(0.55_0.22_328/0.2),transparent_58%)]" />
      )}

      <div className="relative mx-auto w-full max-w-xl space-y-6 px-4">
        {previewSurface ? (
          <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-[0.8125rem] font-medium text-amber-100">
            <span className="font-semibold">Preview mode</span> — you are viewing another role&apos;s
            workspace.{" "}
            <Link href="/submit" className="underline underline-offset-2 hover:text-white">
              Exit preview
            </Link>
          </div>
        ) : null}
        <header className="space-y-3">
          {effectiveRole === "business" ? (
            <>
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-amber-200/65">
                Merchant hub
              </p>
              <h1 className="font-heading text-[1.85rem] font-extrabold tracking-tight text-white sm:text-[2.1rem]">
                Promotions &amp; deals
              </h1>
              <p className="max-w-[24rem] text-[0.8125rem] font-medium leading-relaxed text-zinc-400">
                Turn campus attention into foot traffic. Drop offers while students are deciding
                where to go — everything here routes through review before it goes live.
              </p>
            </>
          ) : effectiveRole === "host" ? (
            <>
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-pu-magenta/75">
                Event command
              </p>
              <h1 className="font-heading text-[1.85rem] font-extrabold tracking-tight text-white sm:text-[2.1rem]">
                Host dashboard
              </h1>
              <p className="max-w-[24rem] text-[0.8125rem] font-medium leading-relaxed text-white/60">
                Build the move before the crowd decides. Momentum starts before doors open — post
                clear cover, vibe, and flyer so Tonight can carry your night.
              </p>
            </>
          ) : effectiveRole === "admin" ? (
            <>
              <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-zinc-500">
                Trust &amp; safety
              </p>
              <h1 className="text-[1.65rem] font-semibold tracking-tight text-white sm:text-[1.85rem]">
                Admin tools
              </h1>
              <p className="max-w-[24rem] text-[0.8125rem] leading-relaxed text-zinc-500">
                Keep the feed trusted. Review identity, safety, and content quality in the full
                moderation workspace — this page stays focused on quick access.
              </p>
            </>
          ) : (
            <>
              <p className="pu-eyebrow">Pull Up</p>
              <h1 className="pu-display text-[2.1rem] sm:text-[2.45rem]">Submit</h1>
              <p className="pu-meta max-w-[22rem] leading-relaxed">
                {forcedRole
                  ? "Your posting workspace — requests, drafts, and verification status stay tied to your account."
                  : "Switch roles to preview the experience. Mock-local until you connect Supabase."}
              </p>
            </>
          )}
        </header>

        {!forcedRole ? <PortalRoleSwitcher role={role} onChange={setRole} /> : null}

        <AnimatePresence mode="wait">
          <motion.div
            key={surfaceKey}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
          >
            {effectiveRole === "regular_user" ? (
              showPending ? (
                <div className="space-y-4">
                  <PendingReviewCard requestedRole={requestedRole} variant="pending" />
                  <p className="text-center text-xs font-medium text-white/55">
                    Tune discovery anytime in{" "}
                    <Link href="/profile" className="text-pu-magenta hover:text-white">
                      Profile → Interests
                    </Link>
                    .
                  </p>
                </div>
              ) : showRejected ? (
                <div className="space-y-4">
                  <PendingReviewCard requestedRole={requestedRole} variant="rejected" />
                  <PortalRegularUser
                    variant="resubmit"
                    resubmitRole={requestedRole === "business" ? "business" : "host"}
                  />
                </div>
              ) : (
                <PortalRegularUser variant="request" />
              )
            ) : null}
            {effectiveRole === "host" ? (
              <HostDashboard
                canOperate={effectiveRole === "host" && verificationStatus === "approved"}
              />
            ) : null}
            {effectiveRole === "business" ? (
              <BusinessDashboard
                canOperate={effectiveRole === "business" && verificationStatus === "approved"}
              />
            ) : null}
            {effectiveRole === "admin" ? <AdminSubmitToolsCard /> : null}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}

function PendingReviewCard({
  requestedRole,
  variant,
}: {
  requestedRole: RequestedRole;
  variant: "pending" | "rejected";
}) {
  const label = requestedRole === "business" ? "business" : "host";
  if (variant === "rejected") {
    return (
      <div className="mb-4 rounded-2xl border border-pu-urgent/35 bg-black/45 p-4 text-sm font-semibold text-white/80">
        Your {label} verification was not approved. You can still browse Pull Up as a regular user.
        <div className="mt-2 text-xs font-medium text-white/55">
          Submit a fresh access request below with updated details — posting stays off until a new
          approval.
        </div>
      </div>
    );
  }
  return (
    <div className="mb-4 rounded-2xl border border-pu-amber/35 bg-black/45 p-4 text-sm font-semibold text-white/80">
      We review {label}s to keep the feed trusted. You can browse the app while pending — posting
      unlocks after approval.
      <div className="mt-1 text-pu-amber">Requested: {label} access.</div>
      <div className="mt-2 text-xs font-medium text-white/55">
        Expect an email or in-app update once moderators finish. Your{" "}
        <Link href="/profile" className="text-pu-magenta hover:text-white">
          profile
        </Link>{" "}
        shows the same status.
      </div>
    </div>
  );
}

function sortSubmittedDesc<T extends { submittedAt: string }>(rows: T[]): T[] {
  return [...rows].sort((a, b) => (a.submittedAt < b.submittedAt ? 1 : -1));
}

function VerificationBadge({ status }: { status: VerificationStatus }) {
  if (status === "approved") {
    return (
      <span className="inline-flex items-center rounded-full border border-pu-live/45 bg-pu-live/15 px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wide text-pu-live">
        Verified
      </span>
    );
  }
  if (status === "pending") {
    return (
      <span className="inline-flex items-center rounded-full border border-pu-amber/45 bg-pu-amber/15 px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wide text-pu-amber">
        Pending
      </span>
    );
  }
  if (status === "rejected") {
    return (
      <span className="inline-flex items-center rounded-full border border-pu-urgent/45 bg-pu-urgent/12 px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wide text-pu-urgent-glow">
        Rejected
      </span>
    );
  }
  return (
    <span className="inline-flex rounded-full border border-white/15 bg-white/5 px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wide text-white/50">
      Unverified
    </span>
  );
}

function SuggestionsList({
  items,
  variant = "default",
}: {
  items: readonly string[];
  variant?: "default" | "business" | "host";
}) {
  const dot =
    variant === "business" ? (
      <span className="mt-0.5 size-1.5 shrink-0 rounded-full bg-amber-400/90 shadow-[0_0_10px_rgba(251,191,36,0.35)]" />
    ) : variant === "host" ? (
      <span className="mt-0.5 size-1.5 shrink-0 rounded-full bg-pu-magenta shadow-[0_0_8px_oklch(0.7_0.25_328/0.55)]" />
    ) : (
      <span className="mt-0.5 size-1.5 shrink-0 rounded-full bg-pu-magenta shadow-[0_0_8px_oklch(0.7_0.25_328/0.6)]" />
    );
  const liClass =
    variant === "business"
      ? "flex gap-2 rounded-xl border border-white/[0.06] bg-black/40 px-3 py-2.5 text-[0.8125rem] font-medium leading-snug text-zinc-300"
      : variant === "host"
        ? "flex gap-2 rounded-xl border border-pu-border/60 bg-black/35 px-3 py-2.5 text-[0.8125rem] font-medium leading-snug text-white/82"
        : "flex gap-2 rounded-xl border border-pu-border/60 bg-black/30 px-3 py-2 text-[0.8125rem] font-medium leading-snug text-white/78";
  return (
    <ul className="space-y-2">
      {items.map((text) => (
        <li key={text} className={liClass}>
          {dot}
          {text}
        </li>
      ))}
    </ul>
  );
}

function BusinessDashboard({ canOperate }: { canOperate: boolean }) {
  const profile = useAppStore((s) => s.mockProfile);
  const [sections, setSections] = useState<{
    pending: PendingBusinessDealSubmission[];
    approved: PendingBusinessDealSubmission[];
    rejected: PendingBusinessDealSubmission[];
  } | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);

  const loadMine = useCallback(async () => {
    await Promise.resolve();
    setLoadError(null);
    if (!hasSupabaseEnv()) {
      setSections({ pending: [], approved: [], rejected: [] });
      return;
    }
    try {
      const supabase = createSupabaseBrowserClient();
      const {
        data: { user },
        error: authErr,
      } = await supabase.auth.getUser();
      if (authErr) {
        console.error("[BusinessDashboard] auth", authErr.message);
        setLoadError("Could not load session.");
        return;
      }
      if (!user) {
        setSections({ pending: [], approved: [], rejected: [] });
        return;
      }
      const rows = await listBusinessSubmissionsByUser(supabase, user.id);
      const mapped = rows
        .map((r) => businessSubmissionRowToPending(r))
        .filter((x): x is PendingBusinessDealSubmission => x != null);
      setSections({
        pending: mapped.filter((m) => m.status === "pending"),
        approved: mapped.filter((m) => m.status === "approved"),
        rejected: mapped.filter((m) => m.status === "rejected"),
      });
    } catch (e) {
      console.error("[BusinessDashboard] load", e);
      setLoadError("Could not load deals and promos.");
      setSections({ pending: [], approved: [], rejected: [] });
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      await loadMine();
      if (cancelled) return;
    })();
    return () => {
      cancelled = true;
    };
  }, [loadMine]);

  const active = sections?.approved ?? [];
  const pending = sections?.pending ?? [];
  const rejected = sections?.rejected ?? [];
  const hasData = hasSupabaseEnv();
  const activeN = active.length;
  const pendingN = pending.length;

  const viewsVal =
    hasData && sections ? String(4200 + activeN * 180 + pendingN * 40) : "12.4k";
  const savesVal = hasData && sections ? String(820 + activeN * 64 + pendingN * 12) : "1.9k";
  const claimsVal = hasData && sections ? String(210 + activeN * 38) : "413";
  const pullUpsVal = hasData && sections ? String(140 + activeN * 22) : "620";
  const convVal =
    hasData && sections
      ? `${Math.min(18, 4 + activeN * 1.4 + pendingN * 0.2).toFixed(1)}%`
      : "8.2%";

  const social = profile.businessWebsite?.trim();
  const socialIsUrl = social?.startsWith("http");

  if (!canOperate) {
    return (
      <div className="space-y-4">
        <BusinessSurface className="p-5">
          <BusinessProfileCard
            profile={profile}
            social={social}
            socialIsUrl={Boolean(socialIsUrl)}
            embedded
          />
        </BusinessSurface>
        <BusinessSurface className="border-amber-500/20 p-4">
          <p className="text-sm font-semibold text-zinc-200">
            Posting stays locked until your business is verified.
          </p>
          <p className="mt-1 text-[0.8125rem] font-medium text-zinc-500">
            Once approved, this becomes your full merchant dashboard with deal creation and offer
            health.
          </p>
        </BusinessSurface>
      </div>
    );
  }

  const businessPlaybook = [
    "Turn campus attention into foot traffic.",
    "Drop an offer while students are deciding where to go.",
    "Your strongest window is 8–11 PM.",
    "Student-only deals tend to save better.",
  ] as const;

  return (
    <div className="space-y-5">
      <BusinessSurface className="p-5">
        <BusinessProfileCard
          profile={profile}
          social={social}
          socialIsUrl={Boolean(socialIsUrl)}
          embedded
        />
      </BusinessSurface>

      <div id="performance" className="grid gap-3 sm:grid-cols-2">
        <BusinessSurface className="p-4">
          <BusinessSectionLabel>Performance strip</BusinessSectionLabel>
          <h2 className="mt-1.5 font-heading text-base font-bold text-white">Signals (estimated)</h2>
          <p className="mt-1 text-[11px] font-medium leading-relaxed text-zinc-500">
            Blended with campus placeholders until live analytics connect.
          </p>
          <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-3">
            <Metric label="Views" value={viewsVal} variant="business" />
            <Metric label="Saves" value={savesVal} variant="business" />
            <Metric label="Claims" value={claimsVal} variant="business" />
            <Metric label="Pull-ups" value={pullUpsVal} variant="business" />
            <Metric label="Conv. est." value={convVal} variant="business" />
          </div>
        </BusinessSurface>
        <BusinessSurface className="flex flex-col p-4">
          <BusinessSectionLabel>Today&apos;s opportunity</BusinessSectionLabel>
          <p className="mt-2 font-heading text-lg font-bold text-white">Your strongest window is 8–11 PM.</p>
          <p className="mt-2 flex-1 text-[0.8125rem] font-medium leading-relaxed text-zinc-400">
            Drop an offer while students are deciding where to go — limited windows read louder on
            campus feeds.
          </p>
          <p className="mt-3 text-[11px] font-semibold text-amber-200/80">
            Tip: pair a clear perk with a tight time box.
          </p>
        </BusinessSurface>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <BusinessSurface className="p-4">
          <BusinessSectionLabel>Recommended action</BusinessSectionLabel>
          <p className="mt-2 text-sm font-semibold text-zinc-200">Student-only deals tend to save better.</p>
          <p className="mt-1 text-[0.8125rem] text-zinc-500">
            When eligibility is obvious, students bookmark faster and redemption feels safer.
          </p>
        </BusinessSurface>
        <BusinessSurface className="p-4">
          <BusinessSectionLabel>Offer health</BusinessSectionLabel>
          <div className="mt-3 grid grid-cols-3 gap-2">
            <div className="rounded-lg border border-pu-live/25 bg-black/40 px-2 py-2.5 text-center">
              <p className="text-[9px] font-bold uppercase tracking-wide text-zinc-500">Active</p>
              <p className="mt-1 font-heading text-xl font-bold tabular-nums text-pu-live">{activeN}</p>
            </div>
            <div className="rounded-lg border border-amber-500/25 bg-black/40 px-2 py-2.5 text-center">
              <p className="text-[9px] font-bold uppercase tracking-wide text-zinc-500">Pending</p>
              <p className="mt-1 font-heading text-xl font-bold tabular-nums text-amber-200">
                {pendingN}
              </p>
            </div>
            <div className="rounded-lg border border-pu-urgent/25 bg-black/40 px-2 py-2.5 text-center">
              <p className="text-[9px] font-bold uppercase tracking-wide text-zinc-500">Rejected</p>
              <p className="mt-1 font-heading text-xl font-bold tabular-nums text-pu-urgent-glow">
                {rejected.length}
              </p>
            </div>
          </div>
        </BusinessSurface>
      </div>

      <BusinessSurface className="p-4">
        <BusinessSectionLabel>Playbook</BusinessSectionLabel>
        <p className="mt-1 text-[11px] font-medium text-zinc-500">Calibrate how you show up on campus.</p>
        <div className="mt-3">
          <SuggestionsList items={businessPlaybook} variant="business" />
        </div>
      </BusinessSurface>

      {loadError ? (
        <p className="rounded-xl border border-pu-urgent/35 bg-pu-urgent/10 px-3 py-2 text-sm font-semibold text-pu-urgent-glow">
          {loadError}
        </p>
      ) : null}

      <BusinessSurface className="space-y-3 p-4">
        <BusinessSectionLabel>Your submissions</BusinessSectionLabel>
        <DealSubmissionBucket
          title="Live"
          subtitle="Approved deals & promos"
          rows={sortSubmittedDesc(active)}
          emptyHint="Nothing approved yet — ship a deal or event below."
          variant="business"
        />
        <DealSubmissionBucket
          title="Pending"
          subtitle="Moderation queue"
          rows={sortSubmittedDesc(pending)}
          emptyHint="Nothing in review. New submissions appear here."
          variant="business"
        />
        <DealSubmissionBucket
          title="Rejected"
          subtitle="Revise and resubmit"
          rows={sortSubmittedDesc(rejected)}
          emptyHint="Clean sheet — rejected items land here."
          variant="business"
        />
      </BusinessSurface>

      <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center">
        <Button
          asChild
          variant="outline"
          className="h-10 rounded-xl border-white/10 bg-black/40 text-xs font-bold text-zinc-200 hover:bg-black/60"
        >
          <Link href="#create-deal">Create deal</Link>
        </Button>
        <Button
          asChild
          variant="outline"
          className="h-10 rounded-xl border-amber-500/35 bg-amber-950/30 text-xs font-bold text-amber-100 hover:bg-amber-950/50"
        >
          <Link href="#create-business-event">Create event / promo bundle</Link>
        </Button>
        <Button
          asChild
          variant="outline"
          className="h-10 rounded-xl border-white/10 bg-black/30 text-xs font-bold text-zinc-400 hover:text-white"
        >
          <Link href="#performance">View performance</Link>
        </Button>
        <Button
          asChild
          variant="outline"
          className="h-10 rounded-xl border-white/10 bg-black/30 text-xs font-bold text-zinc-400 hover:text-white"
        >
          <Link href="/profile">Update business profile</Link>
        </Button>
      </div>

      <BusinessSurface id="create-deal" className="border-amber-500/15 p-4">
        <BusinessSectionLabel>Primary action</BusinessSectionLabel>
        <h3 className="mt-1 font-heading text-base font-bold text-white">Create deal</h3>
        <p className="mt-1 text-[0.8125rem] font-medium text-zinc-500">
          Perk, window, and area — routed to moderation before /deals.
        </p>
        <div className="mt-4">
          <PortalBusinessForm onSubmitted={() => void loadMine()} />
        </div>
      </BusinessSurface>

      <BusinessSurface id="create-business-event" className="border-amber-500/25 p-4">
        <BusinessSectionLabel>Bundle &amp; nightlife</BusinessSectionLabel>
        <h3 className="mt-1 font-heading text-base font-bold text-white">Create event / promo</h3>
        <p className="mt-1 text-[0.8125rem] font-medium text-zinc-500">
          Timed listings for Tonight or Deals — routed through the same moderation queue.
        </p>
        <div className="mt-4">
          <PortalBusinessEventPromoForm onSubmitted={() => void loadMine()} />
        </div>
      </BusinessSurface>
    </div>
  );
}

function BusinessProfileCard({
  profile,
  social,
  socialIsUrl,
  embedded,
}: {
  profile: MockProfileSession;
  social: string | undefined;
  socialIsUrl: boolean;
  embedded?: boolean;
}) {
  return (
    <div
      className={
        embedded
          ? "overflow-hidden"
          : "overflow-hidden rounded-2xl border border-pu-border bg-gradient-to-br from-pu-surface-deep/95 via-black to-black p-5 shadow-[0_0_36px_-14px_oklch(0.65_0.22_328/0.28)]"
      }
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0 space-y-2">
          <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-amber-200/55">
            Verified partner
          </p>
          <h2 className="font-heading text-xl font-extrabold tracking-tight text-white sm:text-2xl">
            {profile.businessName?.trim() || "Your business"}
          </h2>
          <div className="flex flex-wrap items-center gap-2">
            <VerificationBadge status={profile.verificationStatus} />
            {profile.businessType ? (
              <span className="rounded-md border border-white/12 bg-white/5 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white/65">
                {profile.businessType}
              </span>
            ) : null}
          </div>
        </div>
      </div>
      <dl
        className={cn(
          "mt-4 grid gap-2 text-sm sm:grid-cols-2",
          embedded ? "border-t border-white/[0.06] pt-4" : "border-t border-pu-border/50 pt-4"
        )}
      >
        <div>
          <dt className="text-[10px] font-bold uppercase tracking-wide text-zinc-500">Area</dt>
          <dd className="mt-0.5 font-medium text-zinc-200">{profile.campus?.trim() || "—"}</dd>
        </div>
        <div>
          <dt className="text-[10px] font-bold uppercase tracking-wide text-zinc-500">Contact</dt>
          <dd className="mt-0.5 font-medium text-zinc-200">{profile.businessContact?.trim() || "—"}</dd>
        </div>
        <div className="sm:col-span-2">
          <dt className="text-[10px] font-bold uppercase tracking-wide text-zinc-500">Web / social</dt>
          <dd className="mt-0.5 break-all font-medium text-zinc-200">
            {social ? (
              socialIsUrl ? (
                <a
                  href={social}
                  className="text-amber-300/90 hover:text-amber-200"
                  target="_blank"
                  rel="noreferrer"
                >
                  {social}
                </a>
              ) : (
                social
              )
            ) : (
              "—"
            )}
          </dd>
        </div>
      </dl>
    </div>
  );
}

function DealSubmissionBucket({
  title,
  subtitle,
  rows,
  emptyHint,
  variant = "default",
}: {
  title: string;
  subtitle: string;
  rows: PendingBusinessDealSubmission[];
  emptyHint: string;
  variant?: "default" | "business";
}) {
  return (
    <div
      className={cn(
        "rounded-xl p-3.5",
        variant === "business"
          ? "border border-white/[0.06] bg-black/35"
          : "rounded-2xl border border-pu-border bg-black/40 ring-1 ring-white/[0.04]"
      )}
    >
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <div>
          <p className="text-[10px] font-black uppercase tracking-wide text-white/45">{title}</p>
          <p className="text-[11px] font-medium text-white/50">{subtitle}</p>
        </div>
        <span className="rounded-full border border-white/10 bg-white/5 px-2 py-0.5 text-[10px] font-bold tabular-nums text-white/70">
          {rows.length}
        </span>
      </div>
      {rows.length === 0 ? (
        <p className="mt-3 rounded-xl border border-dashed border-pu-border/80 bg-black/25 px-3 py-4 text-center text-xs font-medium text-white/50">
          {emptyHint}
        </p>
      ) : (
        <ul className="mt-3 space-y-2">
          {rows.slice(0, 6).map((r) => {
            const isPromo = r.submissionKind === "event_promo";
            const badge = isPromo ? "Event / promo" : "Deal";
            const subline = isPromo
              ? `${r.eventDate ?? r.validFrom} · ${r.eventStartTime ?? ""}–${r.eventEndTime ?? ""} · ${r.area}`
              : `${r.validFrom} → ${r.validUntil} · ${r.area}`;
            return (
            <li
              key={r.id}
              className="rounded-xl border border-pu-border/60 bg-black/35 px-3 py-2.5 transition hover:border-pu-magenta/35"
            >
              <div className="flex flex-wrap items-start justify-between gap-2">
                <p className="min-w-0 font-heading text-sm font-extrabold text-white">{r.dealTitle}</p>
                <div className="flex shrink-0 flex-col items-end gap-1">
                  <span className="rounded-md border border-white/10 px-1.5 py-0.5 text-[9px] font-black uppercase tracking-wide text-white/55">
                    {badge}
                  </span>
                  {!isPromo ? (
                    <span className="rounded-md border border-white/10 px-1.5 py-0.5 text-[9px] font-black uppercase tracking-wide text-white/40">
                      {r.categoryLabel}
                    </span>
                  ) : r.promoTypeLabel ? (
                    <span className="rounded-md border border-amber-500/25 px-1.5 py-0.5 text-[9px] font-black uppercase tracking-wide text-amber-200/80">
                      {r.promoTypeLabel}
                    </span>
                  ) : null}
                </div>
              </div>
              <p className="mt-1 text-[11px] text-white/55">
                {subline}
                {r.studentOnly ? " · Student-only" : ""}
              </p>
              <p className="mt-0.5 text-[10px] font-semibold text-white/35">
                {new Date(r.submittedAt).toLocaleString(undefined, {
                  month: "short",
                  day: "numeric",
                  hour: "numeric",
                  minute: "2-digit",
                })}
              </p>
            </li>
            );
          })}
        </ul>
      )}
      {rows.length > 6 ? (
        <p className="mt-2 text-center text-[10px] font-bold uppercase tracking-wide text-white/40">
          Showing 6 most recent
        </p>
      ) : null}
    </div>
  );
}

function HostDashboard({ canOperate }: { canOperate: boolean }) {
  const profile = useAppStore((s) => s.mockProfile);
  const [sections, setSections] = useState<{
    pending: PendingHostEventSubmission[];
    approved: PendingHostEventSubmission[];
    rejected: PendingHostEventSubmission[];
  } | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);

  const loadMine = useCallback(async () => {
    await Promise.resolve();
    setLoadError(null);
    if (!hasSupabaseEnv()) {
      setSections({ pending: [], approved: [], rejected: [] });
      return;
    }
    try {
      const supabase = createSupabaseBrowserClient();
      const {
        data: { user },
        error: authErr,
      } = await supabase.auth.getUser();
      if (authErr) {
        console.error("[HostDashboard] auth", authErr.message);
        setLoadError("Could not load session.");
        return;
      }
      if (!user) {
        setSections({ pending: [], approved: [], rejected: [] });
        return;
      }
      const rows = await listHostSubmissionsByUser(supabase, user.id);
      const mapped = rows
        .map((r) => hostSubmissionRowToPending(r))
        .filter((x): x is PendingHostEventSubmission => x != null);
      setSections({
        pending: mapped.filter((m) => m.status === "pending"),
        approved: mapped.filter((m) => m.status === "approved"),
        rejected: mapped.filter((m) => m.status === "rejected"),
      });
    } catch (e) {
      console.error("[HostDashboard] load", e);
      setLoadError("Could not load events.");
      setSections({ pending: [], approved: [], rejected: [] });
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      await loadMine();
      if (cancelled) return;
    })();
    return () => {
      cancelled = true;
    };
  }, [loadMine]);

  const active = sections?.approved ?? [];
  const pending = sections?.pending ?? [];
  const rejected = sections?.rejected ?? [];
  const hasData = hasSupabaseEnv();
  const activeN = active.length;

  const viewsVal = hasData && sections ? String(3800 + activeN * 220) : "8.4k";
  const rsvpVal = hasData && sections ? String(420 + activeN * 52) : "420";
  const savesVal = hasData && sections ? String(360 + activeN * 28) : "1.2k";
  const pullUpsVal = hasData && sections ? String(120 + activeN * 18) : "188";
  const momentum =
    hasData && sections
      ? activeN >= 3
        ? "High"
        : activeN >= 1
          ? "Rising"
          : "Building"
      : "Rising";

  const social = profile.businessWebsite?.trim();
  const socialIsUrl = social?.startsWith("http");

  if (!canOperate) {
    return (
      <div className="space-y-4">
        <HostSurface className="p-5">
          <HostProfileCard profile={profile} social={social} socialIsUrl={Boolean(socialIsUrl)} embedded />
        </HostSurface>
        <HostSurface className="border-pu-magenta/25 p-4">
          <p className="text-sm font-semibold text-white">Posting stays locked until your host account is verified.</p>
          <p className="mt-1 text-[0.8125rem] font-medium text-white/55">
            After approval, this dashboard unlocks event creation, momentum signals, and submission
            lists.
          </p>
        </HostSurface>
      </div>
    );
  }

  const hostPlaybook = [
    "Clarify cover and stag rules before doors — fewer DMs, faster pull-ups.",
    "Add a flyer image and vibe / music tags so Tonight feels undeniable.",
    "Post earlier in the week — discovery spikes midweek afternoons.",
    "Use RSVP when capacity is tight so the line stays controlled.",
  ] as const;

  return (
    <div className="space-y-5">
      <HostSurface className="p-5">
        <HostProfileCard profile={profile} social={social} socialIsUrl={Boolean(socialIsUrl)} embedded />
      </HostSurface>

      <div className="grid gap-3 sm:grid-cols-2">
        <HostSurface className="p-4">
          <HostSectionLabel>Next move</HostSectionLabel>
          <p className="mt-2 font-heading text-lg font-extrabold text-white">Build hype before doors.</p>
          <p className="mt-2 text-[0.8125rem] font-medium leading-relaxed text-white/60">
            Clear cover + vibe info increases saves. Momentum starts before the crowd decides.
          </p>
        </HostSurface>
        <HostSurface id="host-momentum" className="p-4">
          <HostSectionLabel>Crowd readiness</HostSectionLabel>
          <p className="mt-2 text-sm font-semibold text-pu-amber">
            Line state: {momentum === "High" ? "Hot" : momentum === "Rising" ? "Warming" : "Building"}
          </p>
          <p className="mt-1 text-[11px] text-white/55">
            RSVP / saves / watchers blend with placeholders until live attendance syncs.
          </p>
        </HostSurface>
      </div>

      <HostSurface className="p-4">
        <HostSectionLabel>Event momentum</HostSectionLabel>
        <h2 className="mt-1 font-heading text-base font-extrabold text-white">Pulse (estimated)</h2>
        <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-3">
          <Metric label="Views" value={viewsVal} variant="host" />
          <Metric label="RSVPs" value={rsvpVal} variant="host" />
          <Metric label="Saves" value={savesVal} variant="host" />
          <Metric label="Pull-ups" value={pullUpsVal} variant="host" />
          <Metric label="Momentum" value={momentum} variant="host" />
        </div>
      </HostSurface>

      <HostSurface className="p-4">
        <HostSectionLabel>Suggested fixes</HostSectionLabel>
        <SuggestionsList items={hostPlaybook} variant="host" />
      </HostSurface>

      {loadError ? (
        <p className="rounded-xl border border-pu-urgent/35 bg-pu-urgent/10 px-3 py-2 text-sm font-semibold text-pu-urgent-glow">
          {loadError}
        </p>
      ) : null}

      <HostSurface id="host-lists" className="space-y-3 p-4">
        <HostSubmissionBucket
          title="Approved events"
          subtitle="Live on Tonight"
          rows={sortSubmittedDesc(active)}
          emptyHint="No approved events yet — publish your first night below."
          variant="host"
        />
        <HostSubmissionBucket
          title="Pending events"
          subtitle="Moderation queue"
          rows={sortSubmittedDesc(pending)}
          emptyHint="Nothing in review. New drops appear here."
          variant="host"
        />
        <HostSubmissionBucket
          title="Rejected"
          subtitle="Tighten details and resubmit"
          rows={sortSubmittedDesc(rejected)}
          emptyHint="No rejections on file."
          variant="host"
        />
      </HostSurface>

      <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
        <Button
          asChild
          variant="outline"
          className="h-10 rounded-xl border-pu-magenta/25 bg-black/40 text-xs font-bold text-white hover:bg-black/55"
        >
          <Link href="#create-event">Create event</Link>
        </Button>
        <Button
          asChild
          variant="outline"
          className="h-10 rounded-xl border-white/10 bg-black/35 text-xs font-bold text-white/70 hover:text-white"
        >
          <Link href="#host-lists">View pending events</Link>
        </Button>
        <Button
          asChild
          variant="outline"
          className="h-10 rounded-xl border-white/10 bg-black/35 text-xs font-bold text-white/70 hover:text-white"
        >
          <Link href="#host-lists">View approved events</Link>
        </Button>
        <Button
          asChild
          variant="outline"
          className="h-10 rounded-xl border-white/10 bg-black/35 text-xs font-bold text-white/70 hover:text-white"
        >
          <Link href="/profile">Update org profile</Link>
        </Button>
      </div>

      <HostSurface id="create-event" className="border-pu-magenta/20 p-4">
        <HostSectionLabel>Primary action</HostSectionLabel>
        <h3 className="mt-1 font-heading text-base font-extrabold text-white">Create event</h3>
        <p className="mt-1 text-[0.8125rem] text-white/60">
          Flyer, times, and vibe — moderation before Tonight.
        </p>
        <div className="mt-4">
          <PortalHostForm onSubmitted={() => void loadMine()} />
        </div>
      </HostSurface>
    </div>
  );
}

function HostProfileCard({
  profile,
  social,
  socialIsUrl,
  embedded,
}: {
  profile: MockProfileSession;
  social: string | undefined;
  socialIsUrl: boolean;
  embedded?: boolean;
}) {
  const orgType = profile.organizationType?.replace(/_/g, " ") || "Organization";
  return (
    <div
      className={
        embedded
          ? "overflow-hidden"
          : "overflow-hidden rounded-2xl border border-pu-border bg-gradient-to-br from-pu-surface-deep/95 via-black to-black p-5 shadow-[0_0_36px_-14px_oklch(0.72_0.17_72/0.22)]"
      }
    >
      <div className="space-y-2">
        <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-pu-magenta/70">
          Host org
        </p>
        <h2 className="font-heading text-xl font-extrabold tracking-tight text-white sm:text-2xl">
          {profile.organizationName?.trim() || "Your organization"}
        </h2>
        <div className="flex flex-wrap items-center gap-2">
          <VerificationBadge status={profile.verificationStatus} />
          <span className="rounded-md border border-white/12 bg-white/5 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white/65">
            {orgType}
          </span>
        </div>
      </div>
      <dl
        className={cn(
          "mt-4 grid gap-2 text-sm sm:grid-cols-2",
          embedded ? "border-t border-white/[0.07] pt-4" : "border-t border-pu-border/50 pt-4"
        )}
      >
        <div>
          <dt className="text-[10px] font-bold uppercase tracking-wide text-white/45">Campus</dt>
          <dd className="mt-0.5 font-medium text-white/88">{profile.campus?.trim() || "—"}</dd>
        </div>
        <div>
          <dt className="text-[10px] font-bold uppercase tracking-wide text-white/45">Contact</dt>
          <dd className="mt-0.5 font-medium text-white/88">{profile.businessContact?.trim() || "—"}</dd>
        </div>
        <div className="sm:col-span-2">
          <dt className="text-[10px] font-bold uppercase tracking-wide text-white/45">Social / proof</dt>
          <dd className="mt-0.5 break-all font-medium text-white/85">
            {social ? (
              socialIsUrl ? (
                <a href={social} className="text-pu-amber hover:text-white" target="_blank" rel="noreferrer">
                  {social}
                </a>
              ) : (
                social
              )
            ) : (
              "—"
            )}
          </dd>
        </div>
      </dl>
    </div>
  );
}

function HostSubmissionBucket({
  title,
  subtitle,
  rows,
  emptyHint,
  variant = "default",
}: {
  title: string;
  subtitle: string;
  rows: PendingHostEventSubmission[];
  emptyHint: string;
  variant?: "default" | "host";
}) {
  return (
    <div
      className={cn(
        "p-3.5",
        variant === "host"
          ? "rounded-xl border border-pu-magenta/15 bg-black/35"
          : "rounded-2xl border border-pu-border bg-black/40 ring-1 ring-white/[0.04]"
      )}
    >
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <div>
          <p className="text-[10px] font-black uppercase tracking-wide text-white/45">{title}</p>
          <p className="text-[11px] font-medium text-white/50">{subtitle}</p>
        </div>
        <span className="rounded-full border border-white/10 bg-white/5 px-2 py-0.5 text-[10px] font-bold tabular-nums text-white/70">
          {rows.length}
        </span>
      </div>
      {rows.length === 0 ? (
        <p className="mt-3 rounded-xl border border-dashed border-pu-border/80 bg-black/25 px-3 py-4 text-center text-xs font-medium text-white/50">
          {emptyHint}
        </p>
      ) : (
        <ul className="mt-3 space-y-2">
          {rows.slice(0, 6).map((r) => (
            <li
              key={r.id}
              className="rounded-xl border border-pu-border/60 bg-black/35 px-3 py-2.5 transition hover:border-pu-amber/35"
            >
              <p className="font-heading text-sm font-extrabold text-white">{r.title}</p>
              <p className="mt-1 text-[11px] text-white/60">
                {r.venue} · {r.area} · {r.date} {r.startTime}–{r.endTime}
              </p>
              <p className="mt-0.5 text-[11px] text-white/50">
                {r.categoryLabel} · {r.entryType}
                {r.coverDollars != null ? ` · $${r.coverDollars}` : ""}
              </p>
              <p className="mt-0.5 text-[10px] font-semibold text-white/35">
                {new Date(r.submittedAt).toLocaleString(undefined, {
                  month: "short",
                  day: "numeric",
                  hour: "numeric",
                  minute: "2-digit",
                })}
              </p>
            </li>
          ))}
        </ul>
      )}
      {rows.length > 6 ? (
        <p className="mt-2 text-center text-[10px] font-bold uppercase tracking-wide text-white/40">
          Showing 6 most recent
        </p>
      ) : null}
    </div>
  );
}

function Metric({
  label,
  value,
  variant = "default",
}: {
  label: string;
  value: string;
  variant?: "default" | "business" | "host";
}) {
  return (
    <div
      className={cn(
        "rounded-xl px-3 py-2",
        variant === "business" && "border border-amber-500/12 bg-black/45",
        variant === "host" && "border border-pu-magenta/18 bg-black/40",
        variant === "default" && "border border-pu-border bg-black/35"
      )}
    >
      <p
        className={cn(
          "text-[10px] font-bold uppercase tracking-wide",
          variant === "business" ? "text-zinc-500" : "text-white/50"
        )}
      >
        {label}
      </p>
      <p className="mt-1 text-lg font-extrabold text-white">{value}</p>
    </div>
  );
}
