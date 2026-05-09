"use client";

import { motion } from "framer-motion";

import { cn } from "@/lib/utils";

type UrgencyChipProps = {
  children: React.ReactNode;
  /** First chip in row gets the hottest glow pulse */
  emphasize?: boolean;
  className?: string;
};

export function UrgencyChip({
  children,
  emphasize,
  className,
}: UrgencyChipProps) {
  return (
    <motion.span
      className={cn(
        "relative inline-flex max-w-[100%] items-center overflow-hidden rounded-lg border border-pu-border bg-pu-surface-deep/90 px-2.5 py-1.5 text-[10px] font-extrabold uppercase tracking-[0.1em] text-white/92 shadow-[inset_0_1px_0_rgba(255,255,255,0.05)] sm:text-[11px]",
        emphasize &&
          "border-pu-magenta/50 bg-gradient-to-r from-pu-surface-deep via-pu-magenta-dim/35 to-pu-surface-deep text-white shadow-[0_0_22px_-6px_oklch(0.7_0.29_328/0.5)]",
        className
      )}
      animate={
        emphasize
          ? {
              boxShadow: [
                "0 0 16px -6px oklch(0.7 0.29 328 / 0.35)",
                "0 0 26px -4px oklch(0.82 0.17 72 / 0.4)",
                "0 0 16px -6px oklch(0.7 0.29 328 / 0.35)",
              ],
            }
          : {}
      }
      transition={{
        duration: 2.2,
        repeat: emphasize ? Infinity : 0,
        ease: "easeInOut",
      }}
    >
      <span
        className={cn(
          "absolute left-0 top-0 h-full w-[3px] rounded-l-md bg-gradient-to-b from-pu-magenta to-pu-amber",
          !emphasize && "opacity-50"
        )}
        aria-hidden
      />
      {emphasize && (
        <motion.span
          className="pointer-events-none absolute inset-0 bg-gradient-to-r from-transparent via-white/12 to-transparent"
          animate={{ x: ["-100%", "120%"] }}
          transition={{
            duration: 2.8,
            repeat: Infinity,
            ease: "linear",
            repeatDelay: 0.6,
          }}
          aria-hidden
        />
      )}
      <span className="relative pl-2">{children}</span>
    </motion.span>
  );
}
