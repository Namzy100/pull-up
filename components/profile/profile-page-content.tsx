"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import {
  ArrowLeft,
  Bookmark,
  CalendarCheck,
  MapPin,
  ShieldCheck,
  Sparkles,
  UserPlus,
} from "lucide-react";

import { DealCard } from "@/components/deals/deal-card";
import { EventCard } from "@/components/events/event-card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MOCK_DEALS } from "@/lib/deals-data";
import { getFollowableVenue, kindLabel } from "@/lib/follow-venues";
import { mockRoleLabel } from "@/lib/mock-profile";
import { MOCK_EVENTS } from "@/lib/mock-data";
import { INTEREST_OPTIONS } from "@/lib/recommendations";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { hasSupabaseEnv } from "@/lib/supabase/env";
import { createAccessRequest } from "@/lib/supabase/repositories";
import { useAppStore } from "@/store/use-app-store";
import { cn } from "@/lib/utils";

function formatMemberSince(iso: string) {
  try {
    return new Date(iso).toLocaleDateString(undefined, {
      month: "short",
      year: "numeric",
    });
  } catch {
    return iso;
  }
}

export function ProfilePageContent() {
  const router = useRouter();
  const profile = useAppStore((s) => s.mockProfile);
  const role = useAppStore((s) => s.mockUserRole);
  const savedEventIds = useAppStore((s) => s.savedEventIds);
  const savedDealIds = useAppStore((s) => s.savedDealIds);
  const rsvpedEventIds = useAppStore((s) => s.rsvpedEventIds);
  const followedVenueIds = useAppStore((s) => s.followedVenueIds);
  const selectedInterests = useAppStore((s) => s.selectedInterests);
  const updateConsent = useAppStore((s) => s.updateConsent);
  const setMockProfile = useAppStore((s) => s.setMockProfile);
  const logout = useAppStore((s) => s.logout);
  const toggleInterest = useAppStore((s) => s.toggleInterest);
  const toggleFollowVenue = useAppStore((s) => s.toggleFollowVenue);
  const [requestMessage, setRequestMessage] = useState<string | null>(null);

  const savedEvents = MOCK_EVENTS.filter((e) => savedEventIds.includes(e.id));
  const savedDeals = MOCK_DEALS.filter((d) => savedDealIds.includes(d.id));
  const rsvpEvents = MOCK_EVENTS.filter((e) => rsvpedEventIds.includes(e.id));
  const followedSpots = followedVenueIds
    .map((id) => getFollowableVenue(id))
    .filter((v): v is NonNullable<typeof v> => Boolean(v));

  async function requestRoleAccess(roleRequest: "host" | "business") {
    if (!hasSupabaseEnv()) {
      setRequestMessage("Configure Supabase env vars to submit requests.");
      return;
    }
    const supabase = createSupabaseBrowserClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      setRequestMessage("Sign in required.");
      return;
    }
    const { error } = await createAccessRequest(
      supabase,
      user.id,
      roleRequest,
      `Requested from profile shell at ${new Date().toISOString()}`,
      null
    );
    if (!error) {
      setMockProfile({
        ...profile,
        requestedRole: roleRequest,
        verificationStatus: "pending",
      });
    }
    setRequestMessage(
      error
        ? error.message
        : `${roleRequest === "host" ? "Host" : "Business"} access request submitted.`
    );
  }

  async function handleLogout() {
    await logout();
    router.replace("/login");
    router.refresh();
  }

  return (
    <div className="pu-screen pb-6 pt-7 sm:pt-9">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-[380px] bg-[radial-gradient(ellipse_88%_58%_at_50%_-12%,oklch(0.55_0.22_328/0.2),transparent_58%)]" />

      <div className="relative mx-auto w-full max-w-lg space-y-6 px-4">
        <div className="flex items-center gap-2">
          <Link
            href="/"
            className="inline-flex size-10 shrink-0 items-center justify-center rounded-xl border border-pu-border bg-black/50 text-white transition hover:border-pu-magenta/45"
            aria-label="Back to Tonight"
          >
            <ArrowLeft className="size-5" aria-hidden />
          </Link>
          <p className="pu-eyebrow">You</p>
        </div>

        <header className="overflow-hidden rounded-[1.35rem] border border-pu-border bg-gradient-to-br from-pu-surface/95 via-pu-surface-deep to-black p-5 shadow-[0_0_40px_-14px_oklch(0.7_0.29_328/0.28)]">
          <div className="flex gap-4">
            <div className="relative size-[4.5rem] shrink-0 overflow-hidden rounded-full ring-2 ring-pu-magenta/35 ring-offset-2 ring-offset-zinc-950 sm:size-20">
              <Image
                src={profile.avatarUrl}
                alt=""
                fill
                className="object-cover"
                sizes="80px"
              />
            </div>
            <div className="min-w-0 flex-1 space-y-2">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="font-heading text-xl font-extrabold tracking-tight text-white sm:text-2xl">
                  @{profile.username}
                </h1>
                <span className="rounded-full border border-pu-amber/35 bg-pu-amber/10 px-2 py-0.5 text-[10px] font-black uppercase tracking-wide text-pu-amber">
                  {mockRoleLabel(role)}
                </span>
              </div>
              {profile.fullName ? (
                <p className="text-[0.82rem] font-semibold text-white/80">{profile.fullName}</p>
              ) : null}
              <p className="flex items-start gap-1.5 text-[0.8125rem] font-semibold leading-snug text-white/72">
                <MapPin className="mt-0.5 size-3.5 shrink-0 text-pu-magenta" aria-hidden />
                <span>{profile.campus}</span>
              </p>
              <p className="text-[11px] font-semibold uppercase tracking-wide text-white/45">
                Member since {formatMemberSince(profile.memberSince)}
              </p>
              {profile.verificationStatus === "pending" ? (
                <p className="text-[11px] font-semibold uppercase tracking-wide text-pu-amber">
                  Your account is under review.
                </p>
              ) : null}
            </div>
          </div>

          {selectedInterests.length > 0 ? (
            <div className="mt-4 flex flex-wrap gap-1.5">
              {selectedInterests.map((id) => {
                const opt = INTEREST_OPTIONS.find((o) => o.id === id);
                if (!opt) return null;
                return (
                  <span
                    key={id}
                    className="rounded-full border border-white/12 bg-black/40 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-white/85"
                  >
                    {opt.label}
                  </span>
                );
              })}
            </div>
          ) : (
            <p className="pu-meta mt-4 text-[0.8125rem]">
              No vibe lanes yet — tune them in the{" "}
              <span className="text-pu-magenta">Interests</span> tab.
            </p>
          )}

          <div className="mt-5 grid grid-cols-3 gap-2 border-t border-pu-border pt-4">
            <StatMini
              icon={Bookmark}
              label="Saved events"
              value={savedEvents.length}
            />
            <StatMini icon={CalendarCheck} label="RSVPs" value={rsvpEvents.length} />
            <StatMini
              icon={UserPlus}
              label="Following"
              value={followedVenueIds.length}
            />
          </div>
          {savedDeals.length > 0 ? (
            <p className="pu-meta mt-3 text-center text-[0.75rem]">
              + {savedDeals.length} saved deal{savedDeals.length === 1 ? "" : "s"} in Deals
            </p>
          ) : null}
          {role === "regular_user" ? (
            <div className="mt-3 flex flex-wrap gap-2 border-t border-pu-border pt-3">
              <Button
                type="button"
                size="sm"
                variant="outline"
                className="border-pu-border text-xs font-bold"
                onClick={() => void requestRoleAccess("host")}
              >
                Request Host Access
              </Button>
              <Button
                type="button"
                size="sm"
                variant="outline"
                className="border-pu-border text-xs font-bold"
                onClick={() => void requestRoleAccess("business")}
              >
                Request Business Access
              </Button>
              {requestMessage ? (
                <p className="w-full text-xs font-semibold text-pu-live">{requestMessage}</p>
              ) : null}
            </div>
          ) : null}
          <div className="mt-3 border-t border-pu-border pt-3">
            <Button
              type="button"
              size="sm"
              variant="outline"
              className="border-pu-border text-xs font-bold"
              onClick={() => void handleLogout()}
            >
              Log out
            </Button>
          </div>
        </header>

        <Tabs defaultValue="saved" className="w-full gap-4">
          <TabsList
            variant="line"
            className="flex h-auto w-full min-w-0 flex-nowrap justify-start gap-0 overflow-x-auto rounded-none border-0 bg-transparent p-0 pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          >
            {(
              [
                ["saved", "Saved"],
                ["rsvp", "RSVP’d"],
                ["following", "Following"],
                ["interests", "Interests"],
                ["privacy", "Privacy"],
              ] as const
            ).map(([id, label]) => (
              <TabsTrigger
                key={id}
                value={id}
                className="shrink-0 rounded-full border border-transparent px-3 py-2 text-[11px] font-black uppercase tracking-wide data-active:border-pu-border data-active:bg-pu-magenta/15 data-active:text-white"
              >
                {label}
              </TabsTrigger>
            ))}
          </TabsList>

          <TabsContent value="saved" className="mt-0 space-y-4">
            <p className="pu-meta">
              Your locked-in moves and deals — the feed remembers when you&apos;re
              indecisive.
            </p>
            {savedEvents.length === 0 && savedDeals.length === 0 ? (
              <EmptyBlock
                title="Nothing saved yet"
                hint="Heart the cards that feel like your night."
              />
            ) : (
              <div className="space-y-5">
                {savedEvents.length > 0 ? (
                  <div className="space-y-3">
                    <h2 className="text-xs font-black uppercase tracking-[0.14em] text-white/50">
                      Events
                    </h2>
                    <ul className="pu-feed-stack">
                      {savedEvents.map((e, i) => (
                        <li key={e.id}>
                          <EventCard event={e} layout="feed" index={i} />
                        </li>
                      ))}
                    </ul>
                  </div>
                ) : null}
                {savedDeals.length > 0 ? (
                  <div className="space-y-3">
                    <h2 className="text-xs font-black uppercase tracking-[0.14em] text-white/50">
                      Deals
                    </h2>
                    <ul className="pu-feed-stack">
                      {savedDeals.map((d, i) => (
                        <li key={d.id}>
                          <DealCard deal={d} layout="feed" index={i} />
                        </li>
                      ))}
                    </ul>
                  </div>
                ) : null}
              </div>
            )}
          </TabsContent>

          <TabsContent value="rsvp" className="mt-0 space-y-4">
            <p className="pu-meta">Plans you committed to — no attendee lists, just your word.</p>
            {rsvpEvents.length === 0 ? (
              <EmptyBlock
                title="No RSVPs yet"
                hint="Lock a move from Tonight when you’re actually pulling up."
              />
            ) : (
              <ul className="pu-feed-stack">
                {rsvpEvents.map((e, i) => (
                  <li key={e.id}>
                    <EventCard event={e} layout="feed" index={i} />
                  </li>
                ))}
              </ul>
            )}
          </TabsContent>

          <TabsContent value="following" className="mt-0 space-y-4">
            <p className="pu-meta">
              Bars, kitchens, and orgs you keep on radar — new drops surface faster.
            </p>
            {followedSpots.length === 0 ? (
              <EmptyBlock
                title="Not following anyone yet"
                hint="Follow from an event, deal, or map preview — stays synced here."
              />
            ) : (
              <ul className="flex flex-col gap-3">
                {followedSpots.map((spot) => (
                  <li
                    key={spot.id}
                    className="flex items-center gap-3 rounded-2xl border border-pu-border bg-black/40 p-3"
                  >
                    <div className="relative size-14 shrink-0 overflow-hidden rounded-xl">
                      <Image
                        src={spot.imageUrl}
                        alt=""
                        fill
                        className="object-cover"
                        sizes="56px"
                      />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-[10px] font-bold uppercase tracking-wide text-pu-amber">
                        {kindLabel(spot.kind)}
                      </p>
                      <p className="font-heading text-base font-extrabold text-white">
                        {spot.name}
                      </p>
                      <p className="text-[12px] font-medium text-white/55">
                        {spot.area} · {spot.tagline}
                      </p>
                    </div>
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      className="shrink-0 border-white/15 font-bold"
                      onClick={() => toggleFollowVenue(spot.id)}
                    >
                      Unfollow
                    </Button>
                  </li>
                ))}
              </ul>
            )}
          </TabsContent>

          <TabsContent value="interests" className="mt-0 space-y-4">
            <p className="pu-meta">
              Tap lanes to tune Tonight + recommendations — same chips as onboarding.
            </p>
            <div className="flex flex-wrap gap-2">
              {INTEREST_OPTIONS.map((opt) => {
                const on = selectedInterests.includes(opt.id);
                return (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => toggleInterest(opt.id)}
                    aria-pressed={on}
                    className={cn(
                      "rounded-full border px-3 py-2 text-[11px] font-black uppercase tracking-wide transition active:scale-[0.98]",
                      on
                        ? "border-pu-magenta/55 bg-pu-magenta-dim/30 text-white shadow-[0_0_16px_-8px_oklch(0.7_0.29_328/0.4)]"
                        : "border-pu-border bg-black/45 text-white/55 hover:border-white/22 hover:text-white/88"
                    )}
                  >
                    {opt.label}
                  </button>
                );
              })}
            </div>
            <div className="flex items-start gap-2 rounded-xl border border-pu-border bg-pu-magenta/8 p-3">
              <Sparkles className="mt-0.5 size-4 shrink-0 text-pu-amber" aria-hidden />
              <p className="text-[0.8125rem] font-medium leading-relaxed text-white/70">
                FOMO-safe: interests steer discovery only — never a public list of who
                you are.
              </p>
            </div>
          </TabsContent>
          <TabsContent value="privacy" className="mt-0 space-y-4">
            <div className="rounded-2xl border border-pu-border bg-black/35 p-4">
              <div className="mb-3 flex items-center gap-2">
                <ShieldCheck className="size-4 text-pu-amber" />
                <p className="text-xs font-black uppercase tracking-[0.14em] text-white/70">
                  Consent preferences
                </p>
              </div>
              <div className="space-y-3">
                <ConsentToggle
                  label="Analytics"
                  hint="Performance and quality metrics."
                  checked={profile.consentAnalytics}
                  onCheckedChange={(value) => updateConsent("consentAnalytics", value)}
                />
                <ConsentToggle
                  label="Personalization"
                  hint="Recommendation and lane tuning."
                  checked={profile.consentPersonalization}
                  onCheckedChange={(value) =>
                    updateConsent("consentPersonalization", value)
                  }
                />
                <ConsentToggle
                  label="Location usage"
                  hint="Nearby context and map relevance."
                  checked={profile.consentLocation}
                  onCheckedChange={(value) => updateConsent("consentLocation", value)}
                />
                <ConsentToggle
                  label="Marketing"
                  hint="Optional promos and campaigns."
                  checked={profile.consentMarketing}
                  onCheckedChange={(value) => updateConsent("consentMarketing", value)}
                />
              </div>
              <div className="mt-4 border-t border-pu-border pt-3 text-xs font-semibold text-white/65">
                <p>
                  Privacy-first beta. Read{" "}
                  <Link href="/privacy" className="text-pu-magenta hover:text-white">
                    Privacy
                  </Link>{" "}
                  and{" "}
                  <Link href="/terms" className="text-pu-magenta hover:text-white">
                    Terms
                  </Link>
                  .
                </p>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

