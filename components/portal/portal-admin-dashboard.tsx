"use client";

import { useEffect, useState } from "react";
import { Check, Gavel, Shield, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { moderateAccessRequestAndProfile } from "@/lib/supabase/client-persistence";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { hasSupabaseEnv } from "@/lib/supabase/env";
import { listPendingAccessRequests } from "@/lib/supabase/repositories";
import { useAppStore } from "@/store/use-app-store";
import { cn } from "@/lib/utils";

function formatWhen(iso: string) {
  try {
    return new Date(iso).toLocaleString(undefined, {
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
  } catch {
    return iso;
  }
}

export function PortalAdminDashboard() {
  const pendingHost = useAppStore((s) => s.pendingHostSubmissions);
  const pendingBiz = useAppStore((s) => s.pendingBusinessSubmissions);
  const approvedToday = useAppStore((s) => s.portalApprovedToday);
  const flagged = useAppStore((s) => s.portalFlaggedUpdates);
  const approveHost = useAppStore((s) => s.approvePendingHostEvent);
  const rejectHost = useAppStore((s) => s.rejectPendingHostEvent);
  const approveBiz = useAppStore((s) => s.approvePendingBusinessDeal);
  const rejectBiz = useAppStore((s) => s.rejectPendingBusinessDeal);
  const [accessRequests, setAccessRequests] = useState<
    {
      id: string;
      user_id: string;
      requested_role: "host" | "business" | "admin";
      created_at: string;
      metadata: Record<string, unknown> | null;
    }[]
  >([]);

  useEffect(() => {
    if (!hasSupabaseEnv()) return;
    const supabase = createSupabaseBrowserClient();
    void listPendingAccessRequests(supabase).then((rows) =>
      setAccessRequests(
        rows.map((row) => ({
          id: row.id,
          user_id: row.user_id,
          requested_role: row.requested_role,
          created_at: row.created_at,
          metadata:
            row.metadata && typeof row.metadata === "object"
              ? (row.metadata as Record<string, unknown>)
              : null,
        }))
      )
    );
  }, []);

  async function approveAccessRequest(
    req: (typeof accessRequests)[number],
    approve: boolean
  ) {
    const status = approve ? "approved" : "rejected";
    await moderateAccessRequestAndProfile(
      req.id,
      req.user_id,
      req.requested_role === "admin" ? "host" : req.requested_role,
      status,
      approve ? "Approved from admin queue" : "Rejected from admin queue"
    );
    setAccessRequests((prev) => prev.filter((x) => x.id !== req.id));
  }

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-pu-border bg-gradient-to-br from-pu-surface-deep/95 to-black p-4">
        <div className="flex items-start gap-2">
          <Shield className="mt-0.5 size-5 shrink-0 text-pu-magenta" aria-hidden />
          <div>
            <h2 className="font-heading text-lg font-extrabold tracking-tight text-white">
              Moderation
            </h2>
            <p className="pu-meta mt-1">
              Admin keeps the feed clean. Approve/reject persists to Supabase when configured.
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        <StatCard label="Pending events" value={pendingHost.length} accent="magenta" />
        <StatCard label="Pending deals" value={pendingBiz.length} accent="amber" />
        <StatCard label="Approved today" value={approvedToday} accent="live" />
        <StatCard label="Flagged updates" value={flagged} accent="urgent" />
      </div>

      <section aria-labelledby="admin-events-heading" className="space-y-3">
        <div className="flex items-center gap-2">
          <Gavel className="size-4 text-pu-amber" aria-hidden />
          <h3
            id="admin-events-heading"
            className="text-sm font-extrabold uppercase tracking-[0.12em] text-white/75"
          >
            Pending events
          </h3>
        </div>
        {pendingHost.length === 0 ? (
          <EmptyRow>No event submissions in queue.</EmptyRow>
        ) : (
          <ul className="flex flex-col gap-3">
            {pendingHost.map((row) => (
              <li
                key={row.id}
                className="rounded-2xl border border-pu-border bg-black/40 p-4 ring-1 ring-white/[0.04]"
              >
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div className="min-w-0 space-y-1">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-white/45">
                      {formatWhen(row.submittedAt)} · {row.categoryLabel}
                    </p>
                    <p className="font-heading text-base font-extrabold text-white">
                      {row.title}
                    </p>
                    <p className="text-[0.8125rem] font-medium text-white/70">
                      {row.venue} · {row.area}
                    </p>
                    <p className="text-[0.8125rem] text-white/55">
                      {row.date} · {row.startTime}–{row.endTime} · {row.entryType}
                      {row.coverDollars != null ? ` · $${row.coverDollars}` : ""}
                    </p>
                  </div>
                  <div className="flex shrink-0 gap-2">
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      className="border-pu-live/50 font-bold text-pu-live hover:bg-pu-live/10"
                      onClick={() => void approveHost(row.id, "Approved in portal admin queue")}
                    >
                      <Check className="mr-1 size-3.5" aria-hidden />
                      Approve
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      className="border-pu-urgent/45 font-bold text-pu-urgent-glow hover:bg-pu-urgent/10"
                      onClick={() => void rejectHost(row.id, "Rejected in portal admin queue")}
                    >
                      <X className="mr-1 size-3.5" aria-hidden />
                      Reject
                    </Button>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section aria-labelledby="admin-deals-heading" className="space-y-3">
        <div className="flex items-center gap-2">
          <Gavel className="size-4 text-pu-magenta" aria-hidden />
          <h3
            id="admin-deals-heading"
            className="text-sm font-extrabold uppercase tracking-[0.12em] text-white/75"
          >
            Pending deals
          </h3>
        </div>
        {pendingBiz.length === 0 ? (
          <EmptyRow>No deal submissions in queue.</EmptyRow>
        ) : (
          <ul className="flex flex-col gap-3">
            {pendingBiz.map((row) => (
              <li
                key={row.id}
                className="rounded-2xl border border-pu-border bg-black/40 p-4 ring-1 ring-white/[0.04]"
              >
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div className="min-w-0 space-y-1">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-white/45">
                      {formatWhen(row.submittedAt)} · {row.categoryLabel}
                    </p>
                    <p className="font-heading text-base font-extrabold text-white">
                      {row.dealTitle}
                    </p>
                    <p className="text-[0.8125rem] font-medium text-white/70">
                      {row.businessName} · {row.area}
                    </p>
                    <p className="text-[0.8125rem] text-white/55">
                      {row.validFrom} → {row.validUntil} · {row.perk}
                      {row.studentOnly ? " · Student-only" : ""}
                    </p>
                  </div>
                  <div className="flex shrink-0 gap-2">
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      className="border-pu-live/50 font-bold text-pu-live hover:bg-pu-live/10"
                      onClick={() =>
                        void approveBiz(row.id, "Approved in portal admin queue")
                      }
                    >
                      <Check className="mr-1 size-3.5" aria-hidden />
                      Approve
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      className="border-pu-urgent/45 font-bold text-pu-urgent-glow hover:bg-pu-urgent/10"
                      onClick={() =>
                        void rejectBiz(row.id, "Rejected in portal admin queue")
                      }
                    >
                      <X className="mr-1 size-3.5" aria-hidden />
                      Reject
                    </Button>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section aria-labelledby="admin-access-heading" className="space-y-3">
        <div className="flex items-center gap-2">
          <Gavel className="size-4 text-pu-amber" aria-hidden />
          <h3
            id="admin-access-heading"
            className="text-sm font-extrabold uppercase tracking-[0.12em] text-white/75"
          >
            Access requests (Supabase)
          </h3>
        </div>
        {accessRequests.length === 0 ? (
          <EmptyRow>No pending role requests.</EmptyRow>
        ) : (
          <ul className="flex flex-col gap-2">
            {accessRequests.map((row) => (
              <li
                key={row.id}
                className="rounded-xl border border-pu-border bg-black/35 px-3 py-2.5"
              >
                <p className="text-xs font-semibold text-white/70">
                  {row.requested_role} · {formatWhen(row.created_at)}
                </p>
                {row.metadata ? (
                  <p className="mt-1 text-[11px] text-white/55">
                    {JSON.stringify(row.metadata)}
                  </p>
                ) : null}
                <div className="mt-2 flex gap-2">
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    className="border-pu-live/50 font-bold text-pu-live hover:bg-pu-live/10"
                    onClick={() => void approveAccessRequest(row, true)}
                  >
                    <Check className="mr-1 size-3.5" aria-hidden />
                    Approve
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    className="border-pu-urgent/45 font-bold text-pu-urgent-glow hover:bg-pu-urgent/10"
                    onClick={() => void approveAccessRequest(row, false)}
                  >
                    <X className="mr-1 size-3.5" aria-hidden />
                    Reject
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

function StatCard({
  label,
  value,
  accent,
}: {
  label: string;
  value: number;
  accent: "magenta" | "amber" | "live" | "urgent";
}) {
  return (
    <div
      className={cn(
        "rounded-xl border border-pu-border bg-pu-surface-deep/80 px-3 py-3",
        accent === "magenta" && "shadow-[0_0_20px_-10px_oklch(0.7_0.29_328/0.25)]",
        accent === "amber" && "shadow-[0_0_18px_-10px_oklch(0.82_0.17_72/0.2)]",
        accent === "live" && "shadow-[0_0_18px_-10px_oklch(0.86_0.22_145/0.2)]",
        accent === "urgent" && "shadow-[0_0_18px_-10px_oklch(0.64_0.22_28/0.2)]"
      )}
    >
      <p className="text-[10px] font-bold uppercase tracking-wide text-white/50">
        {label}
      </p>
      <p className="mt-1 font-heading text-2xl font-extrabold tabular-nums text-white">
        {value}
      </p>
    </div>
  );
}

function EmptyRow({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-dashed border-pu-border bg-black/30 px-4 py-6 text-center text-sm font-medium text-white/50">
      {children}
    </div>
  );
}
