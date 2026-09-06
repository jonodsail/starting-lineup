-- Add a Rejected stage to the member tracker.
-- The stage column carries a CHECK constraint listing the allowed values, so a
-- new stage cannot be used until the constraint is widened. Run this before
-- deploying the copy-review build.

alter table public.saved_opportunities
  drop constraint if exists saved_opportunities_stage_check;

alter table public.saved_opportunities
  add constraint saved_opportunities_stage_check
  check (stage in ('Saved', 'Applied', 'Rejected', 'Interviewing', 'Offer', 'Passed'));
