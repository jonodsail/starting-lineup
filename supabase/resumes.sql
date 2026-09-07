-- Resume storage for member profiles.
--
-- Members upload an optional PDF during orientation and can replace it later.
-- Club officers can read every resume, so they can match members to roles by
-- hand. Onboarding says so in plain words; if that access is ever withdrawn,
-- remove the officer policies here and the sentence in Onboarding.jsx together.
--
-- Run once against the Starting Lineup Supabase project.

insert into storage.buckets (id, name, public)
values ('resumes', 'resumes', false)
on conflict (id) do nothing;

-- Files are stored at <user id>/resume.pdf, so the first path segment is the
-- owner. Every policy below keys off that segment.

drop policy if exists "members read own resume" on storage.objects;
create policy "members read own resume" on storage.objects for select
  using (
    bucket_id = 'resumes'
    and public.is_allowed_hbs_member()
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "members upload own resume" on storage.objects;
create policy "members upload own resume" on storage.objects for insert
  with check (
    bucket_id = 'resumes'
    and public.is_allowed_hbs_member()
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "members replace own resume" on storage.objects;
create policy "members replace own resume" on storage.objects for update
  using (
    bucket_id = 'resumes'
    and public.is_allowed_hbs_member()
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "members delete own resume" on storage.objects;
create policy "members delete own resume" on storage.objects for delete
  using (
    bucket_id = 'resumes'
    and public.is_allowed_hbs_member()
    and (storage.foldername(name))[1] = auth.uid()::text
  );

-- Officers read every resume. They cannot write or delete one: a member's own
-- file stays theirs to replace.
drop policy if exists "officers read every resume" on storage.objects;
create policy "officers read every resume" on storage.objects for select
  using (bucket_id = 'resumes' and public.is_club_officer());

-- Officers also need to see who the members are, to know whose resume they are
-- reading. Members still manage only their own row.
drop policy if exists "officers read member profiles" on public.member_profiles;
create policy "officers read member profiles" on public.member_profiles
  for select using (public.is_club_officer());
