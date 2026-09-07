# Starting Lineup

A private sports-career resource built for the HBS Business of Sports Club. The pilot combines a tightly curated MBA job board, a personal application tracker, and an HBS alumni directory organized around the companies members are researching.

> Independent student project. This is not an official Harvard Business School product.

## Pilot features

- Email magic-link authentication restricted to `@mba2027.hbs.edu` and `@mba2028.hbs.edu`
- RC/EC member orientation and career preferences
- Officer-curated MBA internships and full-time opportunities
- Personal saved-role pipeline
- A personal Network list of saved alumni with private notes
- Alumni search interface backed by a private, officer-managed directory
- Officer approval queue for member-submitted roles

## Run locally

```bash
npm install
npm run dev
```

When Supabase variables are absent, local development shows a preview-only entry
button backed by the bundled opportunity file and browser storage. Production
fails closed: it requires an HBS email magic link, and member profiles, saved
roles, opportunities, and alumni all come from Supabase.

Vercel uses the rewrite in `vercel.json` so direct visits and authentication redirects to routes such as `/dashboard` load the React application instead of returning a platform 404.

## Connect the Supabase project

1. Open the Supabase project used for Starting Lineup.
2. Run `supabase/schema.sql` in its SQL editor. Starting Lineup uses a separate
   `member_profiles` table, leaving the legacy job tracker's `profiles` table unchanged.
3. Enable Email under Authentication → Providers.
4. Add the local and Vercel callback URLs to the authentication redirect allowlist.
5. Run `supabase/allowed-domains.sql`. It creates the membership domain list,
   seeds it with the two current classes, and repoints the access check at it.
6. Run `supabase/resumes.sql`. It creates the private `resumes` bucket and its
   policies. Members read and replace only their own file; officers can read
   every resume and the member roster, which is what the onboarding copy tells
   members. Withdrawing that access means removing the officer policies there
   and the sentence in `Onboarding.jsx` together.
7. Run `supabase/tracker-signal.sql`. It exposes how many members are tracking
   each role, and only where that count is two or more. The threshold is
   enforced in the function, not the interface.
8. Run `supabase/saved-alumni.sql`. It creates the per-member network list.
9. Run `supabase/seed-opportunities.sql`. It adds the `verified_on` column and
   publishes the pilot opportunity board. The board reads from the database, so
   until this runs the opportunities page is empty. The script is idempotent and
   uses fixed ids, so rerunning it refreshes the roles without detaching anyone's
   saved-role tracker.
10. Add officer emails directly to `officer_accounts` through the protected SQL editor.
11. Copy `.env.example` to `.env.local` and fill in the project URL and anon key.
12. Add the same variables in the separate Vercel project.

Membership is controlled by the `allowed_email_domains` table, which officers
edit from the Member access section of the officer desk. Run
`supabase/allowed-domains.sql` once to create and seed it. The database policies
are the security boundary; the interface check is for a clear member experience.
When a new class arrives, add its domain there rather than changing code.

## Data handling

Member resumes live in a private storage bucket, one file per member. Members
can read and replace only their own; club officers can read all of them, and
onboarding says so where the file is chosen.

The source alumni workbook is not committed, and no alumni names, employers, or profile URLs are bundled into this public repository. Import those records only into the private Supabase project. Future authorized emails belong in the protected `alumni_contacts` table and are available only to club officers.

Officers recheck published roles from the Needs rechecking queue on the officer
desk, which lists anything last verified more than 30 days ago. Marking a role
still live stamps today's date; marking it closed expires it and members stop
seeing it.

A member's saved alumni are private and never aggregated. Alumni are real
people who did not ask to be counted, so unlike roles there is no signal about
how many members have saved or contacted someone.

Members see how many other members are tracking a role, and nothing else about
them. Counts below two are withheld by the database function rather than by the
interface.

The opportunity records include a `verifiedOn` date and link to role-specific postings rather than general careers pages. Roles can close without notice, so officers should recheck every application path regularly and remove closed listings promptly.
