"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { hasSupabaseEnv } from "@/lib/supabase/env";
import { getProfileById } from "@/lib/supabase/repositories";

export default function OnboardingPendingPage() {
  const router = useRouter();
  const [kind, setKind] = useState<"host" | "business" | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      if (!hasSupabaseEnv()) {
        if (!cancelled) setLoading(false);
        return;
      }
      const supabase = createSupabaseBrowserClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (cancelled) return;
      if (!user) {
        router.replace("/login?next=/onboarding/pending");
        return;
      }
      const row = await getProfileById(supabase, user.id);
      if (cancelled) return;
      if (!row) {
        router.replace("/signup");
        return;
      }
      if (row.verification_status !== "pending" || row.requested_role === "none") {
        router.replace("/profile");
        return;
      }
      setKind(row.requested_role === "business" ? "business" : "host");
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [router]);

  if (loading) {
    return (
      <div className="pu-screen flex min-h-dvh items-center justify-center">
        <Loader2 className="size-8 animate-spin text-pu-magenta" aria-hidden />
      </div>
    );
  }

  const title =
    kind === "business" ? "Business verification pending" : "Host verification pending";
  const body =
    kind === "business"
      ? "We review local businesses before they can post deals or events. Browse the app as a regular user while we verify your details."
      : "We review hosts to keep the feed trusted. Browse the app as a regular user while we verify your organization.";

  return (
    <div className="pu-screen min-h-dvh px-4 py-12">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-[55vh] bg-[radial-gradient(ellipse_80%_55%_at_50%_-12%,oklch(0.55_0.22_328/0.24),transparent_62%)]" />
      <div className="relative mx-auto max-w-md space-y-6 rounded-2xl border border-pu-border bg-gradient-to-b from-pu-surface/90 to-black p-6 text-center">
        <p className="pu-eyebrow">Pull Up</p>
        <h1 className="pu-display text-[1.65rem]">{title}</h1>
        <p className="pu-meta leading-relaxed">{body}</p>
        <div className="flex flex-col gap-2 sm:flex-row sm:justify-center">
          <Button asChild className="rounded-xl font-black uppercase tracking-[0.08em]">
            <Link href="/">Tonight</Link>
          </Button>
          <Button
            asChild
            variant="outline"
            className="rounded-xl border-pu-border bg-black/35 font-bold text-white"
          >
            <Link href="/profile">Profile</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
