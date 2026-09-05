-- Run once against an existing Starting Lineup Supabase project.
create table if not exists public.alumni_submissions (
  id uuid primary key default gen_random_uuid(),
  full_name text not null,
  hbs_class_year integer,
  company text not null,
  title text not null,
  linkedin_url text not null,
  notes text not null default '',
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  submitted_by uuid not null references auth.users(id) on delete cascade,
  reviewed_by uuid references auth.users(id),
  reviewed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.alumni_submissions enable row level security;

drop policy if exists "members submit alumni candidates" on public.alumni_submissions;
create policy "members submit alumni candidates" on public.alumni_submissions
for insert with check (public.is_allowed_hbs_member() and submitted_by = auth.uid() and status = 'pending');

drop policy if exists "members read own alumni submissions" on public.alumni_submissions;
create policy "members read own alumni submissions" on public.alumni_submissions
for select using (public.is_allowed_hbs_member() and submitted_by = auth.uid());

drop policy if exists "officers manage alumni submissions" on public.alumni_submissions;
create policy "officers manage alumni submissions" on public.alumni_submissions
for all using (public.is_club_officer()) with check (public.is_club_officer());
