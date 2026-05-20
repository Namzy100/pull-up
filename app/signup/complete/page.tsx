"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";

import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { hasSupabaseEnv } from "@/lib/supabase/env";
import {
  clearPendingSignupStorage,
  readPendingSignupFromStorage,
} from "@/lib/signup-pending-storage";
import {
  completeSignupAfterAuth,
  ensureMinimalStudentProfileIfMissing,
} from "@/lib/supabase/signup-bootstrap";
import { getProfileById } from "@/lib/supabase/repositories";

export default function SignupCompletePage() {
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
        router.replace("/login?next=/signup/complete");
        return;
      }

      console.info(
        "[signup/profile]",
        JSON.stringify({
          event: "signup_complete_start",
          authUserId: user.id,
        })
      );

      const pending = readPendingSignupFromStorage();
      console.info(
        "[signup/profile]",
        JSON.stringify({
          event: "signup_complete_pending_state",
          authUserId: user.id,
          hasPendingForm: Boolean(pending),
        })
      );
      if (!pending) {
        const ensured = await ensureMinimalStudentProfileIfMissing(supabase, user);
        console.info(
          "[signup/profile]",
          JSON.stringify({
            event: "signup_complete_no_pending",
            authUserId: user.id,
            ensureOk: ensured.ok,
            created: ensured.ok ? ensured.created : null,
          })
        );
        if (!ensured.ok) {
          if (!cancelled) setError(ensured.error);
          return;
        }
        const row = await getProfileById(supabase, user.id);
        if (!cancelled) {
          if (row?.onboarding_complete) router.replace("/");
          else router.replace("/onboarding");
          router.refresh();
        }
        return;
      }
      const result = await completeSignupAfterAuth(supabase, user, pending.path, pending.fields);
      if (cancelled) return;
      console.info(
        "[signup/profile]",
        JSON.stringify({
          event: "signup_complete_bootstrap_result",
          authUserId: user.id,
          path: pending.path,
          ok: result.ok,
        })
      );
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
            <p className="pu-meta">Finishing your Pull Up profile…</p>
          </>
        )}
      </div>
    </div>
  );
}
