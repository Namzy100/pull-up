-- Pull Up foundational schema (Phase 1-9)
-- Apply in Supabase SQL editor or migration runner.

create extension if not exists "pgcrypto";

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  username text unique not null check (char_length(username) >= 3),
  full_name text,
  avatar_url text,
  campus text,
  role text not null default 'regular_user' check (role in ('regular_user','host','business','admin')),
  requested_role text not null default 'none' check (requested_role in ('none','host','business')),
  verification_status text not null default 'none' check (verification_status in ('none','pending','approved','rejected')),
  business_name text,
  business_type text,
  business_website text,
  business_contact text,
  organization_name text,
  organization_type text,
  verification_notes text,
  created_at timestamptz not null default now(),
  onboarding_complete boolean not null default false,
  interests text[] not null default '{}',
  consent_analytics boolean not null default false,
  consent_personalization boolean not null default false,
  consent_location boolean not null default false,
  consent_marketing boolean not null default false
);
alter table public.profiles add column if not exists requested_role text not null default 'none';
alter table public.profiles add column if not exists verification_status text not null default 'none';
alter table public.profiles add column if not exists business_name text;
alter table public.profiles add column if not exists business_type text;
alter table public.profiles add column if not exists business_website text;
alter table public.profiles add column if not exists business_contact text;
alter table public.profiles add column if not exists organization_name text;
alter table public.profiles add column if not exists organization_type text;
alter table public.profiles add column if not exists verification_notes text;

create table if not exists public.venues (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  area text not null,
  kind text not null check (kind in ('bar_club','restaurant','frat_student_org')),
  tagline text,
  image_url text,
  created_at timestamptz not null default now()
);

create table if not exists public.events (
  id uuid primary key default gen_random_uuid(),
  venue_id uuid not null references public.venues(id) on delete cascade,
  title text not null,
  category text not null,
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  cover_cents integer,
  entry_type text not null check (entry_type in ('free','cover','rsvp')),
  stag_rule text not null,
  age_restriction text not null,
  vibe_music text not null,
  description text not null,
  image_url text not null,
  external_url text,
  created_by uuid references auth.users(id),
  status text not null default 'pending' check (status in ('pending','approved','rejected')),
  created_at timestamptz not null default now()
);

create table if not exists public.deals (
  id uuid primary key default gen_random_uuid(),
  venue_id uuid not null references public.venues(id) on delete cascade,
  title text not null,
  category_tag text not null,
  perk text not null,
  valid_from date not null,
  valid_until date not null,
  description text not null,
  image_url text not null,
  external_url text,
  student_only boolean not null default false,
  created_by uuid references auth.users(id),
  status text not null default 'pending' check (status in ('pending','approved','rejected')),
  created_at timestamptz not null default now()
);

-- Widen lifecycle status (drop auto-named checks from initial create if present)
alter table public.events drop constraint if exists events_status_check;
alter table public.events add constraint events_status_check check (status in ('pending','approved','rejected','live','ended'));
alter table public.deals drop constraint if exists deals_status_check;
alter table public.deals add constraint deals_status_check check (status in ('pending','approved','rejected','live','ended'));

-- Events: denormalized + analytics fields for feed UI
alter table public.events add column if not exists host_user_id uuid references auth.users(id) on delete set null;
alter table public.events add column if not exists category_label text;
alter table public.events add column if not exists image_alt text;
alter table public.events add column if not exists area text;
alter table public.events add column if not exists venue_name text;
alter table public.events add column if not exists host_label text;
alter table public.events add column if not exists age_rule text;
alter table public.events add column if not exists vibe text;
alter table public.events add column if not exists urgency_labels text[] not null default '{}';
alter table public.events add column if not exists live_now boolean not null default false;
alter table public.events add column if not exists saves_count integer not null default 0;
alter table public.events add column if not exists rsvps_count integer not null default 0;
alter table public.events add column if not exists watching_count integer not null default 0;
alter table public.events add column if not exists pull_ups_last_hour integer not null default 0;
alter table public.events add column if not exists updated_at timestamptz not null default now();

