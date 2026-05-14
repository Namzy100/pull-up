"use client";

import { useState } from "react";
import { Lock, Sparkles } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  requestElevatedAccess,
  resubmitElevatedAccess,
  syncProfileStateFromSupabase,
} from "@/lib/supabase/client-persistence";
import { hasSupabaseEnv } from "@/lib/supabase/env";
import { formatSupabasePostgrestError } from "@/lib/supabase/postgrest-error";
import { useAppStore } from "@/store/use-app-store";

type PortalRegularUserProps = {
  variant: "request" | "resubmit";
  /** Required when variant is resubmit */
  resubmitRole?: "host" | "business";
};

export function PortalRegularUser({ variant, resubmitRole }: PortalRegularUserProps) {
  const hydrateFromSupabase = useAppStore((s) => s.hydrateFromSupabase);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [note, setNote] = useState("");

  async function runRequest(role: "host" | "business") {
    setBusy(true);
    setMessage(null);
    if (!hasSupabaseEnv()) {
      setMessage("Configure Supabase to submit access requests.");
      setBusy(false);
      return;
    }
    const text = note.trim() || (variant === "resubmit" ? `${role} re-verification request` : `${role} access request`);
    const res =
      variant === "resubmit" && resubmitRole
        ? await resubmitElevatedAccess(resubmitRole, text, null)
        : await requestElevatedAccess(role, text, null);
    if (res.error) {
      setMessage(formatSupabasePostgrestError(res.error));
      setBusy(false);
      return;
    }
    const synced = await syncProfileStateFromSupabase();
    if (synced) hydrateFromSupabase(synced);
    setMessage(
      variant === "resubmit"
        ? "Request re-submitted. We will review again soon."
        : `${role === "host" ? "Host" : "Business"} access request submitted.`
    );
    setBusy(false);
  }

  const isResubmit = variant === "resubmit";

  return (
    <div className="space-y-5 rounded-2xl border border-white/[0.08] bg-gradient-to-b from-pu-surface/85 to-black p-5 sm:p-6">
      <div className="flex items-start gap-3">
        <div className="flex size-11 shrink-0 items-center justify-center rounded-xl border border-pu-border bg-black/50">
          <Lock className="size-5 text-pu-amber" aria-hidden />
        </div>
        <div className="min-w-0 space-y-1">
          <h2 className="font-heading text-base font-bold tracking-tight text-white sm:text-lg">
            {isResubmit ? "Request access again" : "Posting is for verified hosts and businesses."}
          </h2>
          <p className="pu-meta text-[0.8125rem] leading-relaxed">
            {isResubmit
              ? "Add a short note for moderators. We will re-open your verification queue."
              : "Discover moves, save, RSVP, and follow the pulse — posting requires verification so the feed stays trusted."}
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
          <span>Verified hosts and businesses shape what is live on campus.</span>
        </li>
      </ul>

      <div className="space-y-2">
        <Label htmlFor="access-note" className="text-[10px] font-black uppercase tracking-wide text-white/45">
          {isResubmit ? "Note for moderators" : "Optional note"}
        </Label>
        <Input
          id="access-note"
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder={isResubmit ? "What changed since last review?" : "Chapter, venue, or context"}
          className="h-11 rounded-xl border-pu-border bg-black/45"
        />
      </div>

      {isResubmit && resubmitRole ? (
        <Button
          type="button"
          disabled={busy}
          className="h-11 w-full rounded-xl border-0 bg-gradient-to-r from-pu-magenta to-pu-amber font-bold uppercase tracking-[0.07em] text-white shadow-[0_4px_24px_-12px_oklch(0.7_0.29_328/0.35)]"
          onClick={() => void runRequest(resubmitRole)}
        >
          {busy ? "Submitting…" : `Re-request ${resubmitRole === "business" ? "business" : "host"} access`}
        </Button>
      ) : (
        <div className="flex flex-col gap-2 pt-1">
          <Button
            type="button"
            disabled={busy}
            className="h-11 rounded-xl border-0 bg-gradient-to-r from-pu-magenta to-pu-amber font-bold uppercase tracking-[0.07em] text-white shadow-[0_4px_24px_-12px_oklch(0.7_0.29_328/0.35)]"
            onClick={() => void runRequest("host")}
          >
            {busy ? "Submitting…" : "Request host access"}
          </Button>
          <Button
            type="button"
            disabled={busy}
            variant="outline"
            className="h-11 rounded-xl border-pu-border bg-black/35 font-bold text-white"
            onClick={() => void runRequest("business")}
          >
            Request business access
          </Button>
        </div>
      )}

      {message ? (
        <div
          className="rounded-xl border border-emerald-500/20 bg-emerald-950/20 px-3 py-2.5 text-center text-[0.8125rem] font-medium leading-snug text-emerald-100"
          role="status"
        >
          {message}
        </div>
      ) : null}
    </div>
  );
}
