import type { BusinessDealFormValues, HostEventFormValues } from "@/lib/portal-types";

function validHttpUrl(value: string): boolean {
  try {
    const u = new URL(value);
    return u.protocol === "http:" || u.protocol === "https:";
  } catch {
    return false;
  }
}

export function validateHostSubmission(values: HostEventFormValues): string | null {
  if (!values.title.trim()) return "Add event title.";
  if (!values.date || !values.startTime || !values.endTime) {
    return "Add complete date and time details.";
  }
  if (!values.area.trim() || !values.venue.trim()) return "Add area and venue.";
  if (values.description.trim().length < 16) {
    return "Description should be at least 16 characters.";
  }
  if (!validHttpUrl(values.imageUrl.trim())) {
    return "Image URL must be valid (http/https).";
  }
  if (values.externalUrl.trim() && !validHttpUrl(values.externalUrl.trim())) {
    return "External URL must be valid (http/https).";
  }
  const cover = values.coverDollars.trim();
  if (cover) {
    const asNumber = Number(cover);
    if (!Number.isFinite(asNumber) || asNumber < 0 || asNumber > 300) {
      return "Cover price must be a number between 0 and 300.";
    }
  }
  return null;
}

export function validateBusinessSubmission(values: BusinessDealFormValues): string | null {
  if (!values.businessName.trim()) return "Add business name.";
  if (!values.dealTitle.trim()) return "Add deal title.";
  if (!values.perk.trim()) return "Add offer/perk.";
  if (!values.validFrom || !values.validUntil) return "Add valid date range.";
  if (!values.area.trim()) return "Add location area.";
  if (values.description.trim().length < 12) {
    return "Description should be at least 12 characters.";
  }
  if (!validHttpUrl(values.imageUrl.trim())) {
    return "Image URL must be valid (http/https).";
  }
  if (values.externalUrl.trim() && !validHttpUrl(values.externalUrl.trim())) {
    return "External URL must be valid (http/https).";
  }
  return null;
}
