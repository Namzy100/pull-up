import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";

import { AdminOperatorSubmitPage } from "@/components/portal/admin-operator-submit";
import { PostPortal } from "@/components/portal/post-portal";
import { Button } from "@/components/ui/button";
import { hasSupabaseEnv } from "@/lib/supabase/env";
import { requireAuth } from "@/lib/supabase/auth-server";
import { getProfileById, profileRowToMockSession } from "@/lib/supabase/repositories";
import { LOGGED_OUT_PROFILE } from "@/lib/mock-profile";
import type { MockUserRole } from "@/lib/types";

export const metadata: Metadata = {
  title: "Submit",
  description: "Post moves, request host or business access, and manage your Pull Up portal.",
};

type SubmitSearchParams = Promise<{ previewAs?: string }>;

function parsePreviewAsRole(raw: string | undefined): Extract<MockUserRole, "host" | "business"> | null {
  if (raw === "host" || raw === "business") return raw;
  return null;
}

export default async function SubmitPage({ searchParams }: { searchParams: SubmitSearchParams }) {
  const { previewAs } = await searchParams;

  if (!hasSupabaseEnv()) {
    return (
      <div className="pu-screen flex flex-col items-center justify-center gap-4 px-6 py-16 text-center">
        <p className="font-heading text-lg font-bold text-white">Supabase is not configured</p>
        <p className="pu-meta max-w-sm">
          Connect your project to use Submit, auth, and persistence. Public pages still work for
          layout review.
        </p>
        <Button asChild variant="outline" className="border-white/15">
          <Link href="/">Back home</Link>
        </Button>
      </div>
    );
  }

  const auth = await requireAuth("/submit");
  if (!auth.supabase || !auth.user) {
    redirect("/login?next=%2Fsubmit");
  }
  const { supabase, user } = auth;

  const profileRow = await getProfileById(supabase, user.id);
  const profile = profileRow
    ? profileRowToMockSession(profileRow)
    : {
        ...LOGGED_OUT_PROFILE,
        username: user.email?.split("@")[0] ?? "",
        memberSince: new Date().toISOString(),
      };
  const hasProfile = Boolean(profileRow);

  if (hasProfile && !profile.onboardingComplete) {
    redirect("/onboarding");
  }
  const previewRole = profile.role === "admin" ? parsePreviewAsRole(previewAs) : null;
  if (profile.role === "admin" && !previewRole) {
    return <AdminOperatorSubmitPage />;
  }
  return (
    <PostPortal
      forcedRole={previewRole ?? profile.role}
      forcedRequestedRole={previewRole ? "none" : profile.requestedRole}
      forcedVerificationStatus={previewRole ? "approved" : profile.verificationStatus}
      previewSurface={Boolean(previewRole)}
    />
  );
}
