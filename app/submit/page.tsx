import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { AdminOperatorSubmitPage } from "@/components/portal/admin-operator-submit";
import { PostPortal } from "@/components/portal/post-portal";
import { getAuthedProfileOrFallback } from "@/lib/supabase/auth-server";
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
  const { profile, hasProfile } = await getAuthedProfileOrFallback("/submit");
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
