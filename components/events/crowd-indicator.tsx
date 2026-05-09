"use client";

import { motion } from "framer-motion";

import { cn } from "@/lib/utils";
import type { CrowdStatus } from "@/lib/types";
import { crowdBarIntensity, crowdLabel, crowdTone } from "@/lib/event-utils";

type CrowdIndicatorProps = {
  status: CrowdStatus;
  className?: string;
  compact?: boolean;
};

export function CrowdIndicator({
  status,
  className,
  compact,
}: CrowdIndicatorProps) {
  const intensity = crowdBarIntensity(status);
  const heights = [0.35, 0.62, 0.88].map((h) => Math.min(1, h * intensity + 0.12));
  const pulse =
    status === "packed" ||
    status === "line_forming" ||
    status === "active";

  return (
    <div
      className={cn(
        "flex items-center gap-2 rounded-full border border-pu-border bg-pu-surface/95 px-2.5 py-1 shadow-[inset_0_1px_0_rgba(255,255,255,0.06)]",
        pulse &&
          "ring-1 ring-pu-magenta/15 shadow-[0_0_20px_-8px_oklch(0.7_0.29_328/0.25)]",
        compact && "px-2 py-0.5",
        className
      )}
      aria-label={`Crowd status: ${crowdLabel(status)}`}
    >
      <motion.div
        className="flex h-4 items-end gap-0.5"
        animate={pulse ? { x: [0, 1.5, -1.5, 0] } : {}}
        transition={{
          duration: 3.4,
          repeat: pulse ? Infinity : 0,
          ease: "easeInOut",
        }}
      >
        {heights.map((h, i) => (
          <motion.span
            key={i}
            className={cn(
              "w-1 origin-bottom rounded-full bg-gradient-to-t from-pu-magenta to-pu-amber",
              status === "chill" &&
                "from-pu-live-dim to-pu-live opacity-90",
              status === "warming_up" &&
                "from-pu-amber-dim to-pu-amber opacity-95"
            )}
            initial={{ scaleY: 0.25, opacity: 0.5 }}
            animate={
              pulse
                ? {
                    scaleY: [h * 0.55, h, h * 0.7],
                    opacity: [0.55, 1, 0.75],
                  }
                : { scaleY: h, opacity: 0.65 + intensity * 0.35 }
            }
            transition={{
              delay: i * 0.07,
              duration: pulse ? 0.85 : 0.45,
              repeat: pulse ? Infinity : 0,
              repeatType: "reverse",
              ease: "easeInOut",
            }}
            style={{ height: compact ? 12 : 14 }}
          />
        ))}
      </motion.div>
      <span
        className={cn(
          "font-medium tracking-tight",
          compact ? "text-[10px]" : "text-xs",
          crowdTone(status)
        )}
      >
        {crowdLabel(status)}
      </span>
    </div>
  );
}
