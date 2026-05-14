import { redirect } from "next/navigation";

import { requireAdminPageAccess } from "@/lib/supabase/auth-server";

export default async function AdminModerationAliasPage() {
  await requireAdminPageAccess();
  redirect("/admin");
}
