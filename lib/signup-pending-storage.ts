import type { SignupAccountPath } from "@/lib/account-signup-types";
import type {
  BusinessSignupFields,
  HostSignupFields,
  StudentSignupFields,
} from "@/lib/supabase/signup-bootstrap";

const STORAGE_KEY = "pu_pending_signup";

export type PendingSignupPayload = {
  v: 1;
  path: SignupAccountPath;
  fields: StudentSignupFields | HostSignupFields | BusinessSignupFields;
};

export function stashPendingSignup(payload: PendingSignupPayload) {
  if (typeof window === "undefined") return;
  sessionStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
}

export function readPendingSignupFromStorage(): PendingSignupPayload | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as PendingSignupPayload;
    if (parsed?.v !== 1 || !parsed.path || !parsed.fields) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function clearPendingSignupStorage() {
  if (typeof window !== "undefined") sessionStorage.removeItem(STORAGE_KEY);
}
