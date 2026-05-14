import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { ProfilePageContent } from "@/components/profile/profile-page-content";
import { getOptionalSessionProfile, getServerSessionUser } from "@/lib/supabase/auth-server";
import { hasSupabaseEnv } from "@/lib/supabase/env";

export const metadata: Metadata = {
  title: "Profile",
  description: "Your Pull Up identity, saves, RSVPs, follows, and consent settings.",
};

type ProfileSearchParams = Promise<{ preview?: string }>;

export default async function ProfilePage({
  searchParams,
}: {
  searchParams: ProfileSearchParams;
}) {
  const { preview } = await searchParams;
  if (hasSupabaseEnv()) {
    const { user } = await getServerSessionUser();
    if (!user) {
      redirect("/login?next=%2Fprofile");
    }
  }
  const sessionProfile = await getOptionalSessionProfile();
  if (sessionProfile?.hasProfile && !sessionProfile.profile.onboardingComplete) {
    redirect("/onboarding");
  }
  const consumerPreview = preview === "user";
  if (
    sessionProfile?.hasProfile &&
    sessionProfile.profile.role === "admin" &&
    !consumerPreview
  ) {
    redirect("/admin");
  }
  return <ProfilePageContent adminConsumerPreview={consumerPreview} />;
}
