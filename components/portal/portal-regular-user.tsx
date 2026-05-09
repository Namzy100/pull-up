"use client";

import { useState } from "react";
import { Lock, Sparkles } from "lucide-react";

import { Button } from "@/components/ui/button";

export function PortalRegularUser() {
  const [requested, setRequested] = useState(false);

  return (
    <div className="space-y-5 rounded-2xl border border-pu-border bg-gradient-to-b from-pu-surface/90 to-black p-5 shadow-[0_0_36px_-14px_oklch(0.7_0.29_328/0.22)]">
      <div className="flex items-start gap-3">
        <div className="flex size-11 shrink-0 items-center justify-center rounded-xl border border-pu-border bg-black/50">
          <Lock className="size-5 text-pu-amber" aria-hidden />
        </div>
        <div className="min-w-0 space-y-1">
          <h2 className="font-heading text-lg font-extrabold tracking-tight text-white">
            Posting is for verified hosts and local businesses.
          </h2>
          <p className="pu-meta text-[0.8125rem] leading-relaxed">
            You can discover moves, save, RSVP, and follow the pulse — posting
            requires verification so the feed stays trusted.
          </p>
        </div>
      </div>

      <ul className="space-y-2 text-[0.8125rem] font-medium leading-relaxed text-white/72">
        <li className="flex gap-2">
          <Sparkles className="mt-0.5 size-4 shrink-0 text-pu-magenta" aria-hidden />
          <span>Tonight feed, deals, and map stay open — pull up on anything hot.</span>
        </li>
        <li className="flex gap-2">
          <Sparkles className="mt-0.5 size-4 shrink-0 text-pu-amber" aria-hidden />
          <span>Verified hosts control the pulse. Businesses drop offers when campus is moving.</span>
        </li>
      </ul>

      <div className="flex flex-col gap-2 pt-1">
        <Button
          type="button"
          className="h-11 rounded-xl border-0 bg-gradient-to-r from-pu-magenta to-pu-amber font-black uppercase tracking-[0.08em] text-white shadow-[0_0_22px_-8px_oklch(0.7_0.29_328/0.45)]"
          onClick={() => setRequested(true)}
        >
          Request host access
        </Button>
        {requested ? (
          <p
            className="text-center text-[0.8125rem] font-semibold text-pu-live"
            role="status"
          >
            Request logged (mock) — we&apos;ll email you when verification exists.
          </p>
        ) : null}
      </div>
    </div>
  );
}
