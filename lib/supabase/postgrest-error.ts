/** Human-readable PostgREST / Supabase DB error for UI and logs. */
export function formatSupabasePostgrestError(
  error: {
    message: string;
    code?: string;
    details?: string | null;
    hint?: string | null;
  } | null
): string {
  if (!error) return "Unknown database error.";
  const parts: string[] = [error.message];
  if (error.code) parts.push(`code=${error.code}`);
  if (error.details) parts.push(`details=${error.details}`);
  if (error.hint) parts.push(`hint=${error.hint}`);
  return parts.join(" | ");
}
