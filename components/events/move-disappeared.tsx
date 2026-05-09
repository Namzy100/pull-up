"use client";

import Link from "next/link";
import { motion } from "framer-motion";

export function MoveDisappeared() {
  return (
    <div className="pu-screen flex flex-col items-center justify-center px-6">
      <div className="pointer-events-none absolute inset-x-0 top-1/4 h-64 bg-[radial-gradient(ellipse_at_center,oklch(0.55_0.22_328/0.16),transparent_65%)]" />
      <motion.div
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
        className="relative max-w-sm rounded-[1.35rem] border border-pu-border bg-gradient-to-b from-pu-surface to-black px-8 py-11 text-center shadow-[0_0_44px_-16px_oklch(0.7_0.29_328/0.3)]"
      >
        <p className="font-heading text-2xl font-extrabold tracking-tight text-white">
          Move disappeared.
        </p>
        <p className="pu-meta mt-4 text-[0.875rem] leading-relaxed">
          That link isn&apos;t pulling up tonight. Hit the Tonight feed before the
          crowd shifts again.
        </p>
        <Link
          href="/"
          className="mt-8 inline-flex w-full items-center justify-center rounded-xl border border-pu-magenta/45 bg-gradient-to-r from-pu-magenta/35 to-pu-amber/22 px-6 py-3.5 text-sm font-black uppercase tracking-[0.1em] text-white transition hover:border-pu-magenta/60 active:scale-[0.99]"
        >
          Tonight feed
        </Link>
      </motion.div>
    </div>
  );
}
