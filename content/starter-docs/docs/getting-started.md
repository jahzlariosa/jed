---
title: Getting started
description: Clone the starter, apply the schema, create your first admin, and run it locally.
slug: /docs/getting-started
order: 1
---

# Getting started

This guide takes you from an empty GitHub repository to a running site with an admin account. Plan on about five minutes once you have a Supabase project ready.

## What you need

| Tool | Version |
|------|---------|
| Node.js | 22.12 or newer (see `.nvmrc`) |
| npm | Comes with Node |
| Supabase | A hosted project, or the Supabase CLI with Docker for local development |
| Vercel account | For deployment |

## 1. Create your repository

Start each client site from a fresh copy of the starter. Clone it into a new folder and move into it:

```bash
git clone https://github.com/jahzlariosa/jed.git my-site
cd my-site
```

You can name the folder anything you like. `my-site` is just an example.

## 2. Install dependencies

```bash
npm ci
```

Using Windows PowerShell 5.1? Run each command on its own line. It doesn't support chaining commands with `&&`.

## 3. Configure the environment

```bash
cp .env.example .env.local
```

Open `.env.local` and fill in the values. For a hosted Supabase project, you'll find the URL and keys under **Project Settings > API** in the Supabase dashboard. For local Supabase, start the stack first (next step), then run `npx supabase status` and copy the API URL and anon key.

See [Environment variables](/docs/environment) for what each value does.

## 4. Apply the database schema

The schema lives in `supabase/migrations/`. Apply it with the Supabase CLI if you can.

Local, with Docker:

```bash
npx supabase start
npx supabase db reset
```

Hosted project:

```bash
npx supabase login
npx supabase link --project-ref <your-project-ref>
npx supabase db push
```

If you can't use the CLI, open the Supabase **SQL Editor** and run each file from `supabase/migrations/` in filename order, one at a time. Don't skip any. Once you have an admin account, the [SQL templates](/docs/sql-templates) screen lists the same files with a copy button and shows which ones are applied. `supabase/seed.sql` is optional and mostly useful for local sample data.

## 5. Create the first admin

New accounts get the `member` role. The first admin has to be granted in SQL.

1. Make sure email signups are on in Supabase under **Authentication > Providers > Email**.
2. Sign up at `http://localhost:3000/signup`, or invite yourself from the Supabase dashboard.
3. In the Supabase SQL Editor, run this once with your email:

```sql
insert into public.user_roles (user_id, role_code)
select user_id, 'admin'
from public.profiles
where lower(email) = lower('you@example.com')
on conflict do nothing;
```

4. Sign in and open `/admin`.

After this, you can give other people the admin role from **Admin > Users**.

## 6. Run the dev server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). When you run Supabase locally, confirmation and password reset emails land in Inbucket at [http://127.0.0.1:54324](http://127.0.0.1:54324).

## 7. Brand the site

Go to **Admin > Settings** and set:

- **Site name**, used in the header, page titles, and sign-in screens.
- **Accent color**, used for buttons, links, and focus rings across the site and admin.
- **Logo URL**, used wherever the site shows public branding.
- **Contact email**, which turns on the [contact form](/docs/contact).

## Scripts

| Command | What it does |
|---------|--------------|
| `npm run dev` | Dev server on port 3000 |
| `npm run build` | Production build (Vercel output in `.vercel/output`) |
| `npm run preview` | Serve the production build locally |
| `npm run typecheck` | TypeScript 7 native `tsc --noEmit` (`@typescript/native`; JS API via `@typescript/typescript6` for Vite and tooling) |
| `npm run check` | Biome lint and format check |
| `npm run format` | Format with Biome |
| `npm test` | Vitest unit tests |
| `npm run test:watch` | Vitest in watch mode |
| `npm run test:mfa-e2e` | MFA flow script (needs env and a running app) |
| `npm run generate-routes` | Regenerate the TanStack Router route tree |
| `npm run verify:bundle` | Check the server bundle for forbidden dependencies |

## Pulling in starter updates

Client sites cloned from the starter don't sync on their own. To bring improvements from the starter into a client site:

```bash
git remote add starter https://github.com/jahzlariosa/jed.git
git fetch starter
git log HEAD..starter/main --oneline
git diff HEAD starter/main
```

Merge or cherry-pick what you need. Expect conflicts in branding, `AGENTS.md`, and client routes. If new migrations came in, apply them to each environment with `npx supabase db push`, then run `npm ci`, `npm run check`, `npm test`, and `npm run build` before you deploy.

## Common problems

| Symptom | Likely cause | Fix |
|---------|--------------|-----|
| Email links point to the wrong host | `APP_URL` missing or wrong | Set `APP_URL` in Vercel Production and check the Supabase Site URL |
| "Invalid API key" or always signed out | Wrong Supabase URL or key | Match the dashboard values and restart `npm run dev` |
| `/admin` sends you to sign in after the SQL grant | Role not applied or wrong email | Run the admin SQL again and check `user_roles` for an `admin` row |
| Admin user actions fail | Service role key missing | Set `SUPABASE_SERVICE_ROLE_KEY` on the server |
| `/contact` says messages aren't available | No contact email | Set **Contact email** in Admin > Settings |
| Search returns nothing | Search migration not applied | Run `npx supabase db push` |
| Every SQL template shows "not applied" | RPC migration missing or wrong project | Apply `20261015161000_admin_schema_migrations_rpc.sql` and check the linked project |
| Sign-in fails on preview deploys | Redirect URL not allowed | Add the preview URL plus `/auth/callback` in Supabase |
| `npm run build` fails on Vercel | Node version | Use Node 22.x in project settings |
