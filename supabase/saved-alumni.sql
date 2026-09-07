-- A member's saved alumni: the people half of the personal workspace, next to
-- saved_opportunities.
--
-- Private to its owner. Nothing here is aggregated or shown to other members:
-- alumni are real people who did not ask to be counted, and the club's
-- relationship with them is worth more than the signal would be.
--
-- Run once against the Starting Lineup Supabase project.

create table if not exists public.saved_alumni (
  user_id uuid not null references auth.users(id) on delete cascade,
  alumni_id uuid not null references public.alumni(id) on delete cascade,
  note text not null default '',
  saved_at timestamptz not null default now(),
  primary key (user_id, alumni_id)
);

alter table public.saved_alumni enable row level security;

drop policy if exists "members manage own network" on public.saved_alumni;
create policy "members manage own network" on public.saved_alumni for all
  using (public.is_allowed_hbs_member() and user_id = auth.uid())
  with check (public.is_allowed_hbs_member() and user_id = auth.uid());
