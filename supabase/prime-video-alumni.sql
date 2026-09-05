-- Idempotent production sync for the verified near-peer Prime Video cohort.
begin;

update public.alumni
set company = 'Prime Video & Amazon MGM Studios', updated_at = now()
where lower(company) in (
  'amazon prime video sports',
  'amazon prime video',
  'prime video',
  'amazon mgm studios'
);

delete from public.alumni
where linkedin_url in (
  'https://www.linkedin.com/in/jeremydake',
  'https://www.linkedin.com/in/michaear',
  'https://www.linkedin.com/in/nicolakorzenko',
  'https://www.linkedin.com/in/momittal',
  'https://www.linkedin.com/in/nataliemdale',
  'https://www.linkedin.com/in/mariel-klein'
);

insert into public.alumni (
  full_name, hbs_class_year, company, title, linkedin_url, is_current_role, verified_at
) values
  ('Jeremy Dake', 2026, 'Prime Video & Amazon MGM Studios', 'Sr. Strategy Manager, Amazon Prime Video Sports', 'https://www.linkedin.com/in/jeremydake', true, '2026-09-05T12:00:00Z'),
  ('Michael Rodriguez', 2019, 'Prime Video & Amazon MGM Studios', 'General Manager, US SVOD, Prime Video', 'https://www.linkedin.com/in/michaear', true, '2026-09-05T12:00:00Z'),
  ('Nicola Korzenko', 2017, 'Prime Video & Amazon MGM Studios', 'Head of Deals & Partnerships, Prime Video Subscriptions US', 'https://www.linkedin.com/in/nicolakorzenko', true, '2026-09-05T12:00:00Z'),
  ('Mohit Mittal', 2017, 'Prime Video & Amazon MGM Studios', 'Product Leader, Prime Video Commerce', 'https://www.linkedin.com/in/momittal', true, '2026-09-05T12:00:00Z'),
  ('Natalie Dale', 2017, 'Prime Video & Amazon MGM Studios', 'Principal, Content Acquisition, Prime Video', 'https://www.linkedin.com/in/nataliemdale', true, '2026-09-05T12:00:00Z'),
  ('Mariel Klein Haughey', null, 'Prime Video & Amazon MGM Studios', 'Strategy, Amazon MGM Studios', 'https://www.linkedin.com/in/mariel-klein', true, '2026-09-05T12:00:00Z');

commit;
