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
      className="fixed bottom-0 left-0 right-0 z-50 border-t border-white/10 bg-zinc-950/92 pb-[max(0.5rem,env(safe-area-inset-bottom))] pt-1 backdrop-blur-xl supports-[backdrop-filter]:bg-zinc-950/78"
      aria-label="Primary"
    >
      <div className="mx-auto flex max-w-lg items-stretch justify-around px-1.5">
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
                "relative flex min-h-[3.25rem] flex-1 flex-col items-center justify-end gap-0.5 pb-1.5 text-[10px] font-semibold tracking-tight transition-colors active:opacity-90 sm:text-xs",
                active ? "text-white" : "text-muted-foreground hover:text-white/90"
              )}
            >
              {active && (
                <motion.span
                  layoutId="bottom-nav-pill"
                  className="absolute inset-x-2 top-1 h-10 rounded-2xl bg-gradient-to-r from-pu-magenta/40 to-pu-amber/22 ring-1 ring-white/12"
                  transition={{ type: "spring", stiffness: 420, damping: 34 }}
                />
              )}
              <span className="relative z-10 flex flex-col items-center gap-0.5">
                <Icon
                  className={cn(
                    "size-[1.375rem]",
                    active &&
                      "text-pu-magenta drop-shadow-[0_0_14px_oklch(0.7_0.29_328/0.45)]"
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
