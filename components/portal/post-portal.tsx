"use client";

import { motion, AnimatePresence } from "framer-motion";

import { PortalAdminDashboard } from "@/components/portal/portal-admin-dashboard";
import { PortalBusinessForm } from "@/components/portal/portal-business-form";
import { PortalHostForm } from "@/components/portal/portal-host-form";
import { PortalRegularUser } from "@/components/portal/portal-regular-user";
import { PortalRoleSwitcher } from "@/components/portal/portal-role-switcher";
import type { MockUserRole, RequestedRole, VerificationStatus } from "@/lib/types";
import { useAppStore } from "@/store/use-app-store";

type PostPortalProps = {
  forcedRole?: MockUserRole;
  forcedRequestedRole?: RequestedRole;
  forcedVerificationStatus?: VerificationStatus;
};

export function PostPortal({
  forcedRole,
  forcedRequestedRole,
  forcedVerificationStatus,
}: PostPortalProps) {
  const role = useAppStore((s) => s.mockUserRole);
  const profile = useAppStore((s) => s.mockProfile);
  const setRole = useAppStore((s) => s.setMockUserRole);
  const effectiveRole = forcedRole ?? role;
  const requestedRole = forcedRequestedRole ?? profile.requestedRole;
  const verificationStatus = forcedVerificationStatus ?? profile.verificationStatus;
  const showPending =
    effectiveRole === "regular_user" &&
    requestedRole !== "none" &&
    verificationStatus === "pending";

  return (
    <div className="pu-screen pb-4 pt-8 sm:pt-10">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-[360px] bg-[radial-gradient(ellipse_85%_55%_at_50%_-12%,oklch(0.55_0.22_328/0.2),transparent_58%)]" />

      <div className="relative mx-auto w-full max-w-lg space-y-6 px-4">
        <header className="space-y-3">
          <p className="pu-eyebrow">Post · Pull Up</p>
          <h1 className="pu-display text-[2.1rem] sm:text-[2.45rem]">Portal</h1>
          <p className="pu-meta max-w-[22rem] leading-relaxed">
            {forcedRole
              ? "Role access is now session-based. Portal actions write to Supabase tables."
              : "Switch roles to preview the experience. Everything is mock-local until auth and Supabase ship."}
          </p>
        </header>

        {!forcedRole ? <PortalRoleSwitcher role={role} onChange={setRole} /> : null}

        <AnimatePresence mode="wait">
          <motion.div
            key={effectiveRole}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
          >
            {effectiveRole === "regular_user" && !showPending ? <PortalRegularUser /> : null}
            {showPending ? (
              <PendingReviewCard requestedRole={requestedRole} />
            ) : null}
            {effectiveRole === "host" ? <HostDashboard /> : null}
            {effectiveRole === "business" ? <BusinessDashboard /> : null}
            {effectiveRole === "admin" ? <PortalAdminDashboard /> : null}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}

function PendingReviewCard({ requestedRole }: { requestedRole: RequestedRole }) {
  const label = requestedRole === "business" ? "business" : "host";
  return (
    <div className="mb-4 rounded-2xl border border-pu-amber/35 bg-black/45 p-4 text-sm font-semibold text-white/80">
      Your account is under review. Verification keeps the pulse trusted.
      <div className="mt-1 text-pu-amber">Requested: {label} access.</div>
    </div>
  );
}

function BusinessDashboard() {
  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-pu-border bg-black/35 p-4">
        <p className="text-sm font-semibold text-white/75">Business Dashboard</p>
        <p className="pu-meta mt-1">
          Approved businesses can post deals/events and track campus engagement.
        </p>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <Metric label="Views" value="12.4k" />
        <Metric label="Saves" value="1.9k" />
        <Metric label="Pull-ups" value="620" />
        <Metric label="Claims" value="413" />
        <Metric label="RSVPs" value="287" />
        <Metric label="Conversion" value="8.2%" />
      </div>
      <div className="rounded-2xl border border-pu-border bg-black/35 p-4 text-xs font-semibold text-white/70">
        Suggested actions: Drop a limited-time deal · Boost earlier in the night · Add clearer cover/entry info · Post before Thursday 6 PM.
      </div>
      <PortalBusinessForm />
    </div>
  );
}

function HostDashboard() {
  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-pu-border bg-black/35 p-4">
        <p className="text-sm font-semibold text-white/75">Host Dashboard</p>
        <p className="pu-meta mt-1">
          Approved hosts can submit events and monitor saves, RSVPs, and pull-ups.
        </p>
      </div>
      <div className="grid grid-cols-3 gap-2">
        <Metric label="Saves" value="1.2k" />
        <Metric label="RSVPs" value="420" />
        <Metric label="Pull-ups" value="188" />
      </div>
      <PortalHostForm />
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-pu-border bg-black/35 px-3 py-2">
      <p className="text-[10px] font-black uppercase tracking-wide text-white/50">{label}</p>
      <p className="mt-1 text-lg font-extrabold text-white">{value}</p>
    </div>
  );
}
