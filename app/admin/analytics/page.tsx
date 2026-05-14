import { redirect } from "next/navigation";

import { requireAdminPageAccess } from "@/lib/supabase/auth-server";

export default async function AdminAnalyticsAliasPage() {
  await requireAdminPageAccess();
  redirect("/admin/tools");
}
