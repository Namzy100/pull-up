import type { Metadata } from "next";
import { Suspense } from "react";

import { AdminModerationDashboard } from "@/components/admin/admin-moderation-dashboard";
import { AdminOperatorOverview } from "@/components/admin/admin-operator-overview";
import { requireAdminPageAccess } from "@/lib/supabase/auth-server";

export const metadata: Metadata = {
  title: "Admin",
  description: "Platform operations, moderation, and trust & safety for Pull Up.",
};

export default async function AdminPage() {
  await requireAdminPageAccess();
  return (
    <>
      <AdminOperatorOverview />
      <Suspense fallback={<p className="px-4 py-6 text-center text-sm text-zinc-500">Loading moderation…</p>}>
        <AdminModerationDashboard omitStatsRow />
      </Suspense>
    </>
  );
}
