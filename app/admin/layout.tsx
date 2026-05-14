import type { ReactNode } from "react";

import { AdminShellChrome } from "@/components/layout/admin-shell-chrome";
import { AdminPageAmbient } from "@/components/role-surfaces/role-surfaces";
import { requireAdminPageAccess } from "@/lib/supabase/auth-server";
import { profileRowToMockSession } from "@/lib/supabase/repositories";

export default async function AdminLayout({ children }: { children: ReactNode }) {
  const { user, profile } = await requireAdminPageAccess();
  const session = profileRowToMockSession(profile);
  const displayName = session.fullName?.trim() || session.username;

  return (
    <div className="relative min-h-dvh bg-zinc-950 pb-[calc(4.75rem+env(safe-area-inset-bottom))] text-zinc-100">
      <AdminPageAmbient />
      <AdminShellChrome
        displayName={displayName}
        username={session.username}
        email={user.email ?? null}
        avatarUrl={session.avatarUrl}
      />
      <div className="relative z-[1]">{children}</div>
    </div>
  );
}
