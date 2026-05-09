"use client";

import { motion } from "framer-motion";

import { cn } from "@/lib/utils";
import type { MockUserRole } from "@/lib/types";

const ROLES: { id: MockUserRole; label: string; hint: string }[] = [
  { id: "regular_user", label: "User", hint: "Discover" },
  { id: "host", label: "Host", hint: "Events" },
  { id: "business", label: "Business", hint: "Deals" },
  { id: "admin", label: "Admin", hint: "Review" },
];

type PortalRoleSwitcherProps = {
  role: MockUserRole;
  onChange: (role: MockUserRole) => void;
};

export function PortalRoleSwitcher({ role, onChange }: PortalRoleSwitcherProps) {
  return (
    <div className="rounded-2xl border border-pu-border bg-pu-surface-deep/80 p-1.5 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]">
      <div className="grid grid-cols-4 gap-1">
        {ROLES.map((r) => {
          const active = role === r.id;
          return (
            <button
              key={r.id}
              type="button"
              onClick={() => onChange(r.id)}
              aria-pressed={active}
              className={cn(
                "relative flex flex-col items-center gap-0.5 rounded-xl px-1.5 py-2.5 text-center transition active:scale-[0.98]",
                active
                  ? "text-white"
                  : "text-white/50 hover:text-white/85"
              )}
            >
              {active ? (
                <motion.span
                  layoutId="portal-role-pill"
                  className="absolute inset-0 rounded-xl bg-gradient-to-br from-pu-magenta/45 to-pu-amber/20 ring-1 ring-white/12"
                  transition={{ type: "spring", stiffness: 400, damping: 34 }}
                />
              ) : null}
              <span className="relative z-10 text-[11px] font-black uppercase tracking-wide">
                {r.label}
              </span>
              <span className="relative z-10 text-[9px] font-semibold uppercase tracking-wider text-white/42">
                {r.hint}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
