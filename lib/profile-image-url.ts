/** Light validation for pasted profile image URLs (no upload). */
export function isValidProfileImageUrl(raw: string): boolean {
  const t = raw.trim();
  if (!t.startsWith("http://") && !t.startsWith("https://")) return false;
  try {
    const u = new URL(t);
    return u.protocol === "http:" || u.protocol === "https:";
  } catch {
    return false;
  }
}

/** Stock portrait URLs previously used as app defaults — treat as “no photo”. */
const LEGACY_PLACEHOLDER_AVATAR_SUBSTRINGS = [
  "photo-1534528741775-53994a69daeb",
  "photo-1534528741775",
] as const;

function isLegacyPlaceholderAvatarUrl(trimmed: string): boolean {
  const lower = trimmed.toLowerCase();
  if (!lower.includes("unsplash.com")) return false;
  return LEGACY_PLACEHOLDER_AVATAR_SUBSTRINGS.some((frag) => lower.includes(frag));
}

/**
 * Normalize `profiles.avatar_url` for UI + client store.
 * Empty, invalid scheme, or known legacy placeholder → "".
 */
export function normalizeStoredProfileAvatarUrl(raw: string | null | undefined): string {
  const t = (raw ?? "").trim();
  if (!t) return "";
  if (!isValidProfileImageUrl(t)) return "";
  if (isLegacyPlaceholderAvatarUrl(t)) return "";
  return t;
}

/** Two-letter initials from display name, else from handle (e.g. username without @). */
export function getProfileAvatarInitials(fullName: string, handle: string): string {
  const name = fullName.trim();
  if (name.length >= 2) {
    const parts = name.split(/\s+/).filter(Boolean);
    if (parts.length >= 2) {
      const a = parts[0]?.[0];
      const b = parts[parts.length - 1]?.[0];
      if (a && b) return (a + b).toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  }
  const h = handle.replace(/^@/, "").trim();
  if (h.length >= 2) return h.slice(0, 2).toUpperCase();
  if (h.length === 1) return h.toUpperCase();
  return "";
}