-- Deals: denormalized + analytics fields for deals UI
alter table public.deals add column if not exists business_user_id uuid references auth.users(id) on delete set null;
alter table public.deals add column if not exists business_name text;
alter table public.deals add column if not exists category text;
alter table public.deals add column if not exists category_label text;
alter table public.deals add column if not exists image_alt text;
alter table public.deals add column if not exists offer text;
alter table public.deals add column if not exists area text;
alter table public.deals add column if not exists urgency_label text;
alter table public.deals add column if not exists saves_count integer not null default 0;
alter table public.deals add column if not exists claims_count integer not null default 0;
alter table public.deals add column if not exists watching_count integer not null default 0;
alter table public.deals add column if not exists updated_at timestamptz not null default now();

create table if not exists public.saved_events (
  user_id uuid not null references auth.users(id) on delete cascade,
  event_id text not null,
  created_at timestamptz not null default now(),
  primary key (user_id, event_id)
);

create table if not exists public.rsvps (
  user_id uuid not null references auth.users(id) on delete cascade,
  event_id text not null,
  created_at timestamptz not null default now(),
  primary key (user_id, event_id)
);

create table if not exists public.venue_follows (
  user_id uuid not null references auth.users(id) on delete cascade,
  venue_id text not null,
  created_at timestamptz not null default now(),
  primary key (user_id, venue_id)
);

-- Append-only engagement log for trending velocity + future analytics jobs.
create table if not exists public.engagement_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete set null,
  subject_type text not null check (subject_type in ('event', 'deal', 'venue')),
  subject_id text not null,
  action text not null check (
    action in (
      'view',
      'save',
      'unsave',
      'rsvp',
      'unrsvp',
      'share',
      'follow',
      'unfollow',
      'intent',
      'click'
    )
  ),
  meta jsonb,
  created_at timestamptz not null default now()
);
create index if not exists engagement_events_subject_time_idx
  on public.engagement_events (subject_type, subject_id, created_at desc);

create table if not exists public.interest_preferences (
  user_id uuid not null references auth.users(id) on delete cascade,
  interest text not null,
  created_at timestamptz not null default now(),
  primary key (user_id, interest)
);

create table if not exists public.host_submissions (
  id uuid primary key default gen_random_uuid(),
  client_submission_id text unique,
  user_id uuid not null references auth.users(id) on delete cascade,
  event_payload jsonb not null,
  status text not null default 'pending' check (status in ('pending','approved','rejected')),
  reviewed_at timestamptz,
  reviewed_by uuid references auth.users(id),
  moderation_notes text,
  created_at timestamptz not null default now()
);

create table if not exists public.business_submissions (
  id uuid primary key default gen_random_uuid(),
  client_submission_id text unique,
  user_id uuid not null references auth.users(id) on delete cascade,
  deal_payload jsonb not null,
  status text not null default 'pending' check (status in ('pending','approved','rejected')),
  reviewed_at timestamptz,
  reviewed_by uuid references auth.users(id),
  moderation_notes text,
  created_at timestamptz not null default now()
);

alter table public.host_submissions add column if not exists published_event_id uuid references public.events(id) on delete set null;
alter table public.business_submissions add column if not exists published_deal_id uuid references public.deals(id) on delete set null;
alter table public.business_submissions add column if not exists published_event_id uuid references public.events(id) on delete set null;

create table if not exists public.access_requests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  requested_role text not null check (requested_role in ('host','business','admin')),
  status text not null default 'pending' check (status in ('pending','approved','rejected')),
  note text,
  metadata jsonb,
  reviewed_by uuid references auth.users(id),
  reviewed_at timestamptz,
  moderation_notes text,
  created_at timestamptz not null default now()
);
alter table public.access_requests add column if not exists metadata jsonb;
alter table public.access_requests add column if not exists reviewed_by uuid references auth.users(id);
alter table public.access_requests add column if not exists reviewed_at timestamptz;
alter table public.access_requests add column if not exists moderation_notes text;

create table if not exists public.consent_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  consent_type text not null,
  value boolean not null,
  source text not null,
  created_at timestamptz not null default now()
);

