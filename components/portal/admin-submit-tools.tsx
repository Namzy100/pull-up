"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { LayoutDashboard, Shield } from "lucide-react";

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
import { useAppStore } from "@/store/use-app-store";
import { cn } from "@/lib/utils";

function startOfLocalDayIso() {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d.toISOString();
}

export function AdminSubmitToolsCard() {
  const approvedTodayStore = useAppStore((s) => s.portalApprovedToday);
  const [stats, setStats] = useState<{
    pendingAccessHost: number;
    pendingAccessBusiness: number;
    pendingEvents: number;
    pendingDeals: number;
    approvedToday: number;
    rejectedToday: number;
  } | null>(null);

  const loadStats = useCallback(async () => {
    await Promise.resolve();
    if (!hasSupabaseEnv()) {
      setStats({
        pendingAccessHost: 0,
        pendingAccessBusiness: 0,
        pendingEvents: 0,
        pendingDeals: 0,
        approvedToday: approvedTodayStore,
        rejectedToday: 0,
      });
      return;
    }
    const supabase = createSupabaseBrowserClient();
    const since = startOfLocalDayIso();
    const [access, hostPend, bizPend, hostApp, hostRej, bizApp, bizRej] = await Promise.all([
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
      approvedToday: hostApp + bizApp,
      rejectedToday: hostRej + bizRej,
    });
  }, [approvedTodayStore]);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      await loadStats();
      if (cancelled) return;
    })();
    return () => {
      cancelled = true;
    };
  }, [loadStats]);

  const s = stats;
  const needsReview =
    (s?.pendingAccessHost ?? 0) +
    (s?.pendingAccessBusiness ?? 0) +
    (s?.pendingEvents ?? 0) +
    (s?.pendingDeals ?? 0);

  return (
    <div className="space-y-4">
      <AdminSurface className="p-5">
        <div className="flex items-start gap-3">
          <div className="flex size-11 shrink-0 items-center justify-center rounded-lg border border-zinc-700 bg-zinc-900">
            <Shield className="size-5 text-zinc-400" aria-hidden />
          </div>
          <div className="min-w-0 space-y-2">
            <AdminSectionLabel>Moderation workspace</AdminSectionLabel>
            <h2 className="text-lg font-semibold tracking-tight text-zinc-100">
              Trust &amp; safety control room
            </h2>
            <p className="text-[0.8125rem] leading-relaxed text-zinc-500">
              Keep the feed trusted. Review identity, safety, and content quality in Admin — this
              screen stays a fast link, not the full queue.
            </p>
            <Button
              asChild
              className="mt-2 h-10 w-full rounded-lg border border-zinc-600 bg-zinc-900 font-semibold text-zinc-100 hover:bg-zinc-800 sm:w-auto"
            >
              <Link href="/admin">
                <LayoutDashboard className="mr-2 size-4" aria-hidden />
                Open Admin
              </Link>
            </Button>
          </div>
        </div>
      </AdminSurface>

      {s ? (
        <AdminSurface className="p-4">
          <div className="mb-3 flex flex-wrap items-end justify-between gap-2">
            <AdminSectionLabel>Queue snapshot</AdminSectionLabel>
            <span
              className={cn(
                "rounded-md px-2 py-1 text-[10px] font-semibold uppercase tracking-wide",
                needsReview > 0
                  ? "border border-amber-500/35 bg-amber-500/10 text-amber-200"
                  : "border border-zinc-700 bg-zinc-900 text-zinc-500"
              )}
            >
              {needsReview > 0 ? `${needsReview} need review` : "Queue clear"}
            </span>
          </div>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            <MiniStat label="Host access" value={s.pendingAccessHost} />
            <MiniStat label="Business access" value={s.pendingAccessBusiness} />
            <MiniStat label="Events" value={s.pendingEvents} emphasize />
            <MiniStat label="Deals" value={s.pendingDeals} emphasize />
            <MiniStat label="Approved today" value={s.approvedToday} tone="live" />
            <MiniStat label="Rejected today" value={s.rejectedToday} tone="urgent" />
          </div>
        </AdminSurface>
      ) : (
        <p className="text-center text-xs text-zinc-500">Loading queue snapshot…</p>
      )}
    </div>
  );
}

function MiniStat({
  label,
  value,
  tone,
  emphasize,
}: {
  label: string;
  value: number;
  tone?: "live" | "urgent";
  emphasize?: boolean;
}) {
  return (
    <div
      className={cn(
        "rounded-lg border px-3 py-2.5",
        emphasize && "border-amber-500/25 bg-amber-500/[0.06]",
        !emphasize && !tone && "border-zinc-800 bg-zinc-950/80",
        tone === "live" && "border-pu-live/30 bg-pu-live/[0.06]",
        tone === "urgent" && "border-pu-urgent/30 bg-pu-urgent/[0.06]"
      )}
    >
      <p className="text-[9px] font-semibold uppercase tracking-wide text-zinc-500">{label}</p>
      <p className="mt-1 font-mono text-xl font-semibold tabular-nums text-zinc-100">{value}</p>
    </div>
  );
}
