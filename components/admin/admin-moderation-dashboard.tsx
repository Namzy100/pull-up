"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Check, Gavel, RefreshCw, Shield, X } from "lucide-react";

import {
  parseBusinessAccessMetadata,
  parseHostAccessMetadata,
} from "@/lib/admin-access-metadata";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { moderateAccessRequestAndProfile } from "@/lib/supabase/client-persistence";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { hasSupabaseEnv } from "@/lib/supabase/env";
import { isBusinessPromoDealLike } from "@/lib/supabase/business-deal-payload";
import type { Database } from "@/lib/supabase/database.types";
import {
  countSubmissionReviewsSince,
  listBusinessSubmissions,
  listHostSubmissions,
  listPendingAccessRequests,
  listProfilesForAdmin,
} from "@/lib/supabase/repositories";
import {
  businessSubmissionRowToPending,
  hostSubmissionRowToPending,
} from "@/lib/supabase/submission-views";
import type {
  PendingBusinessDealSubmission,
  PendingHostEventSubmission,
} from "@/lib/portal-types";
import { AdminSectionLabel, AdminSurface } from "@/components/role-surfaces/role-surfaces";
import { useAppStore } from "@/store/use-app-store";
import { cn } from "@/lib/utils";

type AccessRow = Database["public"]["Tables"]["access_requests"]["Row"];
type HostRow = Database["public"]["Tables"]["host_submissions"]["Row"];
type BizRow = Database["public"]["Tables"]["business_submissions"]["Row"];
type ProfileRow = Database["public"]["Tables"]["profiles"]["Row"];

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

function startOfLocalDayIso() {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d.toISOString();
}

function statusBadge(status: string) {
  const s = status.toLowerCase();
  if (s === "pending")
    return (
      <Badge className="border border-pu-amber/40 bg-pu-amber/15 text-[10px] font-black uppercase tracking-wide text-pu-amber">
        Pending
      </Badge>
    );
  if (s === "approved")
    return (
      <Badge className="border border-pu-live/40 bg-pu-live/15 text-[10px] font-black uppercase tracking-wide text-pu-live">
        Approved
      </Badge>
    );
  if (s === "rejected")
    return (
      <Badge className="border border-pu-urgent/40 bg-pu-urgent/15 text-[10px] font-black uppercase tracking-wide text-pu-urgent-glow">
        Rejected
      </Badge>
    );
  return (
    <Badge variant="outline" className="text-[10px] font-bold uppercase text-white/70">
      {status}
    </Badge>
  );
}

function DisclosureRaw({ label, payload }: { label: string; payload: unknown }) {
  return (
    <details className="mt-3 rounded-lg border border-zinc-800 bg-zinc-900/60">
      <summary className="cursor-pointer px-3 py-2 text-[11px] font-semibold uppercase tracking-wide text-zinc-500">
        {label}
      </summary>
      <pre className="max-h-48 overflow-auto border-t border-zinc-800 p-3 font-mono text-[10px] leading-relaxed whitespace-pre-wrap break-all text-zinc-500">
        {JSON.stringify(payload, null, 2)}
      </pre>
    </details>
  );
}

type AdminTab = "access" | "events" | "deals" | "users";

type AdminModerationDashboardProps = {
  /** Used on /admin/events etc. when no ?tab= */
  defaultTab?: AdminTab;
  /** Lighter layout: skip hero + needs-review strip (sub-routes). */
  compact?: boolean;
  /** Home /admin: overview already shows queue counts. */
  omitStatsRow?: boolean;
};

