import { cn } from "@/lib/utils";

/** Discovery / student paths — pass-through so call sites can stay explicit. */
export function UserSurface({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  if (className) return <div className={className}>{children}</div>;
  return <>{children}</>;
}

/** Merchant / operator — structured, amber–performance accents, calmer than the feed. */
export function BusinessSurface({
  children,
  className,
  id,
}: {
  children: React.ReactNode;
  className?: string;
  id?: string;
}) {
  return (
    <div
      id={id}
      className={cn(
        "rounded-[1.35rem] border border-white/[0.07] bg-gradient-to-b from-zinc-900/95 via-zinc-950 to-black",
        "shadow-[inset_0_1px_0_0_rgba(255,255,255,0.04),0_0_40px_-20px_rgba(245,158,11,0.12)]",
        className
      )}
    >
      {children}
    </div>
  );
}

export function BusinessSubmitAmbient() {
  return (
    <div className="pointer-events-none absolute inset-x-0 top-0 h-[300px] bg-[radial-gradient(ellipse_82%_50%_at_50%_-8%,oklch(0.52_0.1_85/0.2),transparent_58%)]" />
  );
}

/** Org / event command — energetic but cleaner than Tonight. */
export function HostSurface({
  children,
  className,
  id,
}: {
  children: React.ReactNode;
  className?: string;
  id?: string;
}) {
  return (
    <div
      id={id}
      className={cn(
        "rounded-[1.35rem] border border-white/[0.08] bg-gradient-to-b from-zinc-900/92 via-zinc-950 to-black",
        "shadow-[inset_0_1px_0_0_rgba(255,255,255,0.04),0_0_44px_-18px_oklch(0.65_0.22_328/0.22)]",
        className
      )}
    >
      {children}
    </div>
  );
}

export function HostSubmitAmbient() {
  return (
    <div className="pointer-events-none absolute inset-x-0 top-0 h-[300px] bg-[radial-gradient(ellipse_80%_52%_at_50%_-10%,oklch(0.58_0.18_328/0.18),transparent_55%)]" />
  );
}

/** Trust & safety cockpit — minimal glow, sharp, operational. */
export function AdminSurface({
  children,
  className,
  id,
}: {
  children: React.ReactNode;
  className?: string;
  id?: string;
}) {
  return (
    <div
      id={id}
      className={cn(
        "rounded-xl border border-white/[0.09] bg-zinc-950/95",
        "shadow-[inset_0_1px_0_0_rgba(255,255,255,0.03)]",
        className
      )}
    >
      {children}
    </div>
  );
}

export function AdminPageAmbient() {
  return (
    <div className="pointer-events-none absolute inset-x-0 top-0 h-[280px] bg-[radial-gradient(ellipse_78%_45%_at_50%_-8%,oklch(0.35_0.04_250/0.35),transparent_60%)]" />
  );
}

export function BusinessSectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-amber-200/55">{children}</p>
  );
}

export function HostSectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-pu-magenta/70">{children}</p>
  );
}

export function AdminSectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-zinc-500">{children}</p>
  );
}
