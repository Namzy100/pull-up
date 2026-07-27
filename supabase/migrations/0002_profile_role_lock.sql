-- Pull Up — profile privilege hardening (Phase 6)
--
-- The 0001 policy "profiles own update" gates the ROW (auth.uid() = user_id) but
-- not which COLUMNS a user may change. Without this migration a signed-in user
-- could PATCH their own profile and set account_type = 'admin' or
-- can_host_unofficial = true, escalating their own role.
--
-- Fix: remove the blanket UPDATE grant and re-grant UPDATE on only the columns a
-- student is allowed to edit. Row-level security still restricts updates to the
-- user's own row. The service role (server API) bypasses these grants, so profile
-- creation and role assignment on the server are unaffected.
--
-- Idempotent: safe to re-run.

-- No end user (authenticated or anonymous) may perform a table-wide profile update.
revoke update on public.profiles from authenticated;
revoke update on public.profiles from anon;

-- Students may edit only these presentation fields on their own row.
grant update (display_name, bio, class_year) on public.profiles to authenticated;

-- Belt-and-braces: anonymous visitors get no write access to profiles at all.
revoke insert, delete on public.profiles from anon;
