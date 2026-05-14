"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";

import {
  clearPendingSignupStorage,
  readPendingSignupFromStorage,
} from "@/lib/signup-pending-storage";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { hasSupabaseEnv } from "@/lib/supabase/env";
import { completeSignupAfterAuth } from "@/lib/supabase/signup-bootstrap";

export default function SignupGoogleBridgePage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      if (!hasSupabaseEnv()) {
        if (!cancelled) setError("Supabase is not configured.");
        return;
      }
      const supabase = createSupabaseBrowserClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        router.replace("/login?next=/signup/google-bridge");
        return;
      }
      const pending = readPendingSignupFromStorage();
      if (!pending) {
        router.replace("/profile");
        return;
      }
      const result = await completeSignupAfterAuth(supabase, user, pending.path, pending.fields);
      if (cancelled) return;
      if (!result.ok) {
        setError(result.error);
        return;
      }
      clearPendingSignupStorage();
      if (pending.path === "student") router.replace("/onboarding");
      else router.replace("/onboarding/pending");
      router.refresh();
    })();
    return () => {
      cancelled = true;
    };
  }, [router]);

  return (
    <div className="pu-screen flex min-h-dvh flex-col items-center justify-center px-4">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-[50vh] bg-[radial-gradient(ellipse_80%_50%_at_50%_-10%,oklch(0.55_0.22_328/0.22),transparent_60%)]" />
      <div className="relative max-w-sm space-y-4 text-center">
        {error ? (
          <p className="text-sm font-semibold text-pu-urgent-glow">{error}</p>
        ) : (
          <>
            <Loader2 className="mx-auto size-8 animate-spin text-pu-magenta" aria-hidden />
            <p className="pu-meta">Linking your Google account to Pull Up…</p>
          </>
        )}
      </div>
    </div>
  );
}
