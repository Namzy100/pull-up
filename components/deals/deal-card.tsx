"use client";

import Image from "next/image";
import { motion } from "framer-motion";
import {
  Bookmark,
  Eye,
  Flame,
  GraduationCap,
  MapPin,
  Tag,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { FollowVenueButton } from "@/components/profile/follow-venue-button";
import { cn } from "@/lib/utils";
import type { PuDeal } from "@/lib/types";
import { formatCompactCount } from "@/lib/event-utils";
import { useAppStore } from "@/store/use-app-store";

type DealCardProps = {
  deal: PuDeal;
  index?: number;
  /** `saved` row on /my-events; `feed` full dashboard row on /deals */
  layout?: "saved" | "feed";
  /** First card emphasis in a list */
  featured?: boolean;
};

export function DealCard({
  deal,
  index = 0,
  layout = "feed",
  featured,
}: DealCardProps) {
  const saved = useAppStore((s) => s.savedDealIds.includes(deal.id));
  const toggleSaveDeal = useAppStore((s) => s.toggleSaveDeal);
  const isSavedStrip = layout === "saved";

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        type: "spring",
        stiffness: 440,
        damping: 34,
        delay: Math.min(index * 0.035, 0.18),
      }}
      whileHover={{ y: -2 }}
      whileTap={{ scale: 0.99 }}
      className={cn(
        "relative overflow-hidden border border-white/[0.08] bg-gradient-to-br from-pu-surface via-pu-surface-deep to-black shadow-[0_12px_40px_-26px_rgba(0,0,0,0.88)] transition-[box-shadow,transform] duration-300 hover:border-white/[0.12]",
        layout === "feed" ? "rounded-3xl" : "rounded-2xl",
        featured &&
          "ring-1 ring-pu-amber/22 shadow-[0_14px_44px_-22px_oklch(0.82_0.17_72/0.12)]"
      )}
    >
      {featured ? (
        <div
          className="pointer-events-none absolute inset-0 rounded-[inherit] ring-1 ring-inset ring-pu-amber/15"
          aria-hidden
        />
      ) : null}
      <div
        className={cn(
          "relative z-10 flex gap-3 sm:gap-3.5",
          isSavedStrip ? "p-3 sm:p-3.5" : "p-3.5 sm:p-4"
        )}
      >
        <div
          className={cn(
            "relative shrink-0 overflow-hidden rounded-xl",
            isSavedStrip ? "size-[4.5rem] sm:size-20" : "size-24 sm:size-[5.75rem]"
          )}
        >
          <Image
            src={deal.imageUrl}
            alt={deal.imageAlt}
            fill
            className="object-cover"
            sizes={isSavedStrip ? "80px" : "(max-width:768px) 96px, 120px"}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/65 to-transparent" />
        </div>
        <div className="flex min-w-0 flex-1 flex-col justify-center gap-1">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="rounded-md border border-pu-amber/45 bg-pu-amber/12 px-2 py-0.5 text-[9px] font-black uppercase tracking-[0.12em] text-pu-amber">
              {deal.categoryLabel}
            </span>
            {deal.studentOnly && (
              <span className="inline-flex items-center gap-1 rounded-md border border-white/14 bg-white/[0.06] px-1.5 py-0.5 text-[9px] font-black uppercase tracking-wide text-white/82">
                <GraduationCap className="size-3" aria-hidden />
                Student
              </span>
            )}
            <span className="text-[10px] font-black uppercase tracking-wide text-pu-magenta">
              {deal.urgencyLabel}
            </span>
          </div>
          <p className="text-[11px] font-semibold uppercase tracking-wide text-white/52">
            {deal.venueLabel}
          </p>
          <h3 className="min-w-0 font-heading text-[0.98rem] font-bold leading-snug tracking-[-0.018em] text-white sm:text-[1.0625rem]">
            {deal.title}
          </h3>
          <p className="text-sm font-semibold text-white/88">{deal.perk}</p>
          <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[11px] font-medium text-white/48">
            <span className="inline-flex items-center gap-1 text-white/75">
              <MapPin className="size-3 shrink-0 text-pu-magenta" aria-hidden />
              {deal.area}
            </span>
          </div>
          <div className="inline-flex items-center gap-1 text-[11px] font-bold tabular-nums text-white/55">
            <Tag className="size-3 text-pu-amber" aria-hidden />
            {deal.windowLabel}
          </div>
        </div>
        <Button
          type="button"
          size="icon-sm"
          variant="outline"
          aria-pressed={saved}
          aria-label={saved ? "Remove saved deal" : "Save deal"}
          className={cn(
            "mt-0.5 shrink-0 self-start border-pu-border",
            saved &&
              "border-pu-magenta/40 bg-pu-magenta-dim/25 text-white"
          )}
          onClick={() => toggleSaveDeal(deal.id)}
        >
          <Bookmark
            className={cn(
              "size-4",
              saved ? "fill-pu-magenta text-pu-magenta" : "text-white/78"
            )}
            aria-hidden
          />
        </Button>
      </div>

      {!isSavedStrip && (
        <div className="relative z-10 border-t border-pu-border px-3.5 pb-3.5 pt-3 sm:px-4 sm:pb-4">
          <div className="mb-2.5 flex flex-wrap items-center gap-2 rounded-xl border border-pu-border bg-pu-surface-deep/70 px-2.5 py-2 text-[11px] font-bold tabular-nums">
            <span className="inline-flex items-center gap-1 text-pu-magenta">
              <Bookmark className="size-3.5 fill-pu-magenta/20 text-pu-magenta" />
              {formatCompactCount(deal.savesCount)} saves
            </span>
            <span className="text-white/20" aria-hidden>
              ·
            </span>
            <span className="inline-flex items-center gap-1 text-white/88">
              <Eye className="size-3.5 text-pu-amber" aria-hidden />
              {formatCompactCount(deal.watchingCount)} watching
            </span>
            <span className="text-white/20" aria-hidden>
              ·
            </span>
            <span className="inline-flex items-center gap-1 text-pu-amber">
              <Flame className="size-3.5 fill-pu-amber/25 text-pu-amber" aria-hidden />
              {formatCompactCount(deal.claimsLastHour)} grabs / hr
            </span>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-stretch">
            <FollowVenueButton
              venueId={deal.venueId}
              variant="compact"
              className="h-11 w-full border-pu-border sm:w-auto sm:min-w-[8.5rem]"
            />
            <Button
              type="button"
              size="lg"
              className="h-11 flex-1 rounded-xl border-0 bg-gradient-to-r from-pu-magenta to-pu-amber font-bold uppercase tracking-[0.08em] text-white shadow-[0_4px_24px_-12px_oklch(0.7_0.29_328/0.35)] hover:opacity-95 active:scale-[0.99]"
            >
              Pull Up
            </Button>
          </div>
        </div>
      )}
    </motion.div>
  );
}
