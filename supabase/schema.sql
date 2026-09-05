-- Starting Lineup pilot schema. Run in a dedicated Supabase project.
create extension if not exists pgcrypto;

create table public.officer_accounts (
  email text primary key check (email = lower(email)),
  created_at timestamptz not null default now()
);

create or replace function public.is_allowed_hbs_member()
returns boolean language sql stable as $$
  select lower(coalesce(auth.jwt() ->> 'email', '')) ~ '@mba202(7|8)\.hbs\.edu$';
$$;

create or replace function public.is_club_officer()
returns boolean language sql security definer stable set search_path = public as $$
  select exists (select 1 from public.officer_accounts where email = lower(coalesce(auth.jwt() ->> 'email', '')));
$$;

revoke all on function public.is_club_officer() from public, anon;
grant execute on function public.is_club_officer() to authenticated;

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  full_name text not null,
  hbs_class text not null check (hbs_class in ('RC', 'EC')),
  career_stage text,
  target_functions text[] not null default '{}',
  target_sectors text[] not null default '{}',
  target_locations text[] not null default '{}',
  resume_path text,
  updated_at timestamptz not null default now()
);

create table public.opportunities (
  id uuid primary key default gen_random_uuid(), company text not null, title text not null,
  location text, work_mode text,
  opportunity_type text not null check (opportunity_type in ('MBA Internship', 'Full-Time')),
  job_function text not null, sector text not null, description text, mba_signal text not null,
  source_name text not null, source_url text not null, application_deadline date,
  status text not null default 'draft' check (status in ('draft', 'approved', 'expired', 'rejected')),
  featured boolean not null default false, submitted_by uuid references auth.users(id),
  approved_by uuid references auth.users(id), approved_at timestamptz,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);

create table public.saved_opportunities (
  user_id uuid not null references auth.users(id) on delete cascade,
  opportunity_id uuid not null references public.opportunities(id) on delete cascade,
  stage text not null default 'Saved' check (stage in ('Saved', 'Applied', 'Interviewing', 'Offer', 'Passed')),
  notes text not null default '', saved_at timestamptz not null default now(),
  primary key (user_id, opportunity_id)
);

create table public.alumni (
  id uuid primary key default gen_random_uuid(), full_name text not null, hbs_class_year integer,
  company text not null, title text not null, linkedin_url text not null,
  current_role boolean not null default true, verified_at timestamptz,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);

create table public.alumni_contacts (
  alumni_id uuid primary key references public.alumni(id) on delete cascade,
  authorized_email text not null,
  updated_at timestamptz not null default now()
);

alter table public.officer_accounts enable row level security;
alter table public.profiles enable row level security;
alter table public.opportunities enable row level security;
alter table public.saved_opportunities enable row level security;
alter table public.alumni enable row level security;
alter table public.alumni_contacts enable row level security;

create policy "members read approved opportunities" on public.opportunities for select using (public.is_allowed_hbs_member() and (status = 'approved' or public.is_club_officer()));
create policy "members submit drafts" on public.opportunities for insert with check (public.is_allowed_hbs_member() and submitted_by = auth.uid() and status = 'draft');
create policy "officers manage opportunities" on public.opportunities for all using (public.is_club_officer()) with check (public.is_club_officer());
create policy "members manage own profile" on public.profiles for all using (public.is_allowed_hbs_member() and id = auth.uid()) with check (public.is_allowed_hbs_member() and id = auth.uid() and lower(email) = lower(auth.jwt() ->> 'email'));
create policy "members manage own tracker" on public.saved_opportunities for all using (public.is_allowed_hbs_member() and user_id = auth.uid()) with check (public.is_allowed_hbs_member() and user_id = auth.uid());
create policy "members read alumni" on public.alumni for select using (public.is_allowed_hbs_member());
create policy "officers manage alumni" on public.alumni for all using (public.is_club_officer()) with check (public.is_club_officer());
create policy "officers manage alumni contacts" on public.alumni_contacts for all using (public.is_club_officer()) with check (public.is_club_officer());
create policy "officers view allowlist" on public.officer_accounts for select using (public.is_club_officer());

-- Authorized alumni emails live in a separate officer-only table and never enter member queries.