function StatMini({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: number;
}) {
  return (
    <div className="rounded-xl border border-white/[0.08] bg-black/35 px-2 py-2 text-center">
      <Icon className="mx-auto size-4 text-pu-magenta" aria-hidden />
      <p className="mt-1 font-heading text-lg font-extrabold tabular-nums text-white">
        {value}
      </p>
      <p className="text-[9px] font-bold uppercase tracking-wide text-white/45">
        {label}
      </p>
    </div>
  );
}

function EmptyBlock({ title, hint }: { title: string; hint: string }) {
  return (
    <div className="rounded-2xl border border-dashed border-pu-border bg-black/35 px-5 py-10 text-center">
      <p className="font-heading text-lg font-extrabold text-white">{title}</p>
      <p className="pu-meta mt-2">{hint}</p>
    </div>
  );
}

function ConsentToggle({
  label,
  hint,
  checked,
  onCheckedChange,
}: {
  label: string;
  hint: string;
  checked: boolean;
  onCheckedChange: (value: boolean) => void;
}) {
  return (
    <label className="flex items-start justify-between gap-3 rounded-xl border border-pu-border bg-black/30 px-3 py-3">
      <span>
        <span className="block text-sm font-semibold text-white">{label}</span>
        <span className="block text-xs text-white/55">{hint}</span>
      </span>
      <Switch checked={checked} onCheckedChange={onCheckedChange} aria-label={label} />
    </label>
  );
}
