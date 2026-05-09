import type { MockProfileSession, MockUserRole } from "@/lib/types";

/** Default local identity — swap for `session.user` post-auth */
export const DEFAULT_MOCK_PROFILE: MockProfileSession = {
  username: "nightshift_uiuc",
  fullName: "Avery Carter",
  campus: "University of Illinois · Urbana-Champaign",
  avatarUrl:
    "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&q=80",
  role: "regular_user",
  requestedRole: "none",
  verificationStatus: "none",
  businessName: "",
  businessType: "",
  businessWebsite: "",
  businessContact: "",
  organizationName: "",
  organizationType: "",
  verificationNotes: "",
  memberSince: "2025-08-12T00:00:00.000Z",
  onboardingComplete: false,
  interests: ["frat_party", "bar_club", "deals"],
  consentAnalytics: false,
  consentPersonalization: false,
  consentLocation: false,
  consentMarketing: false,
};

export function mockRoleLabel(role: MockUserRole): string {
  switch (role) {
    case "regular_user":
      return "Explorer";
    case "host":
      return "Verified host";
    case "business":
      return "Local business";
    case "admin":
      return "Admin";
  }
}
