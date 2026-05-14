import type { Metadata } from "next";
import { Suspense } from "react";

import { AdminModerationDashboard } from "@/components/admin/admin-moderation-dashboard";
import { requireAdminPageAccess } from "@/lib/supabase/auth-server";

export const metadata: Metadata = {
  title: "Admin · Events",
  description: "Review pending event submissions.",
};

export default async function AdminEventsPage() {
  await requireAdminPageAccess();
  return (
    <Suspense fallback={<p className="px-4 py-6 text-center text-sm text-zinc-500">Loading…</p>}>
      <AdminModerationDashboard defaultTab="events" compact />
    </Suspense>
  );
}
