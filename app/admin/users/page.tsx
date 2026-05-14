import type { Metadata } from "next";
import { Suspense } from "react";

import { AdminModerationDashboard } from "@/components/admin/admin-moderation-dashboard";
import { requireAdminPageAccess } from "@/lib/supabase/auth-server";

export const metadata: Metadata = {
  title: "Admin · Users",
  description: "User directory and verification context.",
};

export default async function AdminUsersPage() {
  await requireAdminPageAccess();
  return (
    <Suspense fallback={<p className="px-4 py-6 text-center text-sm text-zinc-500">Loading…</p>}>
      <AdminModerationDashboard defaultTab="users" compact />
    </Suspense>
  );
}
