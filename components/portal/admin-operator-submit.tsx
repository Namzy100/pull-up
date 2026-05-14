"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { LayoutDashboard, Radio, Shield } from "lucide-react";

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

function startOfLocalDayIso() {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d.toISOString();
}

export function AdminOperatorSubmitPage() {
  const [stats, setStats] = useState<{
    pendingAccessHost: number;
    pendingAccessBusiness: number;
    pendingEvents: number;
    pendingDeals: number;
    approvedToday: number;
    rejectedToday: number;
  } | null>(null);

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

  return (
    <div className="pu-screen pb-6 pt-8 sm:pt-10">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-[240px] bg-[radial-gradient(ellipse_78%_45%_at_50%_-8%,oklch(0.35_0.04_250/0.35),transparent_60%)]" />

      <div className="relative mx-auto w-full max-w-xl space-y-5 px-4">
        <header className="space-y-2">
          <AdminSectionLabel>Platform operations</AdminSectionLabel>
          <h1 className="text-[1.65rem] font-semibold tracking-tight text-white sm:text-[1.85rem]">
            Publishing oversight
          </h1>
          <p className="max-w-[24rem] text-[0.8125rem] leading-relaxed text-zinc-500">
            Submit is for hosts and businesses. As admin, use the moderation workspace — this view
            is a quick queue snapshot only.
          </p>
        </header>

        <AdminSurface className="p-4">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <AdminSectionLabel>Moderation</AdminSectionLabel>
              <p className="mt-1 text-sm font-medium text-zinc-300">Open Admin for approvals and rejections.</p>
            </div>
            <Button
              asChild
              className="h-10 rounded-lg border-zinc-600 bg-zinc-900 font-semibold text-zinc-100 hover:bg-zinc-800"
            >
              <Link href="/admin">
                <LayoutDashboard className="mr-2 size-4" aria-hidden />
                Open Admin
              </Link>
            </Button>
          </div>
        </AdminSurface>

        {s ? (
          <AdminSurface className="p-4">
            <AdminSectionLabel>Queue summary</AdminSectionLabel>
            <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3">
              <Mini label="Host access" value={s.pendingAccessHost} />
              <Mini label="Business access" value={s.pendingAccessBusiness} />
              <Mini label="Pending events" value={s.pendingEvents} />
              <Mini label="Pending deals" value={s.pendingDeals} />
              <Mini label="Approved today" value={s.approvedToday} tone="ok" />
              <Mini label="Rejected today" value={s.rejectedToday} tone="no" />
            </div>
          </AdminSurface>
        ) : (
          <p className="text-center text-xs text-zinc-500">Loading queue snapshot…</p>
        )}

        <AdminSurface className="p-4">
          <AdminSectionLabel>Recent approvals</AdminSectionLabel>
          <p className="mt-2 text-sm text-zinc-400">
            Today:{" "}
            <span className="font-semibold text-emerald-300/90">
              {s ? `${s.approvedToday} approved` : "—"}
            </span>{" "}
            · Rejected:{" "}
            <span className="font-semibold text-red-300/90">{s ? `${s.rejectedToday}` : "—"}</span>
          </p>
          <p className="mt-2 text-xs text-zinc-600">
            Full history and notes live in Admin. Use Refresh there after actions.
          </p>
        </AdminSurface>

        <AdminSurface className="border-dashed border-zinc-700 p-4">
          <AdminSectionLabel>Preview posting surfaces</AdminSectionLabel>
          <p className="mt-1 text-[0.8125rem] text-zinc-500">
            Inspect merchant or host dashboards as read-only context — not your live operator role.
          </p>
          <div className="mt-3 flex flex-col gap-2 sm:flex-row">
            <Button
              asChild
              variant="outline"
              className="h-9 rounded-lg border-zinc-600 text-xs font-semibold text-zinc-300"
            >
              <Link href="/submit?previewAs=business">Preview business</Link>
            </Button>
            <Button
              asChild
              variant="outline"
              className="h-9 rounded-lg border-zinc-600 text-xs font-semibold text-zinc-300"
            >
              <Link href="/submit?previewAs=host">Preview host</Link>
            </Button>
          </div>
        </AdminSurface>

        <p className="flex items-center gap-2 text-center text-[11px] font-medium text-zinc-600">
          <Shield className="size-3.5 shrink-0" aria-hidden />
          Consumer discovery stays on Tonight — use Admin nav when moderating.
        </p>
        <p className="flex items-center justify-center gap-2 text-[11px] text-zinc-600">
          <Radio className="size-3.5" aria-hidden />
          <Link href="/admin" className="text-zinc-400 underline-offset-2 hover:text-zinc-200 hover:underline">
            Back to Admin
          </Link>
        </p>
      </div>
    </div>
  );
}

function Mini({
  label,
  value,
  tone,
}: {
  label: string;
  value: number;
  tone?: "ok" | "no";
}) {
  return (
    <div
      className={
        tone === "ok"
          ? "rounded-lg border border-emerald-500/20 bg-emerald-950/20 px-3 py-2"
          : tone === "no"
            ? "rounded-lg border border-red-500/20 bg-red-950/15 px-3 py-2"
            : "rounded-lg border border-zinc-800 bg-zinc-950/80 px-3 py-2"
      }
    >
      <p className="text-[9px] font-semibold uppercase tracking-wide text-zinc-500">{label}</p>
      <p className="mt-0.5 font-mono text-lg font-semibold tabular-nums text-zinc-100">{value}</p>
    </div>
  );
}
