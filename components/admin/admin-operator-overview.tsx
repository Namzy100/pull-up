"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import {
  Activity,
  Building2,
  Flag,
  LayoutDashboard,
  Shield,
  Sparkles,
  Users,
} from "lucide-react";

import { AdminSectionLabel, AdminSurface } from "@/components/role-surfaces/role-surfaces";
import { Button } from "@/components/ui/button";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { hasSupabaseEnv } from "@/lib/supabase/env";
import {
  countSubmissionReviewsSince,
  listBusinessSubmissions,
  listHostSubmissions,
  listPendingAccessRequests,
} from "@/lib/supabase/repositories";
import { cn } from "@/lib/utils";

function startOfLocalDayIso() {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d.toISOString();
}

type QueueStats = {
  pendingAccessHost: number;
  pendingAccessBusiness: number;
  pendingEvents: number;
  pendingDeals: number;
  approvedToday: number;
  rejectedToday: number;
};

export function AdminOperatorOverview() {
  const [stats, setStats] = useState<QueueStats | null>(null);

  const load = useCallback(async () => {
    if (!hasSupabaseEnv()) {
      setStats({
        pendingAccessHost: 0,
        pendingAccessBusiness: 0,
        pendingEvents: 0,
        pendingDeals: 0,
        approvedToday: 0,
        rejectedToday: 0,
      });
      return;
    }
    const supabase = createSupabaseBrowserClient();
    const since = startOfLocalDayIso();
    const [access, hostPend, bizPend, ha, hr, ba, br] = await Promise.all([
      listPendingAccessRequests(supabase),
      listHostSubmissions(supabase, true),
      listBusinessSubmissions(supabase, true),
      countSubmissionReviewsSince(supabase, "host_submissions", "approved", since),
      countSubmissionReviewsSince(supabase, "host_submissions", "rejected", since),
      countSubmissionReviewsSince(supabase, "business_submissions", "approved", since),
      countSubmissionReviewsSince(supabase, "business_submissions", "rejected", since),
    ]);
    setStats({
      pendingAccessHost: access.filter((a) => a.requested_role === "host").length,
      pendingAccessBusiness: access.filter((a) => a.requested_role === "business").length,
      pendingEvents: hostPend.length,
      pendingDeals: bizPend.length,
      approvedToday: ha + ba,
      rejectedToday: hr + br,
    });
  }, []);

  useEffect(() => {
    const t = window.setTimeout(() => {
      void load();
    }, 0);
    return () => window.clearTimeout(t);
  }, [load]);

  const s = stats;
  const pendingTotal = s
    ? s.pendingAccessHost + s.pendingAccessBusiness + s.pendingEvents + s.pendingDeals
    : 0;
  const reviewedToday = s ? s.approvedToday + s.rejectedToday : 0;
  const approvalRate =
    s && reviewedToday > 0 ? `${Math.round((s.approvedToday / reviewedToday) * 100)}%` : "—";

  return (
    <div className="mx-auto w-full max-w-2xl space-y-4 px-4 pb-2 pt-6 sm:pt-8">
      <header className="space-y-2 border-b border-zinc-800/80 pb-4">
        <div className="flex flex-wrap items-center gap-2">
          <span className="rounded-md border border-amber-500/30 bg-amber-500/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-amber-200">
            Admin
          </span>
          <AdminSectionLabel>Platform operations</AdminSectionLabel>
        </div>
        <h1 className="text-xl font-semibold tracking-tight text-zinc-100 sm:text-2xl">
          Moderation cockpit
        </h1>
        <p className="max-w-xl text-[0.8125rem] leading-relaxed text-zinc-500">
          Keep the feed trusted. Review identity, safety, and content quality — queues below update
          on refresh.
        </p>
        <div className="flex flex-wrap gap-2 pt-1">
          <span className="rounded-md border border-zinc-700 bg-zinc-900 px-2 py-1 text-[11px] font-medium text-zinc-400">
            Status:{" "}
            <span className="text-zinc-200">{pendingTotal > 0 ? "Action needed" : "Queues clear"}</span>
          </span>
        </div>
      </header>

      <AdminSurface className="p-4">
        <AdminSectionLabel>Primary actions</AdminSectionLabel>
        <div className="mt-3 grid gap-2 sm:grid-cols-2">
          <Button
            asChild
            className="h-10 justify-start rounded-lg border-zinc-700 bg-zinc-900 font-semibold text-zinc-100 hover:bg-zinc-800"
          >
            <Link href="/admin">
              <LayoutDashboard className="mr-2 size-4 shrink-0" aria-hidden />
              Open moderation
            </Link>
          </Button>
          <Button
            asChild
            variant="outline"
            className="h-10 justify-start rounded-lg border-zinc-700 text-zinc-300 hover:bg-zinc-900"
          >
            <Link href="/admin/users">
              <Users className="mr-2 size-4 shrink-0" aria-hidden />
              User directory
            </Link>
          </Button>
          <Button
            asChild
            variant="outline"
            className="h-10 justify-start rounded-lg border-zinc-700 text-zinc-300 hover:bg-zinc-900"
          >
            <Link href="/admin/deals">
              <Building2 className="mr-2 size-4 shrink-0" aria-hidden />
              Review businesses &amp; deals
            </Link>
          </Button>
          <Button
            asChild
            variant="outline"
            className="h-10 justify-start rounded-lg border-zinc-700 text-zinc-300 hover:bg-zinc-900"
          >
            <Link href="/admin/events">
              <Shield className="mr-2 size-4 shrink-0" aria-hidden />
              Review hosts &amp; events
            </Link>
          </Button>
          <Button
            asChild
            variant="outline"
            className="h-10 justify-start rounded-lg border-zinc-700 text-zinc-300 hover:bg-zinc-900"
          >
            <Link href="/admin/tools">
              <Flag className="mr-2 size-4 shrink-0" aria-hidden />
              Reports &amp; flags
            </Link>
          </Button>
        </div>
      </AdminSurface>

      <AdminSurface className="p-4">
        <AdminSectionLabel>Queue strip</AdminSectionLabel>
        {s ? (
          <dl className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3">
            <QueueItem label="Pending businesses" value={s.pendingAccessBusiness} href="/admin?tab=access" />
            <QueueItem label="Pending hosts" value={s.pendingAccessHost} href="/admin?tab=access" />
            <QueueItem label="Pending deals" value={s.pendingDeals} href="/admin/deals" />
            <QueueItem label="Pending events" value={s.pendingEvents} href="/admin/events" />
            <QueueItem label="Flagged content" value="—" href="/admin/tools" muted />
            <QueueItem label="Reports" value="—" href="/admin/tools" muted />
          </dl>
        ) : (
          <p className="mt-2 text-xs text-zinc-500">Loading queues…</p>
        )}
      </AdminSurface>

      <AdminSurface className="p-4">
        <AdminSectionLabel>System health</AdminSectionLabel>
        <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3">
          <HealthCell label="Active events (est.)" value="Live feed" hint="Tonight + map" />
          <HealthCell label="Active deals" value="Deals hub" hint="Published rows" />
          <HealthCell label="Pending reviews" value={s ? String(pendingTotal) : "—"} hint="All queues" />
          <HealthCell label="Approval rate (today)" value={approvalRate} hint="Approved ÷ decided" />
          <HealthCell
            label="Moderation activity"
            value={s ? `${s.approvedToday} ok · ${s.rejectedToday} no` : "—"}
            hint="Since local midnight"
          />
        </div>
      </AdminSurface>

      <AdminSurface className="p-4">
        <AdminSectionLabel>Tools</AdminSectionLabel>
        <ul className="mt-2 space-y-1.5 text-[0.8125rem] text-zinc-400">
          <li>
            <Link href="/admin" className="text-zinc-300 underline-offset-2 hover:text-white hover:underline">
              Moderation workspace
            </Link>
          </li>
          <li>
            <Link
              href="/admin/users"
              className="text-zinc-300 underline-offset-2 hover:text-white hover:underline"
            >
              User directory
            </Link>
          </li>
          <li>
            <Link
              href="/admin/events"
              className="text-zinc-300 underline-offset-2 hover:text-white hover:underline"
            >
              Event oversight
            </Link>
          </li>
          <li>
            <Link
              href="/admin/deals"
              className="text-zinc-300 underline-offset-2 hover:text-white hover:underline"
            >
              Deal &amp; venue oversight
            </Link>
          </li>
          <li className="text-zinc-600">Audit logs — coming soon</li>
          <li className="text-zinc-600">Analytics — coming soon</li>
        </ul>
      </AdminSurface>

      <AdminSurface className="border-dashed border-zinc-700 p-4">
        <AdminSectionLabel>Consumer preview</AdminSectionLabel>
        <p className="mt-1 text-[0.8125rem] text-zinc-500">
          Inspect the student app, merchant hub, or host dashboard. Return via Admin nav or Open
          moderation.
        </p>
        <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:flex-wrap">
          <Button
            asChild
            variant="outline"
            className="h-9 rounded-lg border-zinc-600 text-xs font-semibold text-zinc-300"
          >
            <Link href="/profile?preview=user">
              <Sparkles className="mr-1.5 size-3.5" aria-hidden />
              Preview user mode
            </Link>
          </Button>
          <Button
            asChild
            variant="outline"
            className="h-9 rounded-lg border-zinc-600 text-xs font-semibold text-zinc-300"
          >
            <Link href="/submit?previewAs=business">
              <Activity className="mr-1.5 size-3.5" aria-hidden />
              Preview business mode
            </Link>
          </Button>
          <Button
            asChild
            variant="outline"
            className="h-9 rounded-lg border-zinc-600 text-xs font-semibold text-zinc-300"
          >
            <Link href="/submit?previewAs=host">
              <Activity className="mr-1.5 size-3.5" aria-hidden />
              Preview host mode
            </Link>
          </Button>
        </div>
      </AdminSurface>
    </div>
  );
}

function QueueItem({
  label,
  value,
  href,
  muted,
}: {
  label: string;
  value: number | string;
  href: string;
  muted?: boolean;
}) {
  return (
    <Link
      href={href}
      className="rounded-lg border border-zinc-800 bg-zinc-900/60 px-3 py-2 transition hover:border-zinc-600"
    >
      <dt className="text-[9px] font-semibold uppercase tracking-wide text-zinc-500">{label}</dt>
      <dd
        className={cn(
          "mt-0.5 font-mono text-lg font-semibold tabular-nums",
          muted ? "text-zinc-600" : "text-zinc-100"
        )}
      >
        {value}
      </dd>
    </Link>
  );
}

function HealthCell({ label, value, hint }: { label: string; value: string; hint: string }) {
  return (
    <div className="rounded-lg border border-zinc-800 bg-zinc-950/80 px-3 py-2">
      <p className="text-[9px] font-semibold uppercase tracking-wide text-zinc-500">{label}</p>
      <p className="mt-1 text-sm font-semibold text-zinc-200">{value}</p>
      <p className="text-[10px] text-zinc-600">{hint}</p>
    </div>
  );
}
