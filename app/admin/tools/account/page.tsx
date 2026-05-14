import type { Metadata } from "next";
import Link from "next/link";

import { AdminSectionLabel, AdminSurface } from "@/components/role-surfaces/role-surfaces";
import { Button } from "@/components/ui/button";
import { requireAdminPageAccess } from "@/lib/supabase/auth-server";
import { profileRowToMockSession } from "@/lib/supabase/repositories";

export const metadata: Metadata = {
  title: "Admin · Account",
  description: "Platform operator session and account shortcuts.",
};

export default async function AdminAccountPage() {
  const { user, profile } = await requireAdminPageAccess();
  const session = profileRowToMockSession(profile);
  const displayName = session.fullName?.trim() || session.username;
  const email = user.email ?? null;

  return (
    <div className="mx-auto max-w-2xl space-y-4 px-4 pb-8 pt-4">
      <header className="border-b border-zinc-800 pb-4">
        <AdminSectionLabel>Account</AdminSectionLabel>
        <h1 className="mt-1 text-xl font-semibold text-zinc-100">Session &amp; identity</h1>
        <p className="mt-2 text-[0.8125rem] leading-relaxed text-zinc-500">
          Operator-facing summary. Member saves, RSVPs, and vibe settings stay in the consumer
          profile preview — not your default admin workspace.
        </p>
      </header>

      <AdminSurface className="space-y-3 p-4">
        <dl className="space-y-2 text-sm">
          <div className="flex flex-col gap-0.5 sm:flex-row sm:justify-between">
            <dt className="text-zinc-500">Display name</dt>
            <dd className="font-medium text-zinc-200">{displayName}</dd>
          </div>
          <div className="flex flex-col gap-0.5 sm:flex-row sm:justify-between">
            <dt className="text-zinc-500">Username</dt>
            <dd className="font-mono text-[0.8125rem] text-zinc-300">@{session.username}</dd>
          </div>
          <div className="flex flex-col gap-0.5 sm:flex-row sm:justify-between">
            <dt className="text-zinc-500">Role</dt>
            <dd className="font-medium text-amber-200/90">Admin</dd>
          </div>
          {email ? (
            <div className="flex flex-col gap-0.5 sm:flex-row sm:justify-between">
              <dt className="text-zinc-500">Email</dt>
              <dd className="break-all text-right text-[0.8125rem] text-zinc-300 sm:text-left">
                {email}
              </dd>
            </div>
          ) : null}
        </dl>
      </AdminSurface>

      <AdminSurface className="space-y-3 p-4">
        <AdminSectionLabel>Member app settings</AdminSectionLabel>
        <p className="text-[0.8125rem] leading-relaxed text-zinc-500">
          Interests, consent, and saved moves use the consumer profile shell. Open only when you
          intentionally need to verify that experience.
        </p>
        <Button
          asChild
          variant="outline"
          className="h-9 rounded-lg border-zinc-700 text-xs font-semibold text-zinc-300"
        >
          <Link href="/profile?preview=user">Open consumer profile preview</Link>
        </Button>
      </AdminSurface>

      <Button
        asChild
        variant="outline"
        className="h-9 rounded-lg border-zinc-700 text-xs font-semibold text-zinc-400"
      >
        <Link href="/admin">Back to operations</Link>
      </Button>
    </div>
  );
}
