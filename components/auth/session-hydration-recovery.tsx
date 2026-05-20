"use client";

import { Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";

type SessionHydrationRecoveryProps = {
  title?: string;
  message: string;
  busy?: boolean;
  onRetry: () => void;
  onLogout: () => void;
};

export function SessionHydrationRecovery({
  title = "Couldn’t restore your session",
  message,
  busy = false,
  onRetry,
  onLogout,
}: SessionHydrationRecoveryProps) {
  return (
    <div
      role="alertdialog"
      aria-labelledby="session-recovery-title"
      aria-describedby="session-recovery-desc"
      className="fixed inset-x-4 top-[max(1.25rem,env(safe-area-inset-top))] z-[100] mx-auto max-w-sm rounded-2xl border border-amber-500/35 bg-zinc-950/95 p-5 shadow-[0_12px_48px_-12px_rgba(0,0,0,0.85)] backdrop-blur-xl"
    >
      <p
        id="session-recovery-title"
        className="font-heading text-base font-bold tracking-tight text-white"
      >
        {title}
      </p>
      <p id="session-recovery-desc" className="pu-meta mt-2 text-[0.8125rem] leading-relaxed">
        {message}
      </p>
      <div className="mt-4 flex flex-wrap gap-2">
        <Button
          type="button"
          size="sm"
          disabled={busy}
          className="rounded-lg font-bold"
          onClick={onRetry}
        >
          {busy ? <Loader2 className="size-4 animate-spin" aria-hidden /> : "Retry"}
        </Button>
        <Button
          type="button"
          size="sm"
          variant="outline"
          disabled={busy}
          className="rounded-lg border-white/15 font-bold text-white/90"
          onClick={onLogout}
        >
          Log out
        </Button>
      </div>
    </div>
  );
}
