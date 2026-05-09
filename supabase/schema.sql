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
  consent_type text not null check (consent_type in ('analytics','personalization','location','marketing')),
  value boolean not null,
  source text not null check (source in ('onboarding','profile_settings')),
  created_at timestamptz not null default now()
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

drop policy if exists "profiles_self_write" on public.profiles;
create policy if not exists "profiles_self_read" on public.profiles for select using (auth.uid() = id);
create policy if not exists "profiles_self_insert" on public.profiles
for insert with check (
  auth.uid() = id
  and role = 'regular_user'
);
create policy if not exists "profiles_self_update" on public.profiles
for update using (auth.uid() = id)
with check (
  auth.uid() = id
  and role = 'regular_user'
);
create policy if not exists "profiles_admin_read" on public.profiles
for select using (
  exists (
    select 1 from public.profiles p
    where p.id = auth.uid() and p.role = 'admin'
  )
);
create policy if not exists "profiles_admin_update" on public.profiles
for update using (
  exists (
    select 1 from public.profiles p
    where p.id = auth.uid() and p.role = 'admin'
  )
) with check (
  exists (
    select 1 from public.profiles p
    where p.id = auth.uid() and p.role = 'admin'
  )
);

create policy if not exists "saved_events_self" on public.saved_events for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy if not exists "rsvps_self" on public.rsvps for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy if not exists "venue_follows_self" on public.venue_follows for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy if not exists "interest_preferences_self" on public.interest_preferences for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy if not exists "host_submissions_self" on public.host_submissions for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy if not exists "business_submissions_self" on public.business_submissions for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy if not exists "access_requests_self" on public.access_requests for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy if not exists "consent_events_self" on public.consent_events for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy if not exists "host_submissions_admin_read" on public.host_submissions
for select using (
  exists (
    select 1 from public.profiles p
    where p.id = auth.uid() and p.role = 'admin'
  )
);

create policy if not exists "host_submissions_admin_update" on public.host_submissions
for update using (
  exists (
    select 1 from public.profiles p
    where p.id = auth.uid() and p.role = 'admin'
  )
) with check (
  exists (
    select 1 from public.profiles p
    where p.id = auth.uid() and p.role = 'admin'
  )
);

create policy if not exists "business_submissions_admin_read" on public.business_submissions
for select using (
  exists (
    select 1 from public.profiles p
    where p.id = auth.uid() and p.role = 'admin'
  )
);

create policy if not exists "business_submissions_admin_update" on public.business_submissions
for update using (
  exists (
    select 1 from public.profiles p
    where p.id = auth.uid() and p.role = 'admin'
  )
) with check (
  exists (
    select 1 from public.profiles p
    where p.id = auth.uid() and p.role = 'admin'
  )
);

create policy if not exists "access_requests_admin_read" on public.access_requests
for select using (
  exists (
    select 1 from public.profiles p
    where p.id = auth.uid() and p.role = 'admin'
  )
);

create policy if not exists "access_requests_admin_update" on public.access_requests
for update using (
  exists (
    select 1 from public.profiles p
    where p.id = auth.uid() and p.role = 'admin'
  )
) with check (
  exists (
    select 1 from public.profiles p
    where p.id = auth.uid() and p.role = 'admin'
  )
);
