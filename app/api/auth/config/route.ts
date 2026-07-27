export const runtime = "nodejs";

export async function GET() {
  return Response.json({
    configured: Boolean(process.env.SUPABASE_URL && process.env.SUPABASE_ANON_KEY),
    supabaseUrl: process.env.SUPABASE_URL ?? null,
    supabaseAnonKey: process.env.SUPABASE_ANON_KEY ?? null,
  });
}
