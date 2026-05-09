import type { PuFollowableVenue } from "@/lib/types";

/**
 * Mock follow graph — venue IDs referenced by `PuEvent.venueId` / `PuDeal.venueId`.
 * Replace with Supabase `venues` + `follows` when auth ships.
 */
export const MOCK_FOLLOWABLE_VENUES: readonly PuFollowableVenue[] = [
  {
    id: "venue-phi-kappa-psi",
    name: "Phi Kappa Psi",
    kind: "frat_student_org",
    area: "Gregory Dr",
    tagline: "Greek row pulse",
    imageUrl:
      "https://images.unsplash.com/photo-1540039155733-5bb30b53aa14?w=200&q=80",
  },
  {
    id: "venue-joes-brewery",
    name: "Joe's Brewery",
    kind: "restaurant",
    area: "Campustown",
    tagline: "Slices · pours · patio",
    imageUrl:
      "https://images.unsplash.com/photo-1514933651103-005eec06c04b?w=200&q=80",
  },
  {
    id: "venue-kams",
    name: "KAM's",
    kind: "bar_club",
    area: "Green St",
    tagline: "Green St institution",
    imageUrl:
      "https://images.unsplash.com/photo-1461896836934-ffe607ba8211?w=200&q=80",
  },
  {
    id: "venue-isr-rooftop",
    name: "ISR Rooftop",
    kind: "frat_student_org",
    area: "ISR",
    tagline: "Student org sunsets",
    imageUrl:
      "https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=200&q=80",
  },
  {
    id: "venue-canvas",
    name: "CANVAS",
    kind: "bar_club",
    area: "Downtown Champaign",
    tagline: "Warehouse nights",
    imageUrl:
      "https://images.unsplash.com/photo-1571330735066-03aaa9429d89?w=200&q=80",
  },
  {
    id: "venue-main-quad-south",
    name: "Main Quad South",
    kind: "frat_student_org",
    area: "Main Quad",
    tagline: "Open-air campus energy",
    imageUrl:
      "https://images.unsplash.com/photo-1415201364774-f6f0bb35f28f?w=200&q=80",
  },
  {
    id: "venue-red-lion",
    name: "The Red Lion",
    kind: "bar_club",
    area: "Green St",
    tagline: "Karaoke chaos",
    imageUrl:
      "https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?w=200&q=80",
  },
  {
    id: "venue-siebel-atrium",
    name: "Siebel Atrium",
    kind: "frat_student_org",
    area: "Siebel Center",
    tagline: "Org pop-ups & mixers",
    imageUrl:
      "https://images.unsplash.com/photo-1523580494863-6f3031224c94?w=200&q=80",
  },
  {
    id: "venue-quad-vendor",
    name: "Main Quad vendor",
    kind: "restaurant",
    area: "Campus",
    tagline: "Walk-up drops",
    imageUrl:
      "https://images.unsplash.com/photo-1543339308-43e59d6b73a6?w=200&q=80",
  },
  {
    id: "venue-caffe-bene",
    name: "Caffe Bene",
    kind: "restaurant",
    area: "Green St",
    tagline: "Late caffeine",
    imageUrl:
      "https://images.unsplash.com/photo-1495474478417-bef7d9292dee?w=200&q=80",
  },
  {
    id: "venue-insomnia-cookies",
    name: "Insomnia Cookies",
    kind: "restaurant",
    area: "Campustown",
    tagline: "Warm stacks",
    imageUrl:
      "https://images.unsplash.com/photo-1499636136210-6f4ee915583e?w=200&q=80",
  },
  {
    id: "venue-art-coop",
    name: "Art Coop",
    kind: "restaurant",
    area: "Downtown Urbana",
    tagline: "Indie retail",
    imageUrl:
      "https://images.unsplash.com/photo-1562157873-818bc0746dba?w=200&q=80",
  },
  {
    id: "venue-legends",
    name: "Legends",
    kind: "bar_club",
    area: "Green St",
    tagline: "Legends line culture",
    imageUrl:
      "https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=200&q=80",
  },
] as const;

const venueById = new Map<string, PuFollowableVenue>(
  MOCK_FOLLOWABLE_VENUES.map((v) => [v.id, v])
);

export function getFollowableVenue(id: string): PuFollowableVenue | undefined {
  return venueById.get(id);
}

export function kindLabel(kind: PuFollowableVenue["kind"]): string {
  switch (kind) {
    case "bar_club":
      return "Bar / club";
    case "restaurant":
      return "Food & drink";
    case "frat_student_org":
      return "Frat / org";
  }
}
