import type { Session as SupabaseSession } from "@supabase/supabase-js";
import type { AccountType } from "../pull-up-data";
import type { StudentProfile } from "./supabaseAuth";

export { safeReturnTo } from "./authRules";

export type Session = {
  accessToken: string;
  refreshToken?: string;
  accountType: AccountType;
  canHostUnofficial: boolean;
  displayName: string;
  email: string;
  isPreview: boolean;
};

const STORAGE_KEY = "pull-up-session";

export function loadSession(): Session | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Session;
    if (!parsed?.accessToken || !parsed?.accountType) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function saveSession(session: Session) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
}

export function clearSession() {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(STORAGE_KEY);
}

/** Build the app session from a Supabase session + the Pull Up profile. */
export function sessionFromSupabase(supabase: SupabaseSession, profile: StudentProfile): Session {
  return {
    accessToken: supabase.access_token,
    refreshToken: supabase.refresh_token,
    accountType: profile.account_type,
    canHostUnofficial: profile.can_host_unofficial,
    displayName: profile.display_name,
    email: profile.email,
    isPreview: false,
  };
}
