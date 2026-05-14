/** Chosen before auth account is created */
export type SignupAccountPath = "student" | "host" | "business";

export const ORG_TYPES = [
  "fraternity",
  "sorority",
  "student_org",
  "club",
  "promoter_group",
  "other",
] as const;
export type SignupOrgType = (typeof ORG_TYPES)[number];

export const BUSINESS_TYPES = [
  "bar",
  "restaurant",
  "cafe",
  "club",
  "retail",
  "gym",
  "service",
  "other",
] as const;
export type SignupBusinessType = (typeof BUSINESS_TYPES)[number];
