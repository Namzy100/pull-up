import { env } from "cloudflare:workers";

export async function GET() {
  return Response.json({
    configured: Boolean(env.SUPABASE_URL && env.SUPABASE_ANON_KEY),
    supabaseUrl: env.SUPABASE_URL ?? null,
    supabaseAnonKey: env.SUPABASE_ANON_KEY ?? null,
  });
}
