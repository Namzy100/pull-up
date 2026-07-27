"use client";

import type { Session as SupabaseSession } from "@supabase/supabase-js";
import type { AccountType } from "../pull-up-data";
import { getSupabaseClient } from "./supabaseClient";
import { displayNameFromEmail } from "./authRules";

export type { ApiConfig, ReadyConfig } from "./config";
export { readConfig, requireReadyConfig } from "./config";
export { displayNameFromEmail } from "./authRules";

export type StudentProfile = {
  account_type: AccountType;
  can_host_unofficial: boolean;
  display_name: string;
  email: string;
};

export type SignUpResult = {
  session: SupabaseSession | null;
  needsConfirmation: boolean;
};

async function client() {
  const supabase = await getSupabaseClient();
  if (!supabase) throw new Error("Pull Up accounts are not available in this environment.");
  return supabase;
}

function friendly(message: string | undefined, fallback: string): string {
  if (!message) return fallback;
  if (/invalid login credentials/i.test(message)) return "That email and password did not match. Try again.";
  if (/email not confirmed/i.test(message)) return "Confirm your email first — check your inbox for the link.";
  if (/user already registered/i.test(message)) return "That email already has an account. Try signing in.";
  if (/rate limit|too many/i.test(message)) return "Too many attempts. Wait a moment and try again.";
  return message;
}

export async function signIn(email: string, password: string): Promise<SupabaseSession> {
  const supabase = await client();
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error || !data.session) {
    throw new Error(friendly(error?.message, "We could not sign you in."));
  }
  return data.session;
}

export async function signUp(email: string, password: string, redirectTo: string): Promise<SignUpResult> {
  const supabase = await client();
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: { emailRedirectTo: redirectTo },
  });
  if (error) throw new Error(friendly(error.message, "We could not create your account."));
  return { session: data.session, needsConfirmation: !data.session };
}

export async function requestPasswordReset(email: string, redirectTo: string): Promise<void> {
  const supabase = await client();
  const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo });
  if (error) throw new Error(friendly(error.message, "We could not send the reset email."));
}

export async function exchangeCodeForSession(code: string): Promise<SupabaseSession> {
  const supabase = await client();
  const { data, error } = await supabase.auth.exchangeCodeForSession(code);
  if (error || !data.session) {
    throw new Error("This link is invalid or has expired. Request a fresh one.");
  }
  return data.session;
}

/** Fallback for older email links that carry a token_hash instead of a PKCE code. */
export async function verifyTokenHash(type: string, tokenHash: string): Promise<SupabaseSession> {
  const supabase = await client();
  const otpType = (type === "recovery" ? "recovery" : type === "email" ? "email" : "signup") as
    | "recovery"
    | "email"
    | "signup";
  const { data, error } = await supabase.auth.verifyOtp({ type: otpType, token_hash: tokenHash });
  if (error || !data.session) {
    throw new Error("This link is invalid or has expired. Request a fresh one.");
  }
  return data.session;
}

export async function updatePassword(password: string): Promise<void> {
  const supabase = await client();
  const { error } = await supabase.auth.updateUser({ password });
  if (error) throw new Error(friendly(error.message, "We could not update your password."));
}

export async function getSupabaseSession(): Promise<SupabaseSession | null> {
  const supabase = await getSupabaseClient();
  if (!supabase) return null;
  const { data } = await supabase.auth.getSession();
  return data.session;
}

export async function signOutSupabase(): Promise<void> {
  const supabase = await getSupabaseClient();
  await supabase?.auth.signOut();
}

/** Read or create the Pull Up profile via the server API (service role stays server-side). */
export async function ensureProfile(
  accessToken: string,
  email: string,
): Promise<StudentProfile> {
  const profileResponse = await fetch("/api/supabase/profile", {
    headers: { authorization: `Bearer ${accessToken}` },
  });
  if (!profileResponse.ok) {
    throw new Error("You are signed in, but we could not load your Pull Up account.");
  }
  const profileResult = (await profileResponse.json()) as { profiles?: StudentProfile[] };
  const existing = profileResult.profiles?.[0];
  if (existing) return existing;

  const createdResponse = await fetch("/api/supabase/profile", {
    method: "POST",
    headers: { authorization: `Bearer ${accessToken}`, "content-type": "application/json" },
    body: JSON.stringify({
      displayName: displayNameFromEmail(email),
      campusId: "uiuc",
      canHostUnofficial: false,
    }),
  });
  if (!createdResponse.ok) {
    throw new Error("We signed you in, but could not finish setting up your account.");
  }
  const createdResult = (await createdResponse.json()) as { profile?: StudentProfile };
  if (!createdResult.profile) {
    throw new Error("We signed you in, but could not finish setting up your account.");
  }
  return createdResult.profile;
}
