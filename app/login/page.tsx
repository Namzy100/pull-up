"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Loader2, Sparkles } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { hasSupabaseEnv } from "@/lib/supabase/env";

export const dynamic = "force-dynamic";

export default function LoginPage() {
  const router = useRouter();
  const envConfigured = hasSupabaseEnv();
  const [nextPath] = useState(() => {
    if (typeof window === "undefined") return "/profile";
    const params = new URLSearchParams(window.location.search);
    return params.get("next") ?? "/profile";
  });

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function signInPassword(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    if (!envConfigured) {
      setError("Supabase env is not configured.");
      setBusy(false);
      return;
    }
    const supabase = createSupabaseBrowserClient();
    const { error: authError } = await supabase.auth.signInWithPassword({ email, password });
    if (authError) {
      setError(authError.message);
      setBusy(false);
      return;
    }
    router.replace(nextPath);
    router.refresh();
  }

  async function signInGoogle() {
    setBusy(true);
    setError(null);
    if (!envConfigured) {
      setError("Supabase env is not configured.");
      setBusy(false);
      return;
    }
    const supabase = createSupabaseBrowserClient();
    const origin = window.location.origin;
    const { error: oauthError } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${origin}/auth/callback?next=${encodeURIComponent(nextPath)}`,
      },
    });
    if (oauthError) {
      setError(oauthError.message);
      setBusy(false);
    }
  }

  return (
    <div className="pu-screen min-h-dvh px-4 py-12">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-[55vh] bg-[radial-gradient(ellipse_80%_55%_at_50%_-12%,oklch(0.55_0.22_328/0.24),transparent_62%)]" />
      <div className="relative mx-auto w-full max-w-sm space-y-5">
        <div className="space-y-2 text-center">
          <p className="pu-eyebrow">Welcome back</p>
          <h1 className="pu-display text-[2.1rem]">Pull Up</h1>
          <p className="pu-meta">
            Campus moves fast. Get back on the pulse.
          </p>
          {!envConfigured ? (
            <p className="text-xs font-semibold text-pu-urgent-glow">
              Dev warning: Supabase env vars are missing.
            </p>
          ) : null}
        </div>

        <form
          onSubmit={signInPassword}
          className="space-y-4 rounded-2xl border border-pu-border bg-gradient-to-b from-pu-surface/90 to-black p-5"
        >
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="h-11 rounded-xl border-pu-border bg-black/45"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="h-11 rounded-xl border-pu-border bg-black/45"
              required
            />
          </div>
          {error ? (
            <p className="text-sm font-semibold text-pu-urgent-glow">{error}</p>
          ) : null}
          <Button
            type="submit"
            disabled={busy}
            className="h-11 w-full rounded-xl border-0 bg-gradient-to-r from-pu-magenta to-pu-amber font-black uppercase tracking-[0.08em]"
          >
            {busy ? <Loader2 className="size-4 animate-spin" /> : "Sign in"}
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={signInGoogle}
            disabled={busy}
            className="h-11 w-full rounded-xl border-pu-border bg-black/35 font-bold text-white"
          >
            <Sparkles className="mr-2 size-4 text-pu-amber" />
            Continue with Google
          </Button>
        </form>
        <p className="text-center text-sm text-white/60">
          New here?{" "}
          <Link href="/signup" className="font-semibold text-pu-magenta hover:text-white">
            Create account
          </Link>
        </p>
      </div>
    </div>
  );
}
