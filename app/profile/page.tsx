import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { ProfilePageContent } from "@/components/profile/profile-page-content";
import { getOptionalSessionProfile } from "@/lib/supabase/auth-server";

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
