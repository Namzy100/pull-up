export type ApiConfig = {
  configured: boolean;
  supabaseUrl: string | null;
  supabaseAnonKey: string | null;
};

export type ReadyConfig = {
  supabaseUrl: string;
  supabaseAnonKey: string;
};

/** Fetch the public runtime config (URL + anon key only) from the server. */
export async function readConfig(): Promise<ApiConfig> {
  const response = await fetch("/api/auth/config");
  if (!response.ok) throw new Error("We could not reach Pull Up right now.");
  return (await response.json()) as ApiConfig;
}

export function requireReadyConfig(config: ApiConfig): ReadyConfig | null {
  if (!config.configured || !config.supabaseUrl || !config.supabaseAnonKey) {
    return null;
  }
  return { supabaseUrl: config.supabaseUrl, supabaseAnonKey: config.supabaseAnonKey };
}
