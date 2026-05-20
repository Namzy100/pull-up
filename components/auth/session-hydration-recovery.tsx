"use client";

import Link from "next/link";
import { Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";

type SessionHydrationRecoveryProps = {
  title?: string;
  message: string;
  busy?: boolean;
  onRetry: () => void;
  onLogout: () => void;
  /** When set, shows a “Go to login” action (link or button). */
  goToLoginHref?: string;
  onGoToLogin?: () => void;
  goToLoginLabel?: string;
  /** Optional third action (e.g. create minimal profile row). */
  onRepair?: () => void;
  repairLabel?: string;
};

export function SessionHydrationRecovery({
  title = "Couldn’t restore your session",
  message,
  busy = false,
  onRetry,
  onLogout,
  goToLoginHref,
  onGoToLogin,
  goToLoginLabel = "Go to login",
  onRepair,
  repairLabel = "Repair profile",
}: SessionHydrationRecoveryProps) {
  const showLogin = Boolean(goToLoginHref || onGoToLogin);
  const showRepair = Boolean(onRepair);

  return (
    <div
      role="alertdialog"
      aria-labelledby="session-recovery-title"
      aria-describedby="session-recovery-desc"
      className="w-full max-w-sm rounded-2xl border border-amber-500/35 bg-zinc-950/95 p-5 shadow-[0_12px_48px_-12px_rgba(0,0,0,0.85)] backdrop-blur-xl"
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
        {showLogin ? (
          goToLoginHref ? (
            <Button
              asChild
              type="button"
              size="sm"
              variant="outline"
              disabled={busy}
              className="rounded-lg border-white/15 font-bold text-white/90"
            >
              <Link href={goToLoginHref}>{goToLoginLabel}</Link>
            </Button>
          ) : (
            <Button
              type="button"
              size="sm"
              variant="outline"
              disabled={busy}
              className="rounded-lg border-white/15 font-bold text-white/90"
              onClick={onGoToLogin}
            >
              {goToLoginLabel}
            </Button>
          )
        ) : null}
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
        {showRepair ? (
          <Button
            type="button"
            size="sm"
            variant="secondary"
            disabled={busy}
            className="rounded-lg font-bold"
            onClick={onRepair}
          >
            {repairLabel}
          </Button>
        ) : null}
      </div>
    </div>
  );
}
