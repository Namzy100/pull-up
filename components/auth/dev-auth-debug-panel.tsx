"use client";

import { useEffect, useMemo, useState } from "react";
import { usePathname } from "next/navigation";

import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { fetchProfileForAuthUser } from "@/lib/supabase/repositories";
import { useAppStore } from "@/store/use-app-store";

type DebugState = {
  hasSession: boolean;
  profileLoaded: boolean;
  onboardingComplete: boolean | null;
  computedDestination: string;
};

export function DevAuthDebugPanel() {
  const pathname = usePathname();
  const authReady = useAppStore((s) => s.authReady);
  const authUserId = useAppStore((s) => s.authUserId ?? null);
  const [state, setState] = useState<DebugState>({
    hasSession: false,
    profileLoaded: false,
    onboardingComplete: null,
    computedDestination: "/login",
  });

  useEffect(() => {
    let cancelled = false;
    async function load() {
      const supabase = createSupabaseBrowserClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        if (!cancelled) {
          setState({
            hasSession: false,
            profileLoaded: false,
            onboardingComplete: null,
            computedDestination: "/login",
          });
        }
        return;
      }

      const profileRes = await fetchProfileForAuthUser(supabase, user.id);
      const onboardingComplete = profileRes.ok ? profileRes.row?.onboarding_complete ?? null : null;
      let computedDestination = "/onboarding";
      if (onboardingComplete) computedDestination = "/";
      if (!profileRes.ok) computedDestination = "/login?profile_read_failed=1";

      if (!cancelled) {
        setState({
          hasSession: true,
          profileLoaded: profileRes.ok && Boolean(profileRes.row),
          onboardingComplete,
          computedDestination,
        });
      }
    }
    void load();
    return () => {
      cancelled = true;
    };
  }, [pathname, authUserId]);

  const shouldRender = process.env.NODE_ENV === "development";
  const debugRows = useMemo(
    () => [
      ["route", pathname],
      ["authReady", String(authReady)],
      ["authUserId", authUserId ?? "null"],
      ["supabase session", String(state.hasSession)],
      ["profile loaded", String(state.profileLoaded)],
      ["onboarding_complete", String(state.onboardingComplete)],
      ["computed destination", state.computedDestination],
    ],
    [authReady, authUserId, pathname, state]
  );

  if (!shouldRender) return null;

  return (
    <aside className="fixed bottom-[calc(6rem+env(safe-area-inset-bottom))] left-3 right-3 z-[80] rounded-xl border border-white/15 bg-black/85 p-3 text-xs text-white/90 backdrop-blur">
      <p className="mb-2 text-[10px] font-bold uppercase tracking-[0.12em] text-pu-amber">Auth Debug</p>
      <div className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-1">
        {debugRows.map(([k, v]) => (
          <span key={k} className={k === "route" ? "text-pu-amber" : ""}>
            {k}: <span className="text-white/75">{v}</span>
          </span>
        ))}
      </div>
    </aside>
  );
}
