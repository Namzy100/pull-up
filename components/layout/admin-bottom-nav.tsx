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
      className="fixed bottom-0 left-0 right-0 z-50 border-t border-zinc-800 bg-zinc-950/95 pb-[max(0.5rem,env(safe-area-inset-bottom))] pt-1 backdrop-blur-xl supports-[backdrop-filter]:bg-zinc-950/90"
      aria-label="Admin"
    >
      <div className="mx-auto flex max-w-lg items-stretch justify-around px-0.5">
        {links.map(({ href, label, icon: Icon, match }) => {
          const active = match(pathname);
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "relative flex min-h-[3.25rem] flex-1 flex-col items-center justify-end gap-0.5 pb-1.5 text-[9px] font-semibold uppercase tracking-tight text-zinc-500 transition-colors active:opacity-90 sm:text-[10px]",
                active && "text-zinc-100"
              )}
            >
              {active && (
                <motion.span
                  layoutId="admin-nav-pill"
                  className="absolute inset-x-1 top-1 h-9 rounded-lg bg-zinc-800 ring-1 ring-zinc-700/80"
                  transition={{ type: "spring", stiffness: 420, damping: 34 }}
                />
              )}
              <span className="relative z-10 flex flex-col items-center gap-0.5">
                <Icon className={cn("size-[1.25rem]", active && "text-zinc-200")} aria-hidden />
                {label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
