import type { DealFilterId, PuDeal } from "@/lib/types";

export const DEAL_FILTER_OPTIONS: readonly {
  id: DealFilterId;
  label: string;
}[] = [
  { id: "food", label: "Food" },
  { id: "bars", label: "Bars" },
  { id: "coffee", label: "Coffee" },
  { id: "late_night", label: "Late Night" },
  { id: "student_discount", label: "Student Discount" },
  { id: "free_stuff", label: "Free Stuff" },
  { id: "local_business", label: "Local Business" },
] as const;

export const MOCK_DEALS: PuDeal[] = [
  {
    id: "deal-uiuc-001",
    venueId: "venue-joes-brewery",
    title: "Late slice + tall boy",
    venueLabel: "Joe's Brewery",
    area: "Campustown",
    perk: "2 slices + tall boy",
    windowLabel: "Tonight · til 1am",
    urgencyLabel: "Line building",
    imageUrl:
      "https://images.unsplash.com/photo-1513104890138-7c749960a6fc?w=800&q=80",
    imageAlt: "Pizza slice",
    categoryLabel: "Food",
    filterTags: ["food", "late_night", "bars"],
    urgencyScore: 88,
    savesCount: 1520,
    claimsLastHour: 84,
    watchingCount: 2100,
    validUntil: "2026-05-11",
  },
  {
    id: "deal-uiuc-002",
    venueId: "venue-canvas",
    title: "$5 cover before 10",
    venueLabel: "CANVAS",
    area: "Downtown Champaign",
    perk: "Skip the price jump",
    windowLabel: "Doors · til 10pm",
    urgencyLabel: "Ends soon",
    imageUrl:
      "https://images.unsplash.com/photo-1571266028243-ea3d460b1c4b?w=800&q=80",
    imageAlt: "Nightclub lights",
    categoryLabel: "Bars",
    filterTags: ["bars", "late_night"],
    urgencyScore: 96,
    savesCount: 2410,
    claimsLastHour: 132,
    watchingCount: 4800,
  },
  {
    id: "deal-uiuc-003",
    venueId: "venue-kams",
    title: "KAM's pitcher night",
    venueLabel: "KAM's",
    area: "Green St",
    perk: "$15 pitchers · big tables",
    windowLabel: "Tonight only",
    urgencyLabel: "Hot near Green St",
    imageUrl:
      "https://images.unsplash.com/photo-1558642452-9d2a7deb7f62?w=800&q=80",
    imageAlt: "Beer on bar",
    categoryLabel: "Bars",
    filterTags: ["bars", "late_night", "student_discount"],
    urgencyScore: 91,
    savesCount: 3100,
    claimsLastHour: 176,
    watchingCount: 6200,
    studentOnly: true,
  },
  {
    id: "deal-uiuc-004",
    venueId: "venue-quad-vendor",
    title: "Quad pop-up churros",
    venueLabel: "Main Quad vendor",
    area: "Campus",
    perk: "Buy 2 get 1",
    windowLabel: "Til supplies last",
    urgencyLabel: "Almost gone",
    imageUrl:
      "https://images.unsplash.com/photo-1543339308-43e59d6b73a6?w=800&q=80",
    imageAlt: "Sweet pastry food truck",
    categoryLabel: "Food",
    filterTags: ["food", "local_business", "late_night"],
    urgencyScore: 94,
    savesCount: 890,
    claimsLastHour: 61,
    watchingCount: 1400,
  },
  {
    id: "deal-uiuc-005",
    venueId: "venue-caffe-bene",
    title: "Espresso slammer",
    venueLabel: "Caffe Bene",
    area: "Green St",
    perk: "$3 double · after 9pm",
    windowLabel: "Til midnight",
    urgencyLabel: "Student rush",
    imageUrl:
      "https://images.unsplash.com/photo-1495474478417-bef7d9292dee?w=800&q=80",
    imageAlt: "Coffee cup steam",
    categoryLabel: "Coffee",
    filterTags: ["coffee", "late_night", "student_discount"],
    urgencyScore: 72,
    savesCount: 640,
    claimsLastHour: 38,
    watchingCount: 920,
    studentOnly: true,
  },
  {
    id: "deal-uiuc-006",
    venueId: "venue-insomnia-cookies",
    title: "Insomnia cookie stack",
    venueLabel: "Insomnia Cookies",
    area: "Campustown",
    perk: "4 for $12 warm",
    windowLabel: "Tonight · til 3am",
    urgencyLabel: "Late night clutch",
    imageUrl:
      "https://images.unsplash.com/photo-1499636136210-6f4ee915583e?w=800&q=80",
    imageAlt: "Cookies on tray",
    categoryLabel: "Food",
    filterTags: ["food", "late_night"],
    urgencyScore: 86,
    savesCount: 1210,
    claimsLastHour: 95,
    watchingCount: 1800,
  },
  {
    id: "deal-uiuc-007",
    venueId: "venue-art-coop",
    title: "Found merch bin",
    venueLabel: "Art Coop",
    area: "Downtown Urbana",
    perk: "$10 vintage tees",
    windowLabel: "Weekend popup",
    urgencyLabel: "Low stock racks",
    imageUrl:
      "https://images.unsplash.com/photo-1562157873-818bc0746dba?w=800&q=80",
    imageAlt: "Vintage clothing rack",
    categoryLabel: "Local picks",
    filterTags: ["local_business", "student_discount"],
    urgencyScore: 58,
    savesCount: 410,
    claimsLastHour: 22,
    watchingCount: 680,
  },
  {
    id: "deal-uiuc-008",
    venueId: "venue-legends",
    title: "Free slice line",
    venueLabel: "Legends",
    area: "Green St",
    perk: "Free cheese slice · first 200",
    windowLabel: "11pm door drop",
    urgencyLabel: "Student-only · ID check",
    imageUrl:
      "https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=800&q=80",
    imageAlt: "Pizza in box",
    categoryLabel: "Free Stuff",
    filterTags: ["free_stuff", "food", "late_night", "student_discount"],
    urgencyScore: 99,
    savesCount: 4200,
    claimsLastHour: 240,
    watchingCount: 9100,
    studentOnly: true,
  },
];

export function getDealsMap(): Map<string, PuDeal> {
  return new Map(MOCK_DEALS.map((d) => [d.id, d]));
}

export function sortDealsByUrgency(deals: PuDeal[]): PuDeal[] {
  return [...deals].sort((a, b) => b.urgencyScore - a.urgencyScore);
}

export function filterDealsByChip(
  deals: PuDeal[],
  filter: DealFilterId | null
): PuDeal[] {
  if (filter === null) return deals;
  return deals.filter((d) => d.filterTags.includes(filter));
}