alter table public.consent_events drop constraint if exists consent_events_consent_type_check;
alter table public.consent_events add constraint consent_events_consent_type_check check (
  consent_type in (
    'analytics',
    'personalization',
    'location',
    'marketing',
    'host_posting_storage',
    'host_event_analytics',
    'host_verification_contact',
    'host_marketing',
    'business_verification_storage',
    'business_performance_analytics',
    'business_verification_contact',
    'business_promotional_outreach',
    'business_public_listing'
  )
);

alter table public.consent_events drop constraint if exists consent_events_source_check;
alter table public.consent_events add constraint consent_events_source_check check (
  source in ('onboarding', 'profile_settings', 'signup')
);

alter table public.profiles enable row level security;
alter table public.saved_events enable row level security;
alter table public.rsvps enable row level security;
alter table public.venue_follows enable row level security;
alter table public.interest_preferences enable row level security;
alter table public.host_submissions enable row level security;
alter table public.business_submissions enable row level security;
alter table public.access_requests enable row level security;
alter table public.consent_events enable row level security;
alter table public.engagement_events enable row level security;
alter table public.venues enable row level security;
alter table public.events enable row level security;
alter table public.deals enable row level security;

-- Admin gate: reads profiles with definer rights so policies never subquery profiles from
-- within profiles RLS (which causes infinite recursion). Role changes stay in app/server.
create or replace function public.pu_is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.profiles
    where id = auth.uid()
      and role = 'admin'
  );
$$;

revoke all on function public.pu_is_admin() from public;
grant execute on function public.pu_is_admin() to authenticated;

-- Legacy policy name from earlier schema revisions
drop policy if exists "profiles_self_write" on public.profiles;

drop policy if exists "profiles_self_read" on public.profiles;
create policy "profiles_self_read" on public.profiles for select using (auth.uid() = id);

drop policy if exists "profiles_self_insert" on public.profiles;
create policy "profiles_self_insert" on public.profiles
for insert with check (auth.uid() = id);

drop policy if exists "profiles_self_update" on public.profiles;
create policy "profiles_self_update" on public.profiles
for update using (auth.uid() = id)
with check (auth.uid() = id);

drop policy if exists "profiles_admin_read" on public.profiles;
create policy "profiles_admin_read" on public.profiles
for select using (public.pu_is_admin());

drop policy if exists "profiles_admin_update" on public.profiles;
create policy "profiles_admin_update" on public.profiles
for update using (public.pu_is_admin())
with check (public.pu_is_admin());

drop policy if exists "saved_events_self" on public.saved_events;
create policy "saved_events_self" on public.saved_events for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "rsvps_self" on public.rsvps;
create policy "rsvps_self" on public.rsvps for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "venue_follows_self" on public.venue_follows;
create policy "venue_follows_self" on public.venue_follows for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "engagement_events_insert_own" on public.engagement_events;
create policy "engagement_events_insert_own" on public.engagement_events
for insert to authenticated
with check (auth.uid() = user_id);

drop policy if exists "interest_preferences_self" on public.interest_preferences;
create policy "interest_preferences_self" on public.interest_preferences for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "host_submissions_self" on public.host_submissions;
create policy "host_submissions_self" on public.host_submissions for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "business_submissions_self" on public.business_submissions;
create policy "business_submissions_self" on public.business_submissions for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "access_requests_self" on public.access_requests;
create policy "access_requests_self" on public.access_requests for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "consent_events_self" on public.consent_events;
create policy "consent_events_self" on public.consent_events for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "host_submissions_admin_read" on public.host_submissions;
create policy "host_submissions_admin_read" on public.host_submissions
for select using (public.pu_is_admin());

drop policy if exists "host_submissions_admin_update" on public.host_submissions;
create policy "host_submissions_admin_update" on public.host_submissions
for update using (public.pu_is_admin())
with check (public.pu_is_admin());

drop policy if exists "business_submissions_admin_read" on public.business_submissions;
create policy "business_submissions_admin_read" on public.business_submissions
for select using (public.pu_is_admin());

drop policy if exists "business_submissions_admin_update" on public.business_submissions;
create policy "business_submissions_admin_update" on public.business_submissions
for update using (public.pu_is_admin())
with check (public.pu_is_admin());

drop policy if exists "access_requests_admin_read" on public.access_requests;
create policy "access_requests_admin_read" on public.access_requests
for select using (public.pu_is_admin());

