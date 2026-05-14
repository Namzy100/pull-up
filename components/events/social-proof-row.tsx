"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Bookmark, Eye, TrendingUp, Zap } from "lucide-react";

import { cn } from "@/lib/utils";
import type { PuEvent } from "@/lib/types";
import { formatCompactCount } from "@/lib/event-utils";
import { hasSupabaseEnv } from "@/lib/supabase/env";

type SocialProofRowProps = {
  event: PuEvent;
  compact?: boolean;
  className?: string;
};

export function SocialProofRow({
  event,
  compact,
  className,
}: SocialProofRowProps) {
  const [pullUps, setPullUps] = useState(event.pullUpsLastHour);
  const simLive = !hasSupabaseEnv();

  useEffect(() => {
    if (!simLive) {
      const t = window.setTimeout(() => {
        setPullUps(event.pullUpsLastHour);
      }, 0);
      return () => window.clearTimeout(t);
    }
    const base = event.pullUpsLastHour;
    const id = window.setInterval(() => {
      setPullUps((n) => {
        const delta = Math.random() > 0.55 ? 1 : Math.random() > 0.35 ? 0 : -1;
        const next = n + delta;
        return Math.min(base + 18, Math.max(base - 6, next));
      });
    }, 3200 + Math.random() * 900);
    return () => window.clearInterval(id);
  }, [event.pullUpsLastHour, event.id, simLive]);

  const fill =
    event.fillPressurePct !== undefined ? Math.min(100, event.fillPressurePct) : null;

  const trending =
    event.campusTrendRank !== undefined && event.campusTrendRank <= 8;

  return (
    <div className={cn("space-y-2.5", className)}>
      <div
        className={cn(
          "flex flex-wrap items-center gap-2 rounded-xl border border-pu-border bg-pu-surface-deep/80 px-2.5 py-2 sm:px-3",
          compact && "gap-1.5 px-2 py-1.5"
        )}
      >
        <span
          className={cn(
            "inline-flex items-center gap-1.5 rounded-lg bg-pu-magenta/12 px-2 py-1 font-bold tabular-nums tracking-tight text-pu-magenta",
            compact ? "text-[10px]" : "text-[11px] sm:text-xs"
          )}
        >
          <Bookmark
            className="size-3.5 shrink-0 fill-pu-magenta/20 text-pu-magenta"
            aria-hidden
          />
          {formatCompactCount(event.savesCount)}
          {!compact && (
            <span className="font-semibold text-white/45">saves</span>
          )}
        </span>
        <span
          className={cn(
            "inline-flex items-center gap-1.5 rounded-lg bg-white/[0.06] px-2 py-1 font-bold tabular-nums tracking-tight text-white/88",
            compact ? "text-[10px]" : "text-[11px] sm:text-xs"
          )}
        >
          <Eye className="size-3.5 shrink-0 text-pu-amber" aria-hidden />
          {formatCompactCount(event.spottingCount)}
          {!compact && (
            <span className="font-semibold text-white/45">watching</span>
          )}
        </span>
        <motion.span
          className={cn(
            "inline-flex items-center gap-1.5 rounded-lg bg-pu-amber/12 px-2 py-1 font-bold tabular-nums tracking-tight text-pu-amber",
            compact ? "text-[10px]" : "text-[11px] sm:text-xs"
          )}
          key={pullUps}
          initial={{ opacity: 0.75, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ type: "spring", stiffness: 520, damping: 30 }}
        >
          <motion.span
            animate={{ rotate: [0, -8, 6, 0] }}
            transition={{
              duration: 2.8,
              repeat: Infinity,
              ease: "easeInOut",
              repeatDelay: 1.2,
            }}
          >
            <Zap
              className="size-3.5 shrink-0 fill-pu-amber/25 text-pu-amber"
              aria-hidden
            />
          </motion.span>
          {pullUps}/hr
        </motion.span>
        {trending && !compact ? (
          <motion.span
            className="ml-auto inline-flex items-center gap-1 rounded-lg border border-pu-amber/35 bg-pu-amber/10 px-2 py-1 text-[10px] font-extrabold uppercase tracking-wide text-pu-amber"
            animate={{
              boxShadow: [
                "0 0 0 0 oklch(0.82 0.17 72 / 0)",
                "0 0 14px -2px oklch(0.82 0.17 72 / 0.35)",
                "0 0 0 0 oklch(0.82 0.17 72 / 0)",
              ],
            }}
            transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut" }}
          >
            <TrendingUp className="size-3 shrink-0" aria-hidden />
            #{event.campusTrendRank} campus
          </motion.span>
        ) : trending && compact ? (
          <span className="inline-flex items-center gap-0.5 rounded-md border border-pu-amber/30 bg-pu-amber/10 px-1.5 py-0.5 text-[9px] font-extrabold uppercase tracking-wide text-pu-amber">
            <TrendingUp className="size-2.5 shrink-0" aria-hidden />#
            {event.campusTrendRank}
          </span>
        ) : null}
      </div>

      {fill !== null && fill >= 45 && !compact && (
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-[0.12em] text-white/50">
            <span>Filling fast</span>
            <span className="tabular-nums text-pu-urgent-glow">{fill}%</span>
          </div>
          <div className="h-1.5 overflow-hidden rounded-full bg-black/50 ring-1 ring-white/8">
            <motion.div
              className="h-full rounded-full bg-gradient-to-r from-pu-magenta via-pu-amber to-pu-urgent"
              initial={{ width: `${Math.max(8, fill - 6)}%` }}
              animate={{
                width: [`${fill}%`, `${Math.min(100, fill + 3)}%`, `${fill}%`],
              }}
              transition={{
                duration: 4.2,
                repeat: Infinity,
                ease: "easeInOut",
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
}
