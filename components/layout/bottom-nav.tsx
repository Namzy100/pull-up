"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Flame, MapPinned, PlusCircle, Tag, UserRound } from "lucide-react";
import { motion } from "framer-motion";

import { AdminBottomNav } from "@/components/layout/admin-bottom-nav";
import { hasSupabaseEnv } from "@/lib/supabase/env";
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
  const authReady = useAppStore((s) => s.authReady);
  const authUserId = useAppStore((s) => s.authUserId);
  const envConfigured = hasSupabaseEnv();
  const showAuthGate = envConfigured && authReady && authUserId == null;

  if (pathname.startsWith("/admin")) {
    return <AdminBottomNav />;
  }

  if (pathname.startsWith("/onboarding")) {
    return null;
  }

  const meHref = showAuthGate
    ? "/login?next=%2Fprofile"
    : role === "admin"
      ? "/admin"
      : "/profile";
  const submitHref = showAuthGate ? "/login?next=%2Fsubmit" : "/submit";

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50 border-t border-white/[0.06] bg-zinc-950/96 pb-[max(0.625rem,env(safe-area-inset-bottom))] pt-1 shadow-[0_-8px_28px_-24px_rgba(0,0,0,0.9)] backdrop-blur-md supports-[backdrop-filter]:bg-zinc-950/88"
      aria-label="Primary"
    >
      <div className="mx-auto flex max-w-lg items-stretch justify-around px-[max(0.375rem,env(safe-area-inset-left))] pr-[max(0.375rem,env(safe-area-inset-right))]">
        {links.map(({ href, label, icon: Icon }) => {
          const resolvedHref =
            href === "/profile" ? meHref : href === "/submit" ? submitHref : href;
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
                "relative flex min-h-[3.35rem] min-w-0 flex-1 flex-col items-center justify-end gap-1 pb-2 text-[10px] font-medium tracking-tight transition-colors active:opacity-90 sm:text-[11px]",
                active ? "text-white" : "text-white/52 hover:text-white/85"
              )}
            >
              {active && (
                <motion.span
                  layoutId="bottom-nav-pill"
                  className="absolute inset-x-2 top-1 h-[2.65rem] rounded-2xl bg-white/[0.05]"
                  transition={{ type: "spring", stiffness: 420, damping: 34 }}
                />
              )}
              <span className="relative z-10 flex min-w-0 flex-col items-center gap-1">
                <Icon
                  className={cn(
                    "size-[1.35rem] shrink-0",
                    active ? "text-white" : "text-white/50"
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
