"use client";

import { useEffect } from "react";

import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { hasSupabaseEnv } from "@/lib/supabase/env";
import { syncProfileStateFromSupabase } from "@/lib/supabase/client-persistence";
import { useAppStore } from "@/store/use-app-store";

export function SessionSync() {
  const hydrateFromSupabase = useAppStore((s) => s.hydrateFromSupabase);
  const resetToMockDefaults = useAppStore((s) => s.resetToMockDefaults);
  const clearSessionScopedState = useAppStore((s) => s.clearSessionScopedState);

  useEffect(() => {
    if (!hasSupabaseEnv()) return;
    let mounted = true;
    const supabase = createSupabaseBrowserClient();
    const runSync = async () => {
      clearSessionScopedState();
      const data = await syncProfileStateFromSupabase();
      if (!mounted) return;
      if (!data) {
        resetToMockDefaults();
        return;
      }
      hydrateFromSupabase(data);
    };

    void runSync();
    const { data: authListener } = supabase.auth.onAuthStateChange(() => {
      void runSync();
    });

    return () => {
      mounted = false;
      authListener.subscription.unsubscribe();
    };
  }, [clearSessionScopedState, hydrateFromSupabase, resetToMockDefaults]);

  return null;
}
