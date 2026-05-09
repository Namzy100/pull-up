"use client";

import { motion } from "framer-motion";

/** Soft moving light — reads “system awake”, not decoration clutter */
export function LiveAmbient() {
  return (
    <>
      <motion.div
        className="pointer-events-none absolute -left-32 top-0 size-[min(100vw,520px)] rounded-full bg-pu-magenta/22 blur-[100px]"
        animate={{
          opacity: [0.1, 0.2, 0.12],
          x: [0, 20, -6, 0],
          scale: [1, 1.04, 1],
        }}
        transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        className="pointer-events-none absolute -right-36 top-[28%] size-[min(90vw,440px)] rounded-full bg-pu-amber/14 blur-[90px]"
        animate={{
          opacity: [0.08, 0.16, 0.1],
          x: [0, -16, 10, 0],
          scale: [1.02, 1, 1.04],
        }}
        transition={{
          duration: 14,
          repeat: Infinity,
          ease: "easeInOut",
          delay: 0.8,
        }}
      />
      <motion.div
        className="pointer-events-none absolute bottom-[18%] left-1/2 size-[min(120vw,680px)] -translate-x-1/2 rounded-full bg-pu-magenta-dim/10 blur-[110px]"
        animate={{ opacity: [0.05, 0.11, 0.07], scale: [1, 1.03, 1] }}
        transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
      />
    </>
  );
}
