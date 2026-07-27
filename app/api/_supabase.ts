export type PullUpAccountType = "student" | "host" | "admin";

export type PullUpProfile = {
  id: string;
  user_id: string;
  email: string;
  display_name: string;
  campus_id: string;
  account_type: PullUpAccountType;
  can_host_unofficial: boolean;
};

export type SupabaseUser = {
  id: string;
  email?: string;
};

type SupabaseConfig = {
  anonKey: string;
  serviceRoleKey: string;
  url: string;
};

function readSupabaseConfig(): SupabaseConfig {
  const url = process.env.SUPABASE_URL;
  const anonKey = process.env.SUPABASE_ANON_KEY;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !anonKey || !serviceRoleKey) {
    throw new Error("Supabase environment variables are not configured.");
  }

  return { anonKey, serviceRoleKey, url: url.replace(/\/$/, "") };
}

export function jsonError(message: string, status = 400) {
  return Response.json({ error: message }, { status });
}

export function bearerToken(request: Request) {
  const header = request.headers.get("authorization") ?? "";
  const [scheme, token] = header.split(" ");
  if (scheme?.toLowerCase() !== "bearer" || !token) return null;
  return token;
}

export async function requireSupabaseUser(request: Request): Promise<SupabaseUser> {
  const token = bearerToken(request);
  if (!token) throw new Response("Missing bearer token", { status: 401 });

  const config = readSupabaseConfig();
  const response = await fetch(`${config.url}/auth/v1/user`, {
    headers: {
      apikey: config.anonKey,
      authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    throw new Response("Invalid Supabase session", { status: 401 });
  }

  const user = (await response.json()) as SupabaseUser;
  if (!user.id) throw new Response("Invalid Supabase user", { status: 401 });
  return user;
}

export async function supabaseRest<T>(
  path: string,
  init: RequestInit = {},
): Promise<T> {
  const config = readSupabaseConfig();
  const headers = new Headers(init.headers);
  headers.set("apikey", config.serviceRoleKey);
  headers.set("content-type", "application/json");
  headers.set("prefer", "return=representation");
  if (!config.serviceRoleKey.startsWith("sb_secret_")) {
    headers.set("authorization", `Bearer ${config.serviceRoleKey}`);
  }
  const response = await fetch(`${config.url}/rest/v1/${path}`, {
    ...init,
    headers,
  });

  if (!response.ok) {
    const detail = await response.text();
    throw new Error(`Supabase request failed: ${response.status} ${detail}`);
  }

  if (response.status === 204) return undefined as T;
  return (await response.json()) as T;
}

export async function getProfileForUser(user: SupabaseUser): Promise<PullUpProfile | null> {
  const rows = await supabaseRest<PullUpProfile[]>(
    `profiles?user_id=eq.${encodeURIComponent(user.id)}&select=*`,
  );
  return rows[0] ?? null;
}

export async function requireProfile(
  request: Request,
  allowedTypes?: PullUpAccountType[],
): Promise<{ profile: PullUpProfile; user: SupabaseUser }> {
  const user = await requireSupabaseUser(request);
  const profile = await getProfileForUser(user);
  if (!profile) throw new Response("Profile required", { status: 403 });
  if (allowedTypes && !allowedTypes.includes(profile.account_type)) {
    throw new Response("Insufficient account permissions", { status: 403 });
  }
  return { profile, user };
}

export function routeError(error: unknown) {
  if (error instanceof Response) return error;
  const message = error instanceof Error ? error.message : "Unexpected error";
  const status = message.includes("Supabase environment") ? 503 : 500;
  return jsonError(message, status);
}
