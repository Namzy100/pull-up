import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { ProfilePageContent } from "@/components/profile/profile-page-content";
import { getOptionalSessionProfile } from "@/lib/supabase/auth-server";

export const metadata: Metadata = {
  title: "Profile",
  description: "Your Pull Up identity, saves, RSVPs, follows, and consent settings.",
};

export default async function ProfilePage() {
  const sessionProfile = await getOptionalSessionProfile();
  if (sessionProfile?.hasProfile && !sessionProfile.profile.onboardingComplete) {
    redirect("/onboarding");
  }
  return <ProfilePageContent />;
}
