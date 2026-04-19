# Shift Planner Cloud

This project migrates the original single-file planner into a `Next.js + Supabase` app without rewriting the scheduler canvas itself.

## Architecture

- `public/planner/index.html`
  The original planner runs here as an embedded editor.
- `src/app`
  Next.js routes for auth, dashboard, owner editor, and share links.
- `Supabase`
  Stores full planner snapshots plus share mode and owner metadata.

## Local setup

1. Copy `.env.example` to `.env.local`.
2. Create a Supabase project.
3. Run the SQL in [supabase/schema.sql](/Users/captaindoo/Desktop/JAVASCRIPT/ShiftPlaner/supabase/schema.sql).
4. In Supabase Auth, enable email sign-in.
5. Add these redirect URLs:
   - `http://localhost:3000/auth/callback`
   - `https://YOUR_DOMAIN/auth/callback`
6. Install packages and run the app:

```bash
npm install
npm run dev
```

## Deployment

Recommended target: [Vercel](https://vercel.com/new).

1. Import this repository into Vercel.
2. Add the same four environment variables from `.env.local`.
3. Set `NEXT_PUBLIC_SITE_URL` to the production URL.
4. Redeploy.

## Share modes

- `private`
  Only the signed-in owner can open the planner.
- `view`
  Anyone with the share URL can inspect the latest planner.
- `edit`
  Anyone with the share URL can open the embedded planner and save changes back.

## Notes

- Public share links use `SUPABASE_SERVICE_ROLE_KEY` on the server only.
- The embedded planner still keeps local browser autosave, but the app-level save button writes the current snapshot to Supabase.
