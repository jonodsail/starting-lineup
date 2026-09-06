-- Seed the pilot opportunity board into Supabase.
-- Generated from src/data/opportunities.js during the post-split cleanup.
-- Idempotent: rerunning refreshes each row in place rather than duplicating it.
-- The ids are deterministic (UUIDv5 of the former slug), so a rerun always
-- targets the same rows and any member tracker entries stay attached.

alter table public.opportunities add column if not exists verified_on date;

insert into public.opportunities
  (id, company, title, location, work_mode, opportunity_type, job_function, sector,
   description, mba_signal, source_name, source_url, application_deadline, verified_on,
   status, featured)
values
  ('a7791bd5-68c0-5445-a88d-af8d1dc79296', 'Nike', 'Strategic Planning Graduate Internship', 'Beaverton, OR', 'On-site', 'MBA Internship', 'Strategy', 'Apparel & Equipment', 'Own a high-impact strategy project tied to Nike’s long-term growth agenda and present recommendations to senior leaders.', 'Explicitly seeks MBA or master’s candidates graduating in winter 2027 or spring 2028, with 3–5 years of experience preferred.', 'Official job posting', 'https://careers.nike.com/nike-inc-strategic-planning-graduate-internship/job/R-91142', null, '2026-09-05', 'approved', true),
  ('3e9222b9-adf9-533c-bd56-8f1025fb7e91', 'DICK’S Sporting Goods', '2027 MBA Strategy Internship', 'Coraopolis, PA', 'Hybrid', 'MBA Internship', 'Strategy', 'Commerce & Consumer', 'Lead an executive-sponsored strategic project and present recommendations to enterprise leadership during a 10-week internship.', 'Built for first-year MBA students graduating in 2028 and serves as a pipeline into DICK’S post-MBA Executive Development Program.', 'Verified MBA posting', 'https://cdo.som.yale.edu/jobs/dicks-sporting-goods-inc-2027-mba-strategy-internship-executive-development-program-internship/', '2026-10-07', '2026-09-05', 'approved', true),
  ('02a6b392-8991-5ec7-80c4-0f127d39bd68', 'Nike', 'Finance Graduate Internship', 'Beaverton, OR', 'On-site', 'MBA Internship', 'Finance', 'Apparel & Equipment', 'Lead a business-relevant finance assignment involving forecasting, investment analysis, and executive decision support.', 'Explicit MBA internship for December 2027 or spring 2028 graduates; 3–5 years of prior experience is strongly preferred.', 'Official job posting', 'https://careers.nike.com/nike-inc-finance-graduate-internship/job/R-91119', null, '2026-09-05', 'approved', true),
  ('9a47414a-e216-52b0-a7da-4d13efd86833', 'Nike', 'Marketing Vanguard Program Graduate Internship', 'Beaverton, OR', 'On-site', 'MBA Internship', 'Marketing', 'Apparel & Equipment', 'Own a strategic marketing project spanning consumer insight, brand planning, and activation within Nike’s worldwide marketing team.', 'Seeks MBA or marketing master’s candidates graduating in December 2027 or spring 2028, with prior professional experience preferred.', 'Official job posting', 'https://careers.nike.com/nike-inc-marketing-vanguard-program-mvp-graduate-internship/job/R-91139', null, '2026-09-05', 'approved', false),
  ('271e1dc0-af4c-55c0-990e-55bfab827805', 'Fanatics', 'Manager, Enterprise Partnerships – Financial Services', 'New York, NY', 'Hybrid', 'Full-Time', 'Business Development', 'Commerce & Consumer', 'Build business cases and execute loyalty, payments, and financial-services partnerships across the Fanatics platform.', 'High-visibility operator role seeking 5–8 years in business development, partnerships, strategy and operations, or related fields.', 'Official job posting', 'https://job-boards.greenhouse.io/fanaticsinc/jobs/4207920009', null, '2026-09-05', 'approved', true),
  ('a65e4834-e570-5f68-bd29-65173e769c81', 'Fanatics Betting & Gaming', 'Strategic Finance Manager', 'New York, NY', 'Hybrid', 'Full-Time', 'Finance', 'Gaming & Interactive', 'Drive forecasting, financial-performance reporting, and strategic analysis for the broader Fanatics ecosystem.', 'Targets candidates with 3–5 years in strategic finance, FP&A, or investment banking and offers senior-leadership exposure.', 'Official job posting', 'https://job-boards.greenhouse.io/fanaticsfbg/jobs/4382026009', null, '2026-09-05', 'approved', false),
  ('61060522-e11d-520c-a281-919e5fd103ec', 'Fanatics Betting & Gaming', 'Senior Manager, Strategy & Partnerships', 'New York, NY', 'On-site', 'Full-Time', 'Strategy', 'Gaming & Interactive', 'Set the benefits strategy and partner supply plan for Fanatics ONE, with ownership of economics, sourcing, and performance.', 'Post-MBA-caliber builder role seeking 6+ years across consulting, strategy, or category management.', 'Official job posting', 'https://job-boards.greenhouse.io/fanaticsfbg/jobs/4388822009', null, '2026-09-05', 'approved', false),
  ('c584cd7a-d97c-5887-afe3-0c22048f9e18', 'Fanatics Collectibles', 'Manager, Licensing & Partnerships', 'New York, NY', 'On-site', 'Full-Time', 'Partnerships', 'Commerce & Consumer', 'Shape licensing strategy, manage sports-property relationships, and drive high-priority initiatives across Fanatics Collectibles.', 'Seeks 5–7 years in consulting, strategy, finance, business operations, or project management with strong analytical skills.', 'Official job posting', 'https://job-boards.greenhouse.io/fanaticscollectibles/jobs/4376627009', null, '2026-09-05', 'approved', false)
on conflict (id) do update set
  company = excluded.company,
  title = excluded.title,
  location = excluded.location,
  work_mode = excluded.work_mode,
  opportunity_type = excluded.opportunity_type,
  job_function = excluded.job_function,
  sector = excluded.sector,
  description = excluded.description,
  mba_signal = excluded.mba_signal,
  source_name = excluded.source_name,
  source_url = excluded.source_url,
  application_deadline = excluded.application_deadline,
  verified_on = excluded.verified_on,
  status = excluded.status,
  featured = excluded.featured,
  updated_at = now();
