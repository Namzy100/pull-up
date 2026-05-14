"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BarChart3,
  Gavel,
  LayoutGrid,
  Tag,
  Users,
} from "lucide-react";
import { motion } from "framer-motion";

import { cn } from "@/lib/utils";

const links = [
  {
    href: "/admin",
    label: "Moderation",
    icon: Gavel,
    match: (p: string) => p === "/admin" || p === "/admin/moderation",
  },
  { href: "/admin/events", label: "Events", icon: LayoutGrid, match: (p: string) => p.startsWith("/admin/events") },
  { href: "/admin/deals", label: "Deals", icon: Tag, match: (p: string) => p.startsWith("/admin/deals") },
  { href: "/admin/users", label: "Users", icon: Users, match: (p: string) => p.startsWith("/admin/users") },
  { href: "/admin/tools", label: "Tools", icon: BarChart3, match: (p: string) => p.startsWith("/admin/tools") },
] as const;

export function AdminBottomNav() {
  const pathname = usePathname();

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50 border-t border-zinc-800/90 bg-zinc-950/96 pb-[max(0.625rem,env(safe-area-inset-bottom))] pt-1.5 shadow-[0_-8px_32px_-20px_rgba(0,0,0,0.75)] backdrop-blur-xl supports-[backdrop-filter]:bg-zinc-950/92"
      aria-label="Admin"
    >
      <div className="mx-auto flex max-w-lg items-stretch justify-around px-[max(0.25rem,env(safe-area-inset-left))] pr-[max(0.25rem,env(safe-area-inset-right))]">
        {links.map(({ href, label, icon: Icon, match }) => {
          const active = match(pathname);
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "relative flex min-h-[3.5rem] min-w-0 flex-1 flex-col items-center justify-end gap-1 pb-2 text-[9px] font-semibold uppercase tracking-tight text-zinc-500 transition-colors active:opacity-90 sm:text-[10px]",
                active && "text-zinc-100"
              )}
            >
              {active && (
                <motion.span
                  layoutId="admin-nav-pill"
                  className="absolute inset-x-0.5 top-0.5 h-[2.75rem] rounded-xl bg-zinc-800/95 ring-1 ring-zinc-700/60"
                  transition={{ type: "spring", stiffness: 420, damping: 34 }}
                />
              )}
              <span className="relative z-10 flex min-w-0 flex-col items-center gap-1">
                <Icon className={cn("size-[1.3rem] shrink-0", active && "text-zinc-100")} aria-hidden />
                {label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
