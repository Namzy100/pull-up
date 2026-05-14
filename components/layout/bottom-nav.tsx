"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Flame, MapPinned, PlusCircle, Tag, UserRound } from "lucide-react";
import { motion } from "framer-motion";

import { AdminBottomNav } from "@/components/layout/admin-bottom-nav";
import { useAppStore } from "@/store/use-app-store";
import { cn } from "@/lib/utils";

const links = [
  { href: "/", label: "Tonight", icon: Flame },
  { href: "/map", label: "Map", icon: MapPinned },
  { href: "/deals", label: "Deals", icon: Tag },
  { href: "/submit", label: "Post", icon: PlusCircle },
  { href: "/profile", label: "Me", icon: UserRound },
] as const;

export function BottomNav() {
  const pathname = usePathname();
  const role = useAppStore((s) => s.mockUserRole);

  if (pathname.startsWith("/admin")) {
    return <AdminBottomNav />;
  }

  const meHref = role === "admin" ? "/admin" : "/profile";

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50 border-t border-white/[0.08] bg-zinc-950/94 pb-[max(0.625rem,env(safe-area-inset-bottom))] pt-1.5 shadow-[0_-12px_40px_-28px_rgba(0,0,0,0.85)] backdrop-blur-xl supports-[backdrop-filter]:bg-zinc-950/82"
      aria-label="Primary"
    >
      <div className="mx-auto flex max-w-lg items-stretch justify-around px-[max(0.375rem,env(safe-area-inset-left))] pr-[max(0.375rem,env(safe-area-inset-right))]">
        {links.map(({ href, label, icon: Icon }) => {
          const resolvedHref = href === "/profile" ? meHref : href;
          const active =
            resolvedHref === "/"
              ? pathname === "/"
              : resolvedHref === "/admin"
                ? pathname.startsWith("/admin")
                : resolvedHref === "/profile"
                  ? pathname === "/profile"
                  : pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={resolvedHref}
              className={cn(
                "relative flex min-h-[3.5rem] min-w-0 flex-1 flex-col items-center justify-end gap-1 pb-2 text-[10px] font-semibold tracking-tight transition-colors active:opacity-90 sm:text-[11px]",
                active ? "text-white" : "text-muted-foreground hover:text-white/90"
              )}
            >
              {active && (
                <motion.span
                  layoutId="bottom-nav-pill"
                  className="absolute inset-x-1.5 top-0.5 h-[2.875rem] rounded-2xl bg-gradient-to-r from-pu-magenta/18 to-pu-amber/12 ring-1 ring-white/[0.07]"
                  transition={{ type: "spring", stiffness: 420, damping: 34 }}
                />
              )}
              <span className="relative z-10 flex min-w-0 flex-col items-center gap-1">
                <Icon
                  className={cn(
                    "size-[1.4rem] shrink-0",
                    active ? "text-pu-magenta" : "text-white/55"
                  )}
                  aria-hidden
                />
                {href === "/profile" && role === "admin" ? "Ops" : label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
