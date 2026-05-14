"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  Flame,
  MapPinned,
  Megaphone,
  Shield,
  Sparkles,
  Tag,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { useAppStore } from "@/store/use-app-store";

const previewCards = [
  {
    href: "/login?next=%2F",
    label: "Tonight",
    desc: "Live feed of what’s moving on campus — after you sign in.",
    icon: Flame,
    accent: "text-pu-magenta",
  },
  {
    href: "/deals",
    label: "Deals",
    desc: "Food, bars, and drops near you — browse the board.",
    icon: Tag,
    accent: "text-pu-amber",
  },
  {
    href: "/map",
    label: "Map",
    desc: "See where the energy is clustering tonight.",
    icon: MapPinned,
    accent: "text-pu-live",
  },
  {
    href: "/login?next=%2Fsubmit",
    label: "Post as host / business",
    desc: "Verified partners list moves — sign in to request access.",
    icon: Megaphone,
    accent: "text-amber-200/90",
  },
] as const;

export function PublicLanding() {
  const router = useRouter();
  const enterDemoMode = useAppStore((s) => s.enterDemoMode);

  return (
    <div className="pu-screen">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-[min(72vh,520px)] bg-[radial-gradient(ellipse_90%_58%_at_50%_-8%,oklch(0.55_0.22_328/0.22),transparent_58%)]" />
      <div className="relative mx-auto flex w-full max-w-lg flex-col gap-10 px-4 pb-16 pt-12 sm:gap-12 sm:pt-16">
        <motion.header
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
          className="space-y-4 text-center sm:text-left"
        >
          <div className="inline-flex items-center justify-center gap-2 rounded-full border border-white/[0.1] bg-black/35 px-3 py-1.5 sm:justify-start">
            <Sparkles className="size-4 text-pu-amber" aria-hidden />
            <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-white/55">
              UIUC · campus live
            </span>
          </div>
          <div className="space-y-3">
            <h1 className="pu-display max-w-[16ch] text-balance sm:max-w-none">Pull Up</h1>
            <p className="pu-section-title-lg text-balance text-white/95 sm:text-[1.35rem]">
              Find what&apos;s happening around campus tonight.
            </p>
            <p className="pu-meta mx-auto max-w-md leading-relaxed sm:mx-0">
              The live pulse for dorms, Greek rows, bars, and late-night energy — save moves, RSVP,
              and pull up before the line forms.
            </p>
          </div>
          <div className="flex flex-col gap-3 pt-2 sm:flex-row sm:flex-wrap sm:justify-start">
            <Button
              asChild
              className="h-12 rounded-xl border-0 bg-gradient-to-r from-pu-magenta to-pu-amber px-8 text-sm font-bold uppercase tracking-[0.06em] text-white shadow-[0_4px_28px_-10px_oklch(0.7_0.29_328/0.4)]"
            >
              <Link href="/signup">Create account</Link>
            </Button>
            <Button
              asChild
              variant="outline"
              className="h-12 rounded-xl border-white/[0.14] bg-black/40 px-8 text-sm font-bold text-white hover:bg-black/55"
            >
              <Link href="/login">Sign in</Link>
            </Button>
          </div>
        </motion.header>

        <section aria-labelledby="preview-heading" className="space-y-4">
          <div className="flex items-center gap-2">
            <Shield className="size-4 text-white/40" aria-hidden />
            <h2 id="preview-heading" className="text-xs font-semibold uppercase tracking-[0.14em] text-white/45">
              Explore the app
            </h2>
          </div>
          <ul className="grid gap-3 sm:grid-cols-2">
            {previewCards.map((card, i) => (
              <motion.li
                key={card.label}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.06 * i, duration: 0.35 }}
              >
                <Link
                  href={card.href}
                  className="flex h-full flex-col rounded-2xl border border-white/[0.08] bg-gradient-to-b from-pu-surface/80 to-black/90 p-4 transition hover:border-pu-magenta/25 hover:bg-pu-surface/90"
                >
                  <card.icon className={`size-5 ${card.accent}`} aria-hidden />
                  <p className="mt-3 font-heading text-sm font-bold text-white">{card.label}</p>
                  <p className="pu-meta mt-1 flex-1 text-[0.75rem] leading-relaxed">{card.desc}</p>
                </Link>
              </motion.li>
            ))}
          </ul>
        </section>

        <div className="space-y-4 rounded-2xl border border-dashed border-white/[0.12] bg-black/35 px-4 py-5 text-center">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-amber-200/70">
            Demo mode
          </p>
          <p className="text-xs leading-relaxed text-white/50">
            Preview the in-app vibe with mock saves and a sample profile.{" "}
            <span className="font-semibold text-white/70">Not signed in</span> — nothing syncs to
            your account.
          </p>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="border-white/15 text-xs font-semibold text-white/85 hover:bg-white/[0.06]"
            onClick={() => {
              enterDemoMode();
              router.push("/?demo=1");
            }}
          >
            Preview demo
          </Button>
        </div>

        <p className="text-center text-[11px] font-medium leading-relaxed text-white/42 sm:text-left">
          Opt-in personalization. Verified hosts and businesses.{" "}
          <Link href="/privacy" className="text-pu-magenta/90 underline-offset-2 hover:text-white">
            Privacy
          </Link>
          {" · "}
          <Link href="/terms" className="text-pu-magenta/90 underline-offset-2 hover:text-white">
            Terms
          </Link>
        </p>
      </div>
    </div>
  );
}
