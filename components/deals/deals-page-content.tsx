"use client";

import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Flame, Zap } from "lucide-react";

import { DealCard } from "@/components/deals/deal-card";
import { LiveAmbient } from "@/components/feed/live-ambient";
import { Badge } from "@/components/ui/badge";
import {
  DEAL_FILTER_OPTIONS,
  filterDealsByChip,
  sortDealsByUrgency,
} from "@/lib/deals-data";
import type { DealFilterId, PuDeal } from "@/lib/types";
import { cn } from "@/lib/utils";

type DealsPageContentProps = {
  deals: PuDeal[];
};

export function DealsPageContent({ deals }: DealsPageContentProps) {
  const [chip, setChip] = useState<DealFilterId | null>(null);

  const filteredSorted = useMemo(() => {
    const f = filterDealsByChip(deals, chip);
    return sortDealsByUrgency(f);
  }, [chip, deals]);

  const urgentDeals = useMemo(() => filteredSorted.slice(0, 3), [filteredSorted]);
  const laterDeals = useMemo(() => filteredSorted.slice(3), [filteredSorted]);

  return (
    <div className="pu-screen">
      <LiveAmbient />
      <div className="pointer-events-none absolute inset-x-0 top-0 h-[400px] bg-[radial-gradient(ellipse_88%_58%_at_50%_-10%,oklch(0.72_0.16_72/0.2),transparent_56%)]" />

      <div className="relative mx-auto flex w-full max-w-lg flex-col px-4 pb-6 pt-9 sm:pt-11">
        <motion.header
          initial={{ opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
          className="space-y-3"
        >
          <div className="space-y-2">
            <p className="pu-eyebrow text-pu-amber/95">Tonight near UIUC</p>
            <h1 className="pu-display text-balance">Deals near campus</h1>
            <p className="pu-meta max-w-[21rem] text-[0.875rem] leading-snug">
              What can you get near campus right now — food, bars, drops, and
              student specials before they disappear.
            </p>
          </div>

          <motion.div
            className="flex flex-wrap gap-2"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.08 }}
          >
            {[
              "Ending soon",
              "Hot near Green St",
              "Student-only",
            ].map((label) => (
              <Badge
                key={label}
                variant="outline"
                className="border-pu-amber/35 bg-black/55 px-2.5 py-1 text-[10px] font-black uppercase tracking-wide text-pu-amber"
              >
                {label}
              </Badge>
            ))}
          </motion.div>
        </motion.header>

        <section
          aria-labelledby="hot-deals-heading"
          className="mt-7 space-y-3"
        >
          <div className="flex items-center gap-2">
            <motion.span
              animate={{ scale: [1, 1.06, 1] }}
              transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut" }}
            >
              <Flame className="size-6 text-pu-amber drop-shadow-[0_0_14px_oklch(0.82_0.17_72/0.45)]" />
            </motion.span>
            <h2 id="hot-deals-heading" className="pu-section-title-lg">
              Hot · ending soon
            </h2>
          </div>
          <p className="pu-meta-strong -mt-0.5 text-pu-magenta/90">
            The fastest-moving drops — grab before the window shuts.
          </p>

          {urgentDeals.length === 0 ? (
            <EmptyFilter />
          ) : (
            <ul className="pu-feed-stack">
              {urgentDeals.map((deal, i) => (
                <li key={deal.id}>
                  <DealCard
                    deal={deal}
                    layout="feed"
                    index={i}
                    featured={i === 0}
                  />
                </li>
              ))}
            </ul>
          )}
        </section>

        <section aria-labelledby="filter-heading" className="mt-7 space-y-3">
          <h2 id="filter-heading" className="sr-only">
            Filter by lane
          </h2>
          <div className="flex items-center gap-2">
            <Zap className="size-5 text-pu-amber" />
            <p className="font-heading text-lg font-extrabold tracking-tight text-white">
              Pick a lane
            </p>
          </div>

          <div className="-mx-1 flex flex-wrap gap-2 px-1">
            <motion.button
              type="button"
              whileTap={{ scale: 0.97 }}
              onClick={() => setChip(null)}
              className={cn(
                "rounded-full border px-3.5 py-2 text-[11px] font-black uppercase tracking-wide transition-colors",
                chip === null
                  ? "border-pu-magenta/55 bg-pu-magenta-dim/30 text-white shadow-[0_0_18px_-8px_oklch(0.7_0.29_328/0.45)]"
                  : "border-pu-border bg-black/45 text-white/65 hover:border-white/25 hover:text-white/88"
              )}
            >
              All moves
            </motion.button>
            {DEAL_FILTER_OPTIONS.map(({ id, label }) => (
              <motion.button
                key={id}
                type="button"
                whileTap={{ scale: 0.97 }}
                onClick={() => setChip(id)}
                className={cn(
                  "rounded-full border px-3.5 py-2 text-[11px] font-black uppercase tracking-wide transition-colors",
                  chip === id
                    ? "border-pu-magenta/55 bg-pu-magenta-dim/30 text-white shadow-[0_0_18px_-8px_oklch(0.7_0.29_328/0.45)]"
                    : "border-pu-border bg-black/45 text-white/65 hover:border-white/25 hover:text-white/88"
                )}
              >
                {label}
              </motion.button>
            ))}
          </div>
        </section>

        <section
          aria-labelledby="all-drops-heading"
          className="mt-7 space-y-3"
        >
          <h2 id="all-drops-heading" className="pu-section-title">
            More drops
          </h2>

          {laterDeals.length === 0 ? null : (
            <ul className="pu-feed-stack">
              {laterDeals.map((deal, i) => (
                <li key={deal.id}>
                  <DealCard
                    deal={deal}
                    layout="feed"
                    index={urgentDeals.length + i}
                  />
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}

function EmptyFilter() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-[1.25rem] border border-dashed border-pu-magenta/30 bg-black/35 px-5 py-10 text-center"
    >
      <p className="font-heading text-lg font-black leading-snug tracking-tight text-white">
        No drops here yet.{" "}
        <span className="text-white/55">
          Check another lane.
        </span>
      </p>
    </motion.div>
  );
}
