"use client";

import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { readConfig, requireReadyConfig } from "./config";

let clientPromise: Promise<SupabaseClient | null> | null = null;

/**
 * Lazily create a single browser Supabase client from the runtime config
 * (`/api/auth/config` returns only the public URL + anon key — never the
 * service-role key). PKCE flow, persisted + auto-refreshed session.
 * Returns null when Supabase is not configured (local preview).
 */
export function getSupabaseClient(): Promise<SupabaseClient | null> {
  if (!clientPromise) {
    clientPromise = (async () => {
      const ready = requireReadyConfig(await readConfig());
      if (!ready) return null;
      return createClient(ready.supabaseUrl, ready.supabaseAnonKey, {
        auth: {
          flowType: "pkce",
          persistSession: true,
          autoRefreshToken: true,
          detectSessionInUrl: false, // the /auth/callback route handles this explicitly
          storageKey: "pull-up-auth",
        },
      });
    })();
  }
  return clientPromise;
}

/** Current access token for authenticated server API calls, or null. */
export async function getAccessToken(): Promise<string | null> {
  const client = await getSupabaseClient();
  if (!client) return null;
  const { data } = await client.auth.getSession();
  return data.session?.access_token ?? null;
}