drop policy if exists "access_requests_admin_update" on public.access_requests;
create policy "access_requests_admin_update" on public.access_requests
for update using (public.pu_is_admin())
with check (public.pu_is_admin());

-- Venues / events / deals: public read of catalog; writes restricted to admins (publish path).
drop policy if exists "venues_public_select" on public.venues;
create policy "venues_public_select" on public.venues for select using (true);

drop policy if exists "venues_admin_all" on public.venues;
create policy "venues_admin_all" on public.venues for all using (public.pu_is_admin()) with check (public.pu_is_admin());

drop policy if exists "events_public_select" on public.events;
create policy "events_public_select" on public.events
for select using (status in ('approved', 'live', 'ended'));

drop policy if exists "events_admin_all" on public.events;
create policy "events_admin_all" on public.events for all using (public.pu_is_admin()) with check (public.pu_is_admin());

drop policy if exists "deals_public_select" on public.deals;
create policy "deals_public_select" on public.deals
for select using (status in ('approved', 'live', 'ended'));

drop policy if exists "deals_admin_all" on public.deals;
create policy "deals_admin_all" on public.deals for all using (public.pu_is_admin()) with check (public.pu_is_admin());

-- Keep denormalized counters aligned with bookmarks / RSVPs (powers live feed + Realtime).
create or replace function public.pu_touch_event_save_count()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if tg_op = 'INSERT' then
    update public.events e
    set saves_count = e.saves_count + 1, updated_at = now()
    where e.id::text = new.event_id and e.status in ('approved', 'live');
  elsif tg_op = 'DELETE' then
    update public.events e
    set saves_count = greatest(0, e.saves_count - 1), updated_at = now()
    where e.id::text = old.event_id and e.status in ('approved', 'live');
  end if;
  return null;
end;
$$;

drop trigger if exists pu_saved_events_touch_event_saves on public.saved_events;
create trigger pu_saved_events_touch_event_saves
after insert or delete on public.saved_events
for each row execute function public.pu_touch_event_save_count();

create or replace function public.pu_touch_event_rsvp_count()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if tg_op = 'INSERT' then
    update public.events e
    set rsvps_count = e.rsvps_count + 1, updated_at = now()
    where e.id::text = new.event_id and e.status in ('approved', 'live');
  elsif tg_op = 'DELETE' then
    update public.events e
    set rsvps_count = greatest(0, e.rsvps_count - 1), updated_at = now()
    where e.id::text = old.event_id and e.status in ('approved', 'live');
  end if;
  return null;
end;
$$;

drop trigger if exists pu_rsvps_touch_event_rsvps on public.rsvps;
create trigger pu_rsvps_touch_event_rsvps
after insert or delete on public.rsvps
for each row execute function public.pu_touch_event_rsvp_count();

-- Optional: enable `events` + `deals` in Supabase Dashboard → Realtime so clients receive counter/status patches without refresh.

-- PostgREST uses the authenticated role; RLS still applies per row.
grant usage on schema public to anon, authenticated;
grant select, insert, update, delete on public.profiles to authenticated;
grant select, insert, update, delete on public.saved_events to authenticated;
grant select, insert, update, delete on public.rsvps to authenticated;
grant select, insert, update, delete on public.venue_follows to authenticated;
grant select, insert, update, delete on public.interest_preferences to authenticated;
grant select, insert, update, delete on public.host_submissions to authenticated;
grant select, insert, update, delete on public.business_submissions to authenticated;
grant select, insert, update, delete on public.access_requests to authenticated;
grant select, insert, update, delete on public.consent_events to authenticated;
grant insert on public.engagement_events to authenticated;

grant select on public.venues to anon, authenticated;
grant select on public.events to anon, authenticated;
grant select on public.deals to anon, authenticated;
grant insert, update, delete on public.venues to authenticated;
grant insert, update, delete on public.events to authenticated;
grant insert, update, delete on public.deals to authenticated;

-- Verify profiles after onboarding (SQL editor, as postgres or service role):
-- select id, username, full_name, campus, role, requested_role, verification_status, onboarding_complete,
--        consent_analytics, consent_personalization, consent_location, consent_marketing, created_at
-- from public.profiles
-- order by created_at desc
-- limit 50;