export function AdminModerationDashboard({
  defaultTab = "access",
  compact = false,
  omitStatsRow = false,
}: AdminModerationDashboardProps = {}) {
  const storePendingHost = useAppStore((s) => s.pendingHostSubmissions);
  const storePendingBiz = useAppStore((s) => s.pendingBusinessSubmissions);
  const approveHost = useAppStore((s) => s.approvePendingHostEvent);
  const rejectHost = useAppStore((s) => s.rejectPendingHostEvent);
  const approveBiz = useAppStore((s) => s.approvePendingBusinessDeal);
  const rejectBiz = useAppStore((s) => s.rejectPendingBusinessDeal);

  const [accessRequests, setAccessRequests] = useState<AccessRow[]>([]);
  const [hostRows, setHostRows] = useState<HostRow[]>([]);
  const [bizRows, setBizRows] = useState<BizRow[]>([]);
  const [profiles, setProfiles] = useState<ProfileRow[]>([]);
  const [userFilter, setUserFilter] = useState<string>("all");
  const [actionError, setActionError] = useState<string | null>(null);
  const [actionMessage, setActionMessage] = useState<string | null>(null);
  const [stats, setStats] = useState({
    pendingAccessHost: 0,
    pendingAccessBusiness: 0,
    pendingEvents: 0,
    pendingDeals: 0,
    approvedToday: 0,
    rejectedToday: 0,
  });

  const [notesAccess, setNotesAccess] = useState<Record<string, string>>({});
  const [notesHost, setNotesHost] = useState<Record<string, string>>({});
  const [notesBiz, setNotesBiz] = useState<Record<string, string>>({});

  const searchParams = useSearchParams();
  const pathname = usePathname();
  const tabParam = searchParams.get("tab");
  const validTabs: AdminTab[] = ["access", "events", "deals", "users"];
  const fromUrl =
    !compact && tabParam && validTabs.includes(tabParam as AdminTab) ? (tabParam as AdminTab) : null;
  const initialTab: AdminTab = compact ? defaultTab : (fromUrl ?? defaultTab);

  const refresh = useCallback(async () => {
    await Promise.resolve();
    setActionError(null);
    setActionMessage(null);
    if (!hasSupabaseEnv()) {
      setHostRows([]);
      setBizRows([]);
      setAccessRequests([]);
      setProfiles([]);
      setStats((s) => ({
        ...s,
        pendingEvents: storePendingHost.length,
        pendingDeals: storePendingBiz.length,
      }));
      return;
    }
    const supabase = createSupabaseBrowserClient();
    const since = startOfLocalDayIso();
    const [access, hosts, deals, profs, ha, hr, ba, br] = await Promise.all([
      listPendingAccessRequests(supabase),
      listHostSubmissions(supabase, true),
      listBusinessSubmissions(supabase, true),
      listProfilesForAdmin(supabase),
      countSubmissionReviewsSince(supabase, "host_submissions", "approved", since),
      countSubmissionReviewsSince(supabase, "host_submissions", "rejected", since),
      countSubmissionReviewsSince(supabase, "business_submissions", "approved", since),
      countSubmissionReviewsSince(supabase, "business_submissions", "rejected", since),
    ]);
    setAccessRequests(access);
    setHostRows(hosts);
    setBizRows(deals);
    setProfiles(profs);
    setStats({
      pendingAccessHost: access.filter((a) => a.requested_role === "host").length,
      pendingAccessBusiness: access.filter((a) => a.requested_role === "business").length,
      pendingEvents: hosts.length,
      pendingDeals: deals.length,
      approvedToday: ha + ba,
      rejectedToday: hr + br,
    });
  }, [storePendingBiz.length, storePendingHost.length]);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      await refresh();
      if (cancelled) return;
    })();
    return () => {
      cancelled = true;
    };
  }, [refresh]);

  const pendingHostMapped = useMemo(
    () =>
      hostRows
        .map((r) => ({ row: r, pending: hostSubmissionRowToPending(r) }))
        .filter((x): x is { row: HostRow; pending: PendingHostEventSubmission } => x.pending != null),
    [hostRows]
  );

  const pendingBizMapped = useMemo(
    () =>
      bizRows
        .map((r) => ({ row: r, pending: businessSubmissionRowToPending(r) }))
        .filter(
          (x): x is { row: BizRow; pending: PendingBusinessDealSubmission } => x.pending != null
        ),
    [bizRows]
  );

  const filteredProfiles = useMemo(() => {
    const f = userFilter;
    return profiles.filter((p) => {
      if (f === "all") return true;
      if (f === "regular")
        return p.role === "regular_user" && p.requested_role === "none" && p.verification_status === "none";
      if (f === "pending_biz")
        return p.role === "regular_user" && p.requested_role === "business" && p.verification_status === "pending";
      if (f === "pending_host")
        return p.role === "regular_user" && p.requested_role === "host" && p.verification_status === "pending";
      if (f === "approved_biz") return p.role === "business" && p.verification_status === "approved";
      if (f === "approved_host") return p.role === "host" && p.verification_status === "approved";
      if (f === "admin") return p.role === "admin";
      return true;
    });
  }, [profiles, userFilter]);

  async function onApproveAccess(row: AccessRow, approve: boolean) {
    const rr = row.requested_role;
    if (rr !== "host" && rr !== "business") {
      setActionError("Unsupported access request.");
      return;
    }
    const note = (notesAccess[row.id] ?? "").trim() || (approve ? "Approved" : "Rejected");
    const res = await moderateAccessRequestAndProfile(row.id, row.user_id, rr, approve ? "approved" : "rejected", note);
    if (res.error) {
      setActionError(res.error.message);
      return;
    }
    setActionMessage(approve ? "Access approved." : "Access rejected.");
    setAccessRequests((prev) => prev.filter((x) => x.id !== row.id));
    void refresh();
  }

  const pendingTotal =
    stats.pendingAccessHost +
    stats.pendingAccessBusiness +
    stats.pendingEvents +
    stats.pendingDeals;

  return (
    <div className="pu-screen pb-10 pt-4 sm:pt-6">
      <div className="relative mx-auto w-full max-w-lg space-y-5 px-4 sm:max-w-2xl">
        {!compact ? (
          <header className="space-y-2">
            <AdminSectionLabel>Trust &amp; safety</AdminSectionLabel>
            <div className="flex flex-wrap items-end justify-between gap-3">
              <div>
                <h1 className="text-[1.75rem] font-semibold tracking-tight text-zinc-100 sm:text-[2rem]">
                  Moderation
                </h1>
                <p className="mt-1 max-w-md text-[0.8125rem] leading-relaxed text-zinc-500">
                  Review identity, safety, and content quality. Approve only if details are clear and
                  verifiable.
                </p>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => void refresh()}
                className="shrink-0 rounded-lg border-zinc-700 bg-zinc-950 font-semibold text-zinc-200 hover:bg-zinc-900"
              >
                <RefreshCw className="mr-1.5 size-3.5" aria-hidden />
                Refresh
              </Button>
            </div>
          </header>
        ) : (
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-zinc-800 pb-3">
            <AdminSectionLabel>Moderation</AdminSectionLabel>
            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => void refresh()}
                className="rounded-lg border-zinc-700 text-xs font-semibold text-zinc-300"
              >
                <RefreshCw className="mr-1.5 size-3.5" aria-hidden />
                Refresh
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                asChild
                className="rounded-lg border-zinc-700 text-xs font-semibold text-zinc-300"
              >
                <Link href="/admin">Overview</Link>
              </Button>
            </div>
          </div>
        )}

        {actionError ? (
          <p className="rounded-lg border border-red-500/35 bg-red-950/40 px-3 py-2 text-sm font-medium text-red-200">
            {actionError}
          </p>
        ) : null}
        {actionMessage ? (
          <p className="rounded-lg border border-emerald-500/30 bg-emerald-950/30 px-3 py-2 text-sm font-medium text-emerald-200">
            {actionMessage}
          </p>
        ) : null}

        {!omitStatsRow ? (
          <AdminSurface className="p-4">
            <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
              <AdminSectionLabel>Needs review</AdminSectionLabel>
              <span className="rounded-md border border-amber-500/30 bg-amber-500/10 px-2 py-1 text-xs font-semibold tabular-nums text-amber-200">
                {pendingTotal} open
              </span>
            </div>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-6">
              <StatTile label="Host access" value={stats.pendingAccessHost} />
              <StatTile label="Business access" value={stats.pendingAccessBusiness} />
              <StatTile label="Events queue" value={stats.pendingEvents} emphasize />
              <StatTile label="Deals queue" value={stats.pendingDeals} emphasize />
              <StatTile label="Approved today" value={stats.approvedToday} tone="live" />
              <StatTile label="Rejected today" value={stats.rejectedToday} tone="urgent" />
            </div>
          </AdminSurface>
        ) : null}

        <Tabs key={`${pathname}-${initialTab}`} defaultValue={initialTab} className="w-full">
          <TabsList className="flex h-auto w-full flex-wrap justify-start gap-1 rounded-lg border border-zinc-800 bg-zinc-950/90 p-1">
            <TabsTrigger
              value="access"
              className="rounded-md px-3 py-2 text-xs font-semibold uppercase tracking-wide text-zinc-500 data-[state=active]:bg-zinc-800 data-[state=active]:text-zinc-100"
            >
              Access
            </TabsTrigger>
            <TabsTrigger
              value="events"
              className="rounded-md px-3 py-2 text-xs font-semibold uppercase tracking-wide text-zinc-500 data-[state=active]:bg-zinc-800 data-[state=active]:text-zinc-100"
            >
              Events
            </TabsTrigger>
            <TabsTrigger
              value="deals"
              className="rounded-md px-3 py-2 text-xs font-semibold uppercase tracking-wide text-zinc-500 data-[state=active]:bg-zinc-800 data-[state=active]:text-zinc-100"
            >
              Deals
            </TabsTrigger>
            <TabsTrigger
              value="users"
              className="rounded-md px-3 py-2 text-xs font-semibold uppercase tracking-wide text-zinc-500 data-[state=active]:bg-zinc-800 data-[state=active]:text-zinc-100"
            >
              Users
            </TabsTrigger>
          </TabsList>

          <TabsContent value="access" className="mt-4 space-y-3 outline-none">
            <SectionHead icon={<Shield className="size-4" />} title="Access requests" />
            {!hasSupabaseEnv() ? (
              <EmptyPanel>Connect Supabase to load access requests.</EmptyPanel>
            ) : accessRequests.length === 0 ? (
              <EmptyPanel>No pending access requests.</EmptyPanel>
            ) : (
              <ul className="flex flex-col gap-4">
                {accessRequests.map((row) => (
                  <AccessRequestCard
                    key={row.id}
                    row={row}
                    note={notesAccess[row.id] ?? ""}
                    onNoteChange={(v) => setNotesAccess((m) => ({ ...m, [row.id]: v }))}
                    onApprove={() => void onApproveAccess(row, true)}
                    onReject={() => void onApproveAccess(row, false)}
                  />
                ))}
              </ul>
            )}
          </TabsContent>

          <TabsContent value="events" className="mt-4 space-y-3 outline-none">
            <SectionHead icon={<Gavel className="size-4" />} title="Event submissions" />
            {!hasSupabaseEnv() ? (
              <EmptyPanel>Use mock queue from the store in dev without Supabase.</EmptyPanel>
            ) : pendingHostMapped.length === 0 ? (
              <EmptyPanel>No pending event submissions.</EmptyPanel>
            ) : (
              <ul className="flex flex-col gap-4">
                {pendingHostMapped.map(({ row, pending }) => (
                  <HostEventModerationCard
                    key={row.id}
                    row={row}
                    pending={pending}
                    note={notesHost[pending.id] ?? ""}
                    onNoteChange={(v) => setNotesHost((m) => ({ ...m, [pending.id]: v }))}
                    onApprove={async () => {
                      setActionError(null);
                      const n = (notesHost[pending.id] ?? "").trim() || "Approved";
                      const res = await approveHost(pending.id, n);
                      if (!res.ok) setActionError(res.error);
                      else {
                        setActionMessage("Event published.");
                        void refresh();
                      }
                    }}
                    onReject={async () => {
                      setActionError(null);
                      const n = (notesHost[pending.id] ?? "").trim() || "Rejected";
                      const res = await rejectHost(pending.id, n);
                      if (!res.ok) setActionError(res.error);
                      else {
                        setActionMessage("Submission rejected.");
                        void refresh();
                      }
                    }}
                  />
                ))}
              </ul>
            )}
          </TabsContent>

          <TabsContent value="deals" className="mt-4 space-y-3 outline-none">
            <SectionHead icon={<Gavel className="size-4" />} title="Deal submissions" />
            {!hasSupabaseEnv() ? (
              <EmptyPanel>Use mock queue without Supabase.</EmptyPanel>
            ) : pendingBizMapped.length === 0 ? (
              <EmptyPanel>No pending deal submissions.</EmptyPanel>
            ) : (
              <ul className="flex flex-col gap-4">
                {pendingBizMapped.map(({ row, pending }) => (
                  <DealModerationCard
                    key={row.id}
                    row={row}
                    pending={pending}
                    note={notesBiz[pending.id] ?? ""}
                    onNoteChange={(v) => setNotesBiz((m) => ({ ...m, [pending.id]: v }))}
                    onApprove={async () => {
                      setActionError(null);
                      const n = (notesBiz[pending.id] ?? "").trim() || "Approved";
                      const res = await approveBiz(pending.id, n);
                      if (!res.ok) setActionError(res.error);
                      else {
                        setActionMessage("Deal published.");
                        void refresh();
                      }
                    }}
                    onReject={async () => {
                      setActionError(null);
                      const n = (notesBiz[pending.id] ?? "").trim() || "Rejected";
                      const res = await rejectBiz(pending.id, n);
                      if (!res.ok) setActionError(res.error);
                      else {
                        setActionMessage("Submission rejected.");
                        void refresh();
                      }
                    }}
                  />
                ))}
              </ul>
            )}
          </TabsContent>

          <TabsContent value="users" className="mt-4 space-y-3 outline-none">
            <SectionHead icon={<Shield className="size-4" />} title="Users" />
            <div className="flex flex-wrap gap-2">
              {(
                [
                  ["all", "All"],
                  ["regular", "Regular users"],
                  ["pending_host", "Pending hosts"],
                  ["pending_biz", "Pending businesses"],
                  ["approved_host", "Approved hosts"],
                  ["approved_biz", "Approved businesses"],
                  ["admin", "Admins"],
                ] as const
              ).map(([id, label]) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => setUserFilter(id)}
                  className={cn(
                    "rounded-md border px-3 py-1.5 text-[10px] font-semibold uppercase tracking-wide",
                    userFilter === id
                      ? "border-zinc-600 bg-zinc-800 text-zinc-100"
                      : "border-zinc-800 bg-zinc-950 text-zinc-500 hover:text-zinc-300"
                  )}
                >
                  {label}
                </button>
              ))}
            </div>
            {!hasSupabaseEnv() ? (
              <EmptyPanel>Supabase required for user directory.</EmptyPanel>
            ) : (
              <ul className="flex flex-col gap-2">
                {filteredProfiles.map((p) => (
                  <li
                    key={p.id}
                    className="rounded-lg border border-zinc-800 bg-zinc-950/90 p-4"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <div className="min-w-0 space-y-1">
                        <p className="text-base font-semibold tracking-tight text-zinc-100">
                          {p.full_name?.trim() || p.username}
                          <span className="ml-2 text-xs font-medium text-zinc-500">@{p.username}</span>
                        </p>
                        <p className="text-xs text-zinc-500">
                          {(p.organization_name || p.business_name || "—") + " · " + (p.campus ?? "—")}
                        </p>
                        <div className="flex flex-wrap gap-2 pt-1">
                          <span className="rounded-md border border-zinc-700 bg-zinc-900 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-zinc-400">
                            role: {p.role}
                          </span>
                          <span className="rounded-md border border-zinc-700 bg-zinc-900 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-zinc-400">
                            requested: {p.requested_role}
                          </span>
                          <span className="rounded-md border border-zinc-700 bg-zinc-900 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-zinc-400">
                            {p.verification_status}
                          </span>
                        </div>
                        <p className="text-[10px] text-zinc-600">{formatWhen(p.created_at)}</p>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

function StatTile({
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
        emphasize && !tone && "border-amber-500/25 bg-amber-500/[0.05]",
        !emphasize && !tone && "border-zinc-800 bg-zinc-950/80",
        tone === "live" && "border-emerald-500/25 bg-emerald-950/25",
        tone === "urgent" && "border-red-500/25 bg-red-950/20"
      )}
    >
      <p className="text-[9px] font-semibold uppercase tracking-wide text-zinc-500">{label}</p>
      <p className="mt-1 font-mono text-xl font-semibold tabular-nums text-zinc-100">{value}</p>
    </div>
  );
}

function SectionHead({ icon, title }: { icon: React.ReactNode; title: string }) {
  return (
    <div className="flex items-center gap-2 border-b border-zinc-800/80 pb-2">
      <span className="text-zinc-500">{icon}</span>
      <h2 className="text-xs font-semibold uppercase tracking-[0.12em] text-zinc-400">{title}</h2>
    </div>
  );
}

function EmptyPanel({ children }: { children: React.ReactNode }) {
  return (
    <AdminSurface className="border border-dashed border-zinc-700 px-4 py-10 text-center text-sm font-medium text-zinc-500">
      {children}
    </AdminSurface>
  );
}

function AccessRequestCard({
  row,
  note,
  onNoteChange,
  onApprove,
  onReject,
}: {
  row: AccessRow;
  note: string;
  onNoteChange: (v: string) => void;
  onApprove: () => void;
  onReject: () => void;
}) {
  const meta =
    row.metadata && typeof row.metadata === "object" && !Array.isArray(row.metadata)
      ? (row.metadata as Record<string, unknown>)
      : null;
  const isBiz = row.requested_role === "business";
  const biz = isBiz ? parseBusinessAccessMetadata(meta) : null;
  const host = !isBiz ? parseHostAccessMetadata(meta) : null;

  return (
    <li className="rounded-lg border border-zinc-800 bg-zinc-950/95 p-4">
      <div className="flex flex-wrap items-start justify-between gap-2 border-b border-zinc-800/80 pb-3">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-wide text-zinc-500">Access request</p>
          <p className="mt-1 text-lg font-semibold tracking-tight text-zinc-100">
            {isBiz ? biz?.businessName || "Business" : host?.organizationName || "Organization"}
          </p>
        </div>
        <div className="flex flex-col items-end gap-1">
          {statusBadge(row.status)}
          <span className="text-[10px] font-semibold uppercase tracking-wide text-amber-200/80">
            {row.requested_role}
          </span>
        </div>
      </div>

      <dl className="mt-3 grid gap-2 text-sm">
        {isBiz && biz ? (
          <>
            <Field k="Business type" v={biz.businessType} />
            <Field k="Contact" v={biz.contactPerson} />
            <Field k="Reach" v={biz.contactChannel} />
            <Field k="Web / IG" v={biz.websiteOrSocial || "—"} />
            <Field k="Area" v={biz.area || "—"} />
            <Field k="Explanation" v={biz.explanation || "—"} />
          </>
        ) : host ? (
          <>
            <Field k="Org type" v={(host.organizationType || "—").replace(/_/g, " ")} />
            <Field k="Contact" v={host.contactPerson} />
            <Field k="Reach" v={host.contactChannel} />
            <Field k="Social / proof" v={host.socialOrProof || "—"} />
            <Field k="Campus" v={host.campus || "—"} />
            <Field k="Explanation" v={host.explanation || "—"} />
          </>
        ) : (
          <p className="text-xs text-zinc-500">No structured metadata on file.</p>
        )}
        <Field k="Submitted" v={formatWhen(row.created_at)} />
      </dl>

      <div className="mt-3 space-y-2">
        <Label className="text-[10px] font-semibold uppercase tracking-wide text-zinc-500">
          Verification note
        </Label>
        <Textarea
          value={note}
          onChange={(e) => onNoteChange(e.target.value)}
          placeholder="Visible to moderators and stored on approval/rejection"
          className="min-h-[72px] rounded-lg border-zinc-700 bg-zinc-900 text-sm text-zinc-100 placeholder:text-zinc-600"
        />
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        <Button
          type="button"
          className="rounded-lg border-0 bg-emerald-700 font-semibold text-white hover:bg-emerald-600"
          onClick={onApprove}
        >
          <Check className="mr-1.5 size-4" aria-hidden />
          Approve
        </Button>
        <Button
          type="button"
          variant="outline"
          className="rounded-lg border-red-500/40 font-semibold text-red-200 hover:bg-red-950/40"
          onClick={onReject}
        >
          <X className="mr-1.5 size-4" aria-hidden />
          Reject
        </Button>
      </div>

      <DisclosureRaw label="View raw payload" payload={row} />
    </li>
  );
}

function Field({ k, v }: { k: string; v: string }) {
  return (
    <div className="flex flex-col gap-0.5 sm:flex-row sm:gap-3">
      <dt className="w-36 shrink-0 text-[10px] font-semibold uppercase tracking-wide text-zinc-500">
        {k}
      </dt>
      <dd className="min-w-0 text-[0.8125rem] font-medium leading-snug text-zinc-200">{v}</dd>
    </div>
  );
}

function HostEventModerationCard({
  row,
  pending,
  note,
  onNoteChange,
  onApprove,
  onReject,
}: {
  row: HostRow;
  pending: PendingHostEventSubmission;
  note: string;
  onNoteChange: (v: string) => void;
  onApprove: () => Promise<void>;
  onReject: () => Promise<void>;
}) {
  const img = pending.imageUrl?.trim();
  const validImg = img?.startsWith("http");

  return (
    <li className="overflow-hidden rounded-lg border border-zinc-800 bg-zinc-950/95">
      <div className="flex flex-wrap items-start justify-between gap-3 border-b border-zinc-800/80 p-4">
        <div className="min-w-0 flex-1 space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            {statusBadge(row.status)}
            <span className="text-[10px] font-semibold uppercase tracking-wide text-zinc-500">
              {formatWhen(pending.submittedAt)}
            </span>
          </div>
          <h3 className="text-lg font-semibold tracking-tight text-zinc-100">{pending.title}</h3>
          <p className="text-sm font-medium text-amber-200/90">{pending.venue}</p>
          <p className="text-xs text-zinc-500">
            {pending.categoryLabel} · {pending.date} · {pending.startTime}–{pending.endTime}
          </p>
        </div>
        {validImg ? (
          // eslint-disable-next-line @next/next/no-img-element -- admin flywheels are arbitrary user URLs
          <img
            src={img!}
            alt=""
            className="h-24 w-24 shrink-0 rounded-lg border border-zinc-700 bg-zinc-900 object-cover"
          />
        ) : null}
      </div>
      <div className="grid gap-2 p-4 text-sm sm:grid-cols-2">
        <Field k="Area" v={pending.area} />
        <Field k="Cover" v={pending.coverDollars != null ? `$${pending.coverDollars}` : "—"} />
        <Field k="Entry" v={pending.entryType} />
        <Field k="Stag" v={pending.stagRule || "—"} />
        <Field k="Age" v={pending.ageRestriction || "—"} />
        <Field k="Vibe / music" v={pending.vibeMusic || "—"} />
      </div>
      <p className="border-t border-zinc-800/80 px-4 py-3 text-[0.8125rem] leading-relaxed text-zinc-300">
        {pending.description}
      </p>
      <div className="space-y-2 border-t border-zinc-800/80 px-4 py-3">
        <Label className="text-[10px] font-semibold uppercase tracking-wide text-zinc-500">
          Moderation note
        </Label>
        <Textarea
          value={note}
          onChange={(e) => onNoteChange(e.target.value)}
          className="min-h-[72px] rounded-lg border-zinc-700 bg-zinc-900 text-sm text-zinc-100"
        />
      </div>
      <div className="flex flex-wrap gap-2 border-t border-zinc-800/80 bg-zinc-950 px-4 py-3">
        <Button
          type="button"
          className="rounded-lg border-0 bg-emerald-700 font-semibold text-white hover:bg-emerald-600"
          onClick={() => void onApprove()}
        >
          <Check className="mr-1.5 size-4" aria-hidden />
          Approve
        </Button>
        <Button
          type="button"
          variant="outline"
          className="rounded-lg border-red-500/40 font-semibold text-red-200 hover:bg-red-950/40"
          onClick={() => void onReject()}
        >
          <X className="mr-1.5 size-4" aria-hidden />
          Reject
        </Button>
      </div>
      <DisclosureRaw label="View raw payload" payload={row.event_payload} />
    </li>
  );
}

function DealModerationCard({
  row,
  pending,
  note,
  onNoteChange,
  onApprove,
  onReject,
}: {
  row: BizRow;
  pending: PendingBusinessDealSubmission;
  note: string;
  onNoteChange: (v: string) => void;
  onApprove: () => Promise<void>;
  onReject: () => Promise<void>;
}) {
  const img = pending.imageUrl?.trim();
  const validImg = img?.startsWith("http");
  const isPromo = pending.submissionKind === "event_promo";
  const dealLike = isPromo && isBusinessPromoDealLike(pending.promoType);

  return (
    <li className="overflow-hidden rounded-lg border border-zinc-800 bg-zinc-950/95">
      <div className="flex flex-wrap items-start justify-between gap-3 border-b border-zinc-800/80 p-4">
        <div className="min-w-0 flex-1 space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            {statusBadge(row.status)}
            <span className="text-[10px] font-semibold uppercase tracking-wide text-zinc-500">
              {formatWhen(pending.submittedAt)}
            </span>
            {isPromo ? (
              <Badge variant="outline" className="border-amber-500/40 text-[10px] text-amber-100">
                Business event / promo
              </Badge>
            ) : (
              <Badge variant="outline" className="border-zinc-600 text-[10px] text-zinc-300">
                Deal
              </Badge>
            )}
            {isPromo ? (
              <Badge variant="outline" className="border-zinc-600 text-[10px] text-zinc-400">
                {dealLike ? "Publishes to Deals" : "Publishes to Tonight / events"}
              </Badge>
            ) : null}
          </div>
          <h3 className="text-lg font-semibold tracking-tight text-zinc-100">{pending.dealTitle}</h3>
          <p className="text-sm font-medium text-amber-200/85">{pending.businessName}</p>
          {isPromo ? (
            <p className="text-xs text-zinc-500">
              <span className="font-semibold text-zinc-400">Type:</span>{" "}
              {pending.promoTypeLabel || pending.promoType || "—"}
            </p>
          ) : (
            <p className="text-xs text-zinc-500">
              {pending.categoryLabel} · {pending.validFrom} → {pending.validUntil}
            </p>
          )}
          {isPromo ? (
            <p className="text-xs text-zinc-500">
              <span className="font-semibold text-zinc-400">When:</span>{" "}
              {pending.eventDate || pending.validFrom} · {pending.eventStartTime}–
              {pending.eventEndTime} · {pending.area}
            </p>
          ) : null}
        </div>
        {validImg ? (
          // eslint-disable-next-line @next/next/no-img-element -- admin flywheels are arbitrary user URLs
          <img
            src={img!}
            alt=""
            className="h-24 w-24 shrink-0 rounded-lg border border-zinc-700 bg-zinc-900 object-cover"
          />
        ) : null}
      </div>
      <div className="grid gap-2 p-4 text-sm sm:grid-cols-2">
        {isPromo ? (
          <>
            <Field k="Location / area" v={pending.area} />
            <Field k="Student-only" v={pending.studentOnly ? "Yes" : "No"} />
            <Field k="Entry / price" v={pending.entryInfo?.trim() || "—"} />
            <Field k="Vibe / crowd" v={pending.expectedVibe?.trim() || "—"} />
            <Field k="Perk / offer (internal)" v={pending.perk} />
          </>
        ) : (
          <>
            <Field k="Perk / offer" v={pending.perk} />
            <Field k="Area" v={pending.area} />
            <Field k="Student-only" v={pending.studentOnly ? "Yes" : "No"} />
          </>
        )}
      </div>
      <p className="border-t border-zinc-800/80 px-4 py-3 text-[0.8125rem] leading-relaxed text-zinc-300">
        {pending.description}
      </p>
      <div className="space-y-2 border-t border-zinc-800/80 px-4 py-3">
        <Label className="text-[10px] font-semibold uppercase tracking-wide text-zinc-500">
          Moderation note
        </Label>
        <Textarea
          value={note}
          onChange={(e) => onNoteChange(e.target.value)}
          className="min-h-[72px] rounded-lg border-zinc-700 bg-zinc-900 text-sm text-zinc-100"
        />
      </div>
      <div className="flex flex-wrap gap-2 border-t border-zinc-800/80 bg-zinc-950 px-4 py-3">
        <Button
          type="button"
          className="rounded-lg border-0 bg-emerald-700 font-semibold text-white hover:bg-emerald-600"
          onClick={() => void onApprove()}
        >
          <Check className="mr-1.5 size-4" aria-hidden />
          Approve
        </Button>
        <Button
          type="button"
          variant="outline"
          className="rounded-lg border-red-500/40 font-semibold text-red-200 hover:bg-red-950/40"
          onClick={() => void onReject()}
        >
          <X className="mr-1.5 size-4" aria-hidden />
          Reject
        </Button>
      </div>
      <DisclosureRaw label="View raw payload" payload={row.deal_payload} />
    </li>
  );
}
