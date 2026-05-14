import type { BusinessPromoTypeId } from "@/lib/supabase/business-deal-payload";
import type { EventCategory } from "@/lib/types";

import { DEAL_FILTER_OPTIONS } from "@/lib/deals-data";

export const PORTAL_EVENT_CATEGORIES: readonly {
  value: EventCategory;
  label: string;
}[] = [
  { value: "frat_party", label: "Frat / house party" },
  { value: "bar_club", label: "Bar / club" },
  { value: "student_org", label: "Student org" },
  { value: "food_deal", label: "Food pop-up" },
  { value: "campus", label: "Campus" },
  { value: "concert", label: "Concert / live show" },
  { value: "watch_party", label: "Watch party" },
  { value: "pop_up", label: "Pop-up" },
  { value: "other", label: "Other" },
] as const;

export function categoryLabelForEvent(cat: EventCategory): string {
  const row = PORTAL_EVENT_CATEGORIES.find((c) => c.value === cat);
  return row?.label ?? cat;
}

export const PORTAL_DEAL_CATEGORY_OPTIONS = DEAL_FILTER_OPTIONS;

export const PORTAL_BUSINESS_PROMO_TYPE_OPTIONS: readonly {
  id: BusinessPromoTypeId;
  label: string;
}[] = [
  { id: "event", label: "Event" },
  { id: "promo", label: "Promo" },
  { id: "food_special", label: "Food special" },
  { id: "watch_party", label: "Watch party" },
  { id: "live_music", label: "Live music" },
  { id: "limited_drop", label: "Limited drop" },
  { id: "other", label: "Other" },
] as const;
