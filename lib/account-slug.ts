/** URL-safe handle from display/org/business name; not guaranteed unique without suffix. */
export function slugFromLabel(raw: string): string {
  const s = raw
    .trim()
    .toLowerCase()
    .replace(/['"]/g, "")
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .slice(0, 24);
  return s.length >= 3 ? s : `pu_${s || "user"}`.slice(0, 24);
}

/** Deterministic unique-enough username for DB (profiles.username min length 3). */
export function usernameFromOrgOrBusiness(label: string, userId: string): string {
  const base = slugFromLabel(label);
  const suffix = userId.replace(/-/g, "").slice(0, 8);
  const combined = `${base}_${suffix}`.slice(0, 32);
  return combined.length >= 3 ? combined : `pu_${suffix}`.slice(0, 32);
}
