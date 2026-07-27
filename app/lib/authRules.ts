// Pure, dependency-free auth helpers. No window, no network, no supabase import,
// so they are safe to unit-test directly.

/** UIUC campus email gate: only @illinois.edu addresses may sign up. */
export function isCampusEmail(email: string): boolean {
  return /^[^@\s]+@illinois\.edu$/i.test(email.trim());
}

export const CAMPUS_EMAIL_HINT = "Use your @illinois.edu campus email to sign up.";

/** Friendly display name derived from the email local part. */
export function displayNameFromEmail(email: string): string {
  const localPart = email.split("@")[0] ?? "Student";
  return (
    localPart
      .split(/[._-]/)
      .filter(Boolean)
      .map((part) => `${part.charAt(0).toUpperCase()}${part.slice(1)}`)
      .join(" ") || "Student"
  );
}

/** Only allow returning to a same-origin, non-auth path. */
export function safeReturnTo(value: string | null | undefined): string {
  if (!value) return "/student";
  if (!value.startsWith("/") || value.startsWith("//")) return "/student";
  if (value.startsWith("/auth")) return "/student";
  return value;
}

export type CallbackParams = {
  kind: "error" | "code" | "tokens" | "token_hash" | "none";
  type: string;
  code?: string;
  accessToken?: string;
  refreshToken?: string;
  tokenHash?: string;
  errorCode?: string;
  errorMessage?: string;
};

/**
 * Classify auth-callback parameters from the URL. Callback data can arrive in the
 * query (PKCE `?code=` or `?token_hash=`) or the hash (implicit `#access_token=`),
 * and errors can be in either place.
 */
export function parseCallbackParams(hashString: string, queryString: string): CallbackParams {
  const hash = new URLSearchParams(hashString.replace(/^#/, ""));
  const query = new URLSearchParams(queryString.replace(/^\?/, ""));
  const pick = (key: string) => query.get(key) ?? hash.get(key) ?? undefined;

  const type = pick("type") ?? "signup";
  const errorCode = pick("error_code");
  const errorParam = pick("error");
  const errorMessage = pick("error_description");
  if (errorParam || errorCode || errorMessage) {
    return { kind: "error", type, errorCode, errorMessage };
  }

  const code = query.get("code") ?? undefined;
  if (code) return { kind: "code", type, code };

  const accessToken = hash.get("access_token") ?? undefined;
  if (accessToken) {
    return { kind: "tokens", type, accessToken, refreshToken: hash.get("refresh_token") ?? undefined };
  }

  const tokenHash = query.get("token_hash") ?? query.get("token") ?? undefined;
  if (tokenHash) return { kind: "token_hash", type, tokenHash };

  return { kind: "none", type };
}
