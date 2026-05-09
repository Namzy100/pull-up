import type {
  PendingBusinessDealSubmission,
  PendingHostEventSubmission,
} from "@/lib/portal-types";

/** Seeded queue so Admin isn’t empty on first load */
export const INITIAL_PENDING_HOST_EVENTS: PendingHostEventSubmission[] = [
  {
    id: "seed-host-1",
    submittedAt: "2026-05-08T14:20:00-05:00",
    status: "pending",
    title: "Courtyard DJ set — Acacia",
    category: "student_org",
    categoryLabel: "Student org",
    date: "2026-05-09",
    startTime: "20:00",
    endTime: "23:30",
    area: "ISR",
    venue: "Acacia RSO",
    coverDollars: null,
    entryType: "free",
    stagRule: "Open",
    ageRestriction: "18+",
    vibeMusic: "Open format / sing-alongs",
    description: "Courtyard setup, limited capacity. Flyer attached.",
    imageUrl:
      "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=800&q=80",
    externalUrl: "",
  },
];

export const INITIAL_PENDING_BUSINESS_DEALS: PendingBusinessDealSubmission[] = [
  {
    id: "seed-biz-1",
    submittedAt: "2026-05-08T16:05:00-05:00",
    status: "pending",
    businessName: "Slice Co Campustown",
    dealTitle: "$7 lunch combo",
    categoryLabel: "Food",
    categoryTag: "food",
    perk: "2 slices + fountain drink",
    validFrom: "2026-05-09",
    validUntil: "2026-05-11",
    area: "Green St",
    studentOnly: true,
    description: "Show student ID at counter.",
    imageUrl:
      "https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=800&q=80",
    externalUrl: "",
  },
];
