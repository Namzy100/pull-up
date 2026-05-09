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

export default function SignupPage() {
  const router = useRouter();
  const envConfigured = hasSupabaseEnv();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  async function signUpPassword(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    setMessage(null);
    if (!envConfigured) {
      setError("Supabase env is not configured.");
      setBusy(false);
      return;
    }

    const supabase = createSupabaseBrowserClient();
    const origin = window.location.origin;
    const { data, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${origin}/auth/callback?next=/onboarding`,
      },
    });
    if (authError) {
      setError(authError.message);
      setBusy(false);
      return;
    }
    if (data.user && !data.session) {
      setMessage("Check your email to confirm your account.");
      setBusy(false);
      return;
    }
    router.replace("/onboarding");
    router.refresh();
  }

  async function signUpGoogle() {
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
        redirectTo: `${origin}/auth/callback?next=/onboarding`,
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
          <p className="pu-eyebrow">Join the pulse</p>
          <h1 className="pu-display text-[2.1rem]">Create account</h1>
          <p className="pu-meta">
            Premium nights, live momentum, and your own identity layer.
          </p>
          {!envConfigured ? (
            <p className="text-xs font-semibold text-pu-urgent-glow">
              Dev warning: Supabase env vars are missing.
            </p>
          ) : null}
        </div>

        <form
          onSubmit={signUpPassword}
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
              minLength={8}
              required
            />
          </div>
          {error ? (
            <p className="text-sm font-semibold text-pu-urgent-glow">{error}</p>
          ) : null}
          {message ? (
            <p className="text-sm font-semibold text-pu-live">{message}</p>
          ) : null}
          <Button
            type="submit"
            disabled={busy}
            className="h-11 w-full rounded-xl border-0 bg-gradient-to-r from-pu-magenta to-pu-amber font-black uppercase tracking-[0.08em]"
          >
            {busy ? <Loader2 className="size-4 animate-spin" /> : "Create account"}
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={signUpGoogle}
            disabled={busy}
            className="h-11 w-full rounded-xl border-pu-border bg-black/35 font-bold text-white"
          >
            <Sparkles className="mr-2 size-4 text-pu-amber" />
            Continue with Google
          </Button>
        </form>
        <p className="text-center text-sm text-white/60">
          Already have an account?{" "}
          <Link href="/login" className="font-semibold text-pu-magenta hover:text-white">
            Sign in
          </Link>
        </p>
        <p className="text-center text-xs font-semibold text-white/45">
          By continuing you agree to our{" "}
          <Link href="/terms" className="text-pu-magenta hover:text-white">
            Terms
          </Link>{" "}
          and{" "}
          <Link href="/privacy" className="text-pu-magenta hover:text-white">
            Privacy
          </Link>
          .
        </p>
      </div>
    </div>
  );
}
