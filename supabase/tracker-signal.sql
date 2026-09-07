-- Aggregate interest across members.
--
-- Sixty members run overlapping searches and none of them can see that. This
-- exposes how many members are tracking each role, and nothing else: no names,
-- no stages, no notes. saved_opportunities itself stays private to its owner —
-- the policy there is unchanged.
--
-- Counts below two are withheld here rather than in the browser. In a club this
-- size a count of one could be guessed, and a rule enforced only in the
-- interface is not a rule.
--
-- Run once against the Starting Lineup Supabase project.

create or replace function public.opportunity_tracker_counts()
returns table (opportunity_id uuid, tracker_count bigint)
language sql stable security definer set search_path = public as $$
  select saved.opportunity_id, count(*)::bigint
  from public.saved_opportunities as saved
  where public.is_allowed_hbs_member()
  group by saved.opportunity_id
  having count(*) >= 2;
$$;

revoke all on function public.opportunity_tracker_counts() from public, anon;
grant execute on function public.opportunity_tracker_counts() to authenticated;
