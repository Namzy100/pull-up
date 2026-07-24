-- Pull Up Supabase schema
-- Apply in Supabase SQL editor or migrations. RLS is enabled on every app table.

create extension if not exists pgcrypto;

create table if not exists public.profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references auth.users(id) on delete cascade,
  email text not null unique,
  display_name text not null,
  campus_id text not null default 'uiuc',
  account_type text not null default 'student'
    check (account_type in ('student', 'host', 'admin')),
  can_host_unofficial boolean not null default false,
  bio text not null default '',
  class_year text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.host_organizations (
  id uuid primary key default gen_random_uuid(),
  owner_user_id uuid not null references auth.users(id) on delete cascade,
  campus_id text not null default 'uiuc',
  name text not null,
  kind text not null check (kind in ('frat', 'bar', 'pub', 'club', 'student_org', 'house')),
  verification_status text not null default 'pending'
    check (verification_status in ('pending', 'verified', 'restricted')),
  created_at timestamptz not null default now()
);

create table if not exists public.organization_members (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.host_organizations(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null default 'operator'
    check (role in ('owner', 'operator', 'promoter', 'viewer')),
  created_at timestamptz not null default now(),
  unique (organization_id, user_id)
);

create table if not exists public.venues (
  id uuid primary key default gen_random_uuid(),
  campus_id text not null default 'uiuc',
  host_organization_id uuid references public.host_organizations(id) on delete set null,
  name text not null,
  kind text not null check (kind in ('frat_house', 'bar', 'pub', 'club', 'apartment', 'campus_space')),
  address text,
  latitude double precision,
  longitude double precision,
  age_rule text not null default 'Unknown',
  default_cover text not null default 'Unknown',
  visibility text not null default 'public'
    check (visibility in ('public', 'invite_only', 'admin_hidden')),
  created_at timestamptz not null default now()
);

create table if not exists public.events (
  id uuid primary key default gen_random_uuid(),
  campus_id text not null default 'uiuc',
  venue_id uuid references public.venues(id) on delete set null,
  host_organization_id uuid references public.host_organizations(id) on delete set null,
  created_by_user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  description text not null default '',
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  status text not null default 'submitted'
    check (status in ('draft', 'submitted', 'approved', 'live', 'ended', 'rejected')),
  event_type text not null default 'official'
    check (event_type in ('official', 'unofficial_party')),
  invite_mode text not null default 'open'
    check (invite_mode in ('open', 'invite_link', 'friends_of_friends')),
  cover text not null default 'Unknown',
  age_rule text not null default 'Unknown',
  capacity_estimate integer,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint host_or_unofficial_creator check (
    host_organization_id is not null or event_type = 'unofficial_party'
  )
);

create table if not exists public.attendances (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  status text not null default 'interested'
    check (status in ('interested', 'going', 'arrived', 'left', 'not_going')),
  visibility text not null default 'friends'
    check (visibility in ('private', 'friends', 'host_aggregate')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (event_id, user_id)
);

create table if not exists public.crews (
  id uuid primary key default gen_random_uuid(),
  campus_id text not null default 'uiuc',
  name text not null,
  created_by_user_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);

create table if not exists public.crew_members (
  crew_id uuid not null references public.crews(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null default 'member' check (role in ('owner', 'member')),
  status text not null default 'active' check (status in ('invited', 'active', 'left')),
  joined_at timestamptz not null default now(),
  primary key (crew_id, user_id)
);

create table if not exists public.plans (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events(id) on delete cascade,
  crew_id uuid references public.crews(id) on delete set null,
  created_by_user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  arrival_window_start timestamptz,
  arrival_window_end timestamptz,
  status text not null default 'proposed'
    check (status in ('proposed', 'committed', 'active', 'completed', 'cancelled')),
  visibility text not null default 'invite_only'
    check (visibility in ('invite_only', 'friends_of_friends')),
  note text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.plan_members (
  plan_id uuid not null references public.plans(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  response text not null default 'invited'
    check (response in ('invited', 'interested', 'going', 'declined')),
  eta_minutes integer,
  joined_at timestamptz not null default now(),
  primary key (plan_id, user_id)
);

create table if not exists public.crowd_reports (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events(id) on delete cascade,
  submitted_by_user_id uuid not null references auth.users(id) on delete cascade,
  line_state text check (line_state in ('none', 'short', 'moderate', 'long', 'at_capacity')),
  cover text,
  crowd_state text check (crowd_state in ('quiet', 'filling', 'busy', 'packed')),
  note text not null default '',
  verification_method text not null default 'self_report'
    check (verification_method in ('self_report', 'proximity', 'ambassador', 'admin')),
  created_at timestamptz not null default now()
);

create table if not exists public.host_reports (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events(id) on delete cascade,
  submitted_by_user_id uuid not null references auth.users(id) on delete cascade,
  line_state text not null check (line_state in ('quiet', 'moving', 'building', 'at_capacity')),
  capacity_pressure integer not null check (capacity_pressure between 0 and 100),
  note text not null default '',
  review_status text not null default 'pending'
    check (review_status in ('pending', 'approved', 'downweighted', 'rejected')),
  created_at timestamptz not null default now()
);

create table if not exists public.signal_events (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events(id) on delete cascade,
  user_id uuid references auth.users(id) on delete set null,
  source text not null
    check (source in ('attendance', 'checkin', 'friend_intent', 'host_report', 'ambassador', 'admin_adjustment')),
  weight numeric not null,
  verification_level numeric not null,
  trust_score numeric not null,
  expires_at timestamptz not null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.event_scores (
  event_id uuid primary key references public.events(id) on delete cascade,
  state text not null check (state in ('rising', 'stable', 'uncertain')),
  confidence integer not null check (confidence between 0 and 100),
  demand_quality integer not null check (demand_quality between 0 and 100),
  manipulation_risk text not null check (manipulation_risk in ('low', 'watch', 'high')),
  explanation text not null,
  computed_at timestamptz not null default now()
);

create table if not exists public.moderation_reviews (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events(id) on delete cascade,
  reviewer_user_id uuid references auth.users(id) on delete set null,
  severity text not null check (severity in ('low', 'watch', 'high')),
  status text not null default 'open'
    check (status in ('open', 'approved', 'abstained', 'escalated', 'closed')),
  reason text not null,
  decision text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists profiles_user_id_idx on public.profiles(user_id);
create index if not exists profiles_account_type_idx on public.profiles(account_type);
create index if not exists host_orgs_owner_idx on public.host_organizations(owner_user_id);
create index if not exists org_members_user_idx on public.organization_members(user_id);
create index if not exists events_campus_status_idx on public.events(campus_id, status);
create index if not exists events_starts_at_idx on public.events(starts_at);
create index if not exists attendances_user_idx on public.attendances(user_id);
create index if not exists attendances_event_idx on public.attendances(event_id);
create index if not exists crew_members_user_idx on public.crew_members(user_id);
create index if not exists plans_event_idx on public.plans(event_id);
create index if not exists plan_members_user_idx on public.plan_members(user_id);
create index if not exists crowd_reports_event_idx on public.crowd_reports(event_id, created_at desc);
create index if not exists signals_event_idx on public.signal_events(event_id);
create index if not exists moderation_status_idx on public.moderation_reviews(status);

alter table public.profiles enable row level security;
alter table public.host_organizations enable row level security;
alter table public.organization_members enable row level security;
alter table public.venues enable row level security;
alter table public.events enable row level security;
alter table public.attendances enable row level security;
alter table public.crews enable row level security;
alter table public.crew_members enable row level security;
alter table public.plans enable row level security;
alter table public.plan_members enable row level security;
alter table public.crowd_reports enable row level security;
alter table public.host_reports enable row level security;
alter table public.signal_events enable row level security;
alter table public.event_scores enable row level security;
alter table public.moderation_reviews enable row level security;

create or replace function public.is_admin()
returns boolean
language sql
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where user_id = auth.uid()
      and account_type = 'admin'
  );
$$;

create or replace function public.is_org_member(org_id uuid)
returns boolean
language sql
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.organization_members
    where organization_id = org_id
      and user_id = auth.uid()
  );
$$;

drop policy if exists "profiles own or admin select" on public.profiles;
create policy "profiles own or admin select"
on public.profiles for select to authenticated
using ((select auth.uid()) = user_id or public.is_admin());

drop policy if exists "profiles own update" on public.profiles;
create policy "profiles own update"
on public.profiles for update to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

drop policy if exists "events visible to authenticated" on public.events;
create policy "events visible to authenticated"
on public.events for select to authenticated
using (status in ('approved', 'live', 'ended') or created_by_user_id = (select auth.uid()) or public.is_admin() or public.is_org_member(host_organization_id));

drop policy if exists "students can create unofficial parties" on public.events;
create policy "students can create unofficial parties"
on public.events for insert to authenticated
with check (
  created_by_user_id = (select auth.uid())
  and (
    public.is_admin()
    or host_organization_id is not null
    or exists (
      select 1 from public.profiles
      where user_id = auth.uid()
        and can_host_unofficial = true
    )
  )
);

drop policy if exists "attendance own rows" on public.attendances;
create policy "attendance own rows"
on public.attendances for all to authenticated
using ((select auth.uid()) = user_id or public.is_admin())
with check ((select auth.uid()) = user_id or public.is_admin());

drop policy if exists "crew members can read crews" on public.crews;
create policy "crew members can read crews"
on public.crews for select to authenticated
using (
  created_by_user_id = (select auth.uid())
  or exists (select 1 from public.crew_members m where m.crew_id = id and m.user_id = auth.uid())
  or public.is_admin()
);

drop policy if exists "users create crews" on public.crews;
create policy "users create crews"
on public.crews for insert to authenticated
with check (created_by_user_id = (select auth.uid()));

drop policy if exists "crew membership visible to crew" on public.crew_members;
create policy "crew membership visible to crew"
on public.crew_members for select to authenticated
using (
  user_id = (select auth.uid())
  or exists (select 1 from public.crew_members mine where mine.crew_id = crew_id and mine.user_id = auth.uid())
  or public.is_admin()
);

drop policy if exists "plan members can read plans" on public.plans;
create policy "plan members can read plans"
on public.plans for select to authenticated
using (
  created_by_user_id = (select auth.uid())
  or exists (select 1 from public.plan_members m where m.plan_id = id and m.user_id = auth.uid())
  or public.is_admin()
);

drop policy if exists "users create plans" on public.plans;
create policy "users create plans"
on public.plans for insert to authenticated
with check (created_by_user_id = (select auth.uid()));

drop policy if exists "plan members manage own response" on public.plan_members;
create policy "plan members manage own response"
on public.plan_members for all to authenticated
using (user_id = (select auth.uid()) or public.is_admin())
with check (user_id = (select auth.uid()) or public.is_admin());

drop policy if exists "students create crowd reports" on public.crowd_reports;
create policy "students create crowd reports"
on public.crowd_reports for insert to authenticated
with check (submitted_by_user_id = (select auth.uid()));

drop policy if exists "crowd reports admin read" on public.crowd_reports;
create policy "crowd reports admin read"
on public.crowd_reports for select to authenticated
using (submitted_by_user_id = (select auth.uid()) or public.is_admin());

drop policy if exists "host reports by org or admin" on public.host_reports;
create policy "host reports by org or admin"
on public.host_reports for all to authenticated
using (
  public.is_admin()
  or exists (
    select 1 from public.events e
    where e.id = event_id
      and public.is_org_member(e.host_organization_id)
  )
)
with check (
  public.is_admin()
  or submitted_by_user_id = (select auth.uid())
);

drop policy if exists "scores readable to authenticated" on public.event_scores;
create policy "scores readable to authenticated"
on public.event_scores for select to authenticated
using (true);

drop policy if exists "moderation admin only" on public.moderation_reviews;
create policy "moderation admin only"
on public.moderation_reviews for all to authenticated
using (public.is_admin())
with check (public.is_admin());
