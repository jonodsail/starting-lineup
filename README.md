# Starting Lineup

A private sports-career resource built for the HBS Business of Sports Club. The pilot combines a tightly curated MBA job board, a personal application tracker, and an HBS alumni directory organized around the companies members are researching.

> Independent student project. This is not an official Harvard Business School product.

## Pilot features

- Email magic-link authentication restricted to `@mba2027.hbs.edu` and `@mba2028.hbs.edu`
- RC/EC member orientation and career preferences
- Officer-curated MBA internships and full-time opportunities
- Personal saved-role pipeline
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
5. Run `supabase/seed-opportunities.sql`. It adds the `verified_on` column and
   publishes the pilot opportunity board. The board reads from the database, so
   until this runs the opportunities page is empty. The script is idempotent and
   uses fixed ids, so rerunning it refreshes the roles without detaching anyone's
   saved-role tracker.
6. Add officer emails directly to `officer_accounts` through the protected SQL editor.
7. Copy `.env.example` to `.env.local` and fill in the project URL and anon key.
8. Add the same variables in the separate Vercel project.

The browser and database each enforce the RC/EC domain allowlist. The database policies are the security boundary; the interface check is for a clear member experience.

## Data handling

The source alumni workbook is not committed, and no alumni names, employers, or profile URLs are bundled into this public repository. Import those records only into the private Supabase project. Future authorized emails belong in the protected `alumni_contacts` table and are available only to club officers.

The opportunity records include a `verifiedOn` date and link to role-specific postings rather than general careers pages. Roles can close without notice, so officers should recheck every application path regularly and remove closed listings promptly.
