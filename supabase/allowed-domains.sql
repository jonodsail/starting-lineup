-- Move the member access rule out of code and into data.
--
-- Before this, two places decided who could sign in: ALLOWED_EMAIL_DOMAINS in
-- src/lib/config.js and a regex inside is_allowed_hbs_member(). Both hardcoded
-- mba2027 and mba2028, so the September rollover to a new class was a code
-- change and a deploy, and a graduating officer silently lost access.
--
-- Run once against the Starting Lineup Supabase project.

create table if not exists public.allowed_email_domains (
  domain text primary key check (domain = lower(domain) and domain like '%.%'),
  note text not null default '',
  created_at timestamptz not null default now()
);

-- Seed with the domains the regex allowed, so behaviour does not change on
-- the day this runs.
insert into public.allowed_email_domains (domain, note) values
  ('mba2027.hbs.edu', 'Class of 2027'),
  ('mba2028.hbs.edu', 'Class of 2028')
on conflict (domain) do nothing;

alter table public.allowed_email_domains enable row level security;

-- The list is printed on the sign-in page, so it is not a secret. Anonymous
-- read is required: the browser needs it before anyone has a session.
drop policy if exists "anyone reads allowed domains" on public.allowed_email_domains;
create policy "anyone reads allowed domains"
  on public.allowed_email_domains for select
  to anon, authenticated
  using (true);

drop policy if exists "officers manage allowed domains" on public.allowed_email_domains;
create policy "officers manage allowed domains"
  on public.allowed_email_domains for all
  using (public.is_club_officer()) with check (public.is_club_officer());

-- security definer so the check does not depend on the caller's own read
-- access to the table, and so it cannot be broken by a future policy change.
create or replace function public.is_allowed_hbs_member()
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.allowed_email_domains
    where domain = split_part(lower(coalesce(auth.jwt() ->> 'email', '')), '@', 2)
      and split_part(lower(coalesce(auth.jwt() ->> 'email', '')), '@', 1) <> ''
  );
$$;
