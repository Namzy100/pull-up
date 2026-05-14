"use client";

import { useEffect } from "react";

import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { hasSupabaseEnv } from "@/lib/supabase/env";
import { syncProfileStateFromSupabase } from "@/lib/supabase/client-persistence";
import { useAppStore } from "@/store/use-app-store";

export function SessionSync() {
  const hydrateFromSupabase = useAppStore((s) => s.hydrateFromSupabase);
  const hydrateLoggedOut = useAppStore((s) => s.hydrateLoggedOut);
  const resetToDemoDefaults = useAppStore((s) => s.resetToDemoDefaults);
  const clearSessionScopedState = useAppStore((s) => s.clearSessionScopedState);

  useEffect(() => {
    if (!hasSupabaseEnv()) {
      const demo =
        typeof window !== "undefined" && window.localStorage.getItem("pu_demo_mode") === "1";
      if (demo) {
        resetToDemoDefaults();
      } else {
        hydrateLoggedOut();
      }
      return;
    }

    let mounted = true;
    const supabase = createSupabaseBrowserClient();
    const runSync = async () => {
      clearSessionScopedState();
      const data = await syncProfileStateFromSupabase();
      if (!mounted) return;
      const demo =
        typeof window !== "undefined" && window.localStorage.getItem("pu_demo_mode") === "1";
      if (!data) {
        if (demo) {
          resetToDemoDefaults();
        } else {
          hydrateLoggedOut();
        }
        return;
      }
      if (demo && typeof window !== "undefined") {
        window.localStorage.removeItem("pu_demo_mode");
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
  }, [
    clearSessionScopedState,
    hydrateFromSupabase,
    hydrateLoggedOut,
    resetToDemoDefaults,
  ]);

  return null;
}
