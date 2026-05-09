import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { PostPortal } from "@/components/portal/post-portal";
import { getAuthedProfileOrFallback } from "@/lib/supabase/auth-server";

export const metadata: Metadata = {
  title: "Portal",
  description:
    "Role-aware host, business, and admin portal for Pull Up.",
};

export default async function SubmitPage() {
  const { profile, hasProfile } = await getAuthedProfileOrFallback("/submit");
  if (hasProfile && !profile.onboardingComplete) {
    redirect("/onboarding");
  }
  return (
    <PostPortal
      forcedRole={profile.role}
      forcedRequestedRole={profile.requestedRole}
      forcedVerificationStatus={profile.verificationStatus}
    />
  );
}
