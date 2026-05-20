"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { persistAvatarUrl, syncProfileStateFromSupabase } from "@/lib/supabase/client-persistence";
import { formatSupabasePostgrestError } from "@/lib/supabase/postgrest-error";
import { hasSupabaseEnv } from "@/lib/supabase/env";
import { isValidProfileImageUrl } from "@/lib/profile-image-url";
import { useAppStore } from "@/store/use-app-store";

export function ProfilePhotoControls() {
  const hydrateFromSupabase = useAppStore((s) => s.hydrateFromSupabase);
  const profile = useAppStore((s) => s.mockProfile);
  const [draft, setDraft] = useState(profile.avatarUrl);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const envOk = hasSupabaseEnv();
  const hasPhoto = Boolean(profile.avatarUrl.trim());

  async function applyUrl(nextUrl: string | null) {
    setBusy(true);
    setError(null);
    const res = await persistAvatarUrl(nextUrl);
    if (res.error) {
      setError(formatSupabasePostgrestError(res.error));
      setDraft(useAppStore.getState().mockProfile.avatarUrl);
      setBusy(false);
      console.error("[profile-photo]", {
        event: "avatar_persist_failed",
        code: res.error.code,
        message: res.error.message,
      });
      return;
    }
    const nextAvatar =
      nextUrl === null ? "" : isValidProfileImageUrl(nextUrl.trim()) ? nextUrl.trim() : "";
    useAppStore.setState((s) => ({
      mockProfile: { ...s.mockProfile, avatarUrl: nextAvatar },
    }));
    setDraft(nextAvatar);
    const synced = await syncProfileStateFromSupabase();
    if (synced) hydrateFromSupabase(synced);
    setBusy(false);
  }

  async function handleSave() {
    const t = draft.trim();
    if (!t) {
      setError("Paste an image URL, or use Remove photo to clear your picture.");
      console.info("[profile-photo]", JSON.stringify({ event: "avatar_save_blocked", reason: "empty_url" }));
      return;
    }
    if (!isValidProfileImageUrl(t)) {
      setError("Image URL must start with http:// or https://");
      console.info(
        "[profile-photo]",
        JSON.stringify({ event: "avatar_save_blocked", reason: "invalid_url_scheme" })
      );
      return;
    }
    await applyUrl(t);
  }

  async function handleRemove() {
    await applyUrl(null);
  }

  if (!envOk) {
    return (
      <div className="mt-4 border-t border-pu-border pt-4">
        <p className="text-[11px] font-semibold text-white/45">
          Connect Supabase to save a profile photo from a URL.
        </p>
      </div>
    );
  }

  return (
    <div className="mt-4 border-t border-pu-border pt-4">
      <Label htmlFor="profile-avatar-url" className="text-[10px] font-black uppercase tracking-[0.14em] text-white/50">
        Profile photo
      </Label>
      <p className="pu-meta mt-1 text-[0.75rem] leading-relaxed">
        Paste an image link (https). You can change or remove it anytime — uploads coming later.
      </p>
      <Input
        id="profile-avatar-url"
        type="url"
        inputMode="url"
        autoComplete="off"
        placeholder="https://…"
        value={draft}
        onChange={(e) => {
          setDraft(e.target.value);
          setError(null);
        }}
        disabled={busy}
        className="mt-2 h-10 rounded-xl border-pu-border bg-black/45 text-sm"
      />
      {error ? (
        <p className="mt-2 text-xs font-semibold text-pu-urgent-glow" role="alert">
          {error}
        </p>
      ) : null}
      <div className="mt-3 flex flex-wrap gap-2">
        <Button
          type="button"
          size="sm"
          disabled={busy}
          className="rounded-lg font-bold"
          onClick={() => void handleSave()}
        >
          {hasPhoto ? "Change photo" : "Add photo"}
        </Button>
        <Button
          type="button"
          size="sm"
          variant="outline"
          disabled={busy || !hasPhoto}
          className="border-pu-border font-bold text-white/85 disabled:opacity-40"
          onClick={() => void handleRemove()}
        >
          Remove photo
        </Button>
      </div>
    </div>
  );
}
