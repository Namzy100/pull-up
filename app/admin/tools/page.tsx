import type { Metadata } from "next";
import Link from "next/link";

import { AdminSectionLabel, AdminSurface } from "@/components/role-surfaces/role-surfaces";
import { Button } from "@/components/ui/button";
import { requireAdminPageAccess } from "@/lib/supabase/auth-server";

export const metadata: Metadata = {
  title: "Admin · Tools",
  description: "Platform tools, reports, and audit placeholders.",
};

export default async function AdminToolsPage() {
  await requireAdminPageAccess();
  return (
    <div className="mx-auto max-w-2xl space-y-4 px-4 pb-8 pt-6">
      <header className="border-b border-zinc-800 pb-4">
        <AdminSectionLabel>Platform tools</AdminSectionLabel>
        <h1 className="mt-1 text-xl font-semibold text-zinc-100">Operations &amp; oversight</h1>
        <p className="mt-2 text-[0.8125rem] text-zinc-500">
          Reports, venue oversight, and audit trails will land here. Moderation queues stay under
          Moderation and Events/Deals tabs.
        </p>
        <p className="mt-3 text-[0.8125rem] text-zinc-500">
          Session details:{" "}
          <Link href="/admin/tools/account" className="font-semibold text-zinc-300 underline-offset-2 hover:text-zinc-100 hover:underline">
            Account
          </Link>
        </p>
      </header>

      <AdminSurface className="space-y-3 p-4">
        <p className="text-sm font-medium text-zinc-300">Flagged content &amp; reports</p>
        <p className="text-[0.8125rem] text-zinc-500">
          No standalone report inbox yet — use moderation cards and user directory for now.
        </p>
        <Button
          asChild
          variant="outline"
          className="h-9 rounded-lg border-zinc-700 text-xs font-semibold text-zinc-300"
        >
          <Link href="/admin">Back to moderation home</Link>
        </Button>
      </AdminSurface>

      <AdminSurface className="p-4">
        <AdminSectionLabel>Coming soon</AdminSectionLabel>
        <ul className="mt-2 list-inside list-disc space-y-1 text-sm text-zinc-500">
          <li>Audit logs export</li>
          <li>Analytics dashboards</li>
          <li>Venue-level moderation</li>
        </ul>
      </AdminSurface>
    </div>
  );
}
