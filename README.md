# JED

JED (`jed`) is a production-oriented base for client sites. It ships **TanStack Start** (React 19 + Vite), **Supabase** (Postgres, Auth, RLS), and deploys to **Vercel** with the Nitro Vercel preset.

Start each client site from a fresh clone of this repository.

**Agents:** read [`AGENTS.md`](./AGENTS.md) first. Prompt ideas live in [`prompts/README.md`](./prompts/README.md).

## What is included

- Cookie-backed **Supabase Auth** (email/password, optional Google when configured)
- **Roles and permissions** in Postgres with RLS (`member` on signup, `admin` via SQL grant)
- **Marketing site**: home, blog (list, post, RSS), search, contact form
- **Admin**: dashboard, CMS pages and blog posts (BlockNote), media, users, settings, redirects, audit log, **SQL templates** (read-only migration catalog)
- **MFA**: TOTP policy controlled in admin settings
- Security defaults: CSRF on server functions, CSP middleware, private cache headers on session routes

## Prerequisites

| Tool | Version |
|------|---------|
| Node.js | 22.12+ (see `.nvmrc`) |
| npm | Comes with Node |
| Supabase | Hosted project **or** [Supabase CLI](https://supabase.com/docs/guides/local-development) + Docker for local |
| Vercel account | For deployment |

## Quick start (about 5 minutes)

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2Fjahzlariosa%2Fjed&env=VITE_SUPABASE_URL,VITE_SUPABASE_PUBLISHABLE_KEY,APP_URL,SUPABASE_SERVICE_ROLE_KEY,SUPABASE_JWT_SECRET,MEDIA_UPLOAD_TICKET_SECRET,CONTACT_IP_HASH_SECRET&envDescription=Required%20settings%20from%20your%20Supabase%20project%20and%20generated%20app%20secrets&envLink=https%3A%2F%2Fgithub.com%2Fjahzlariosa%2Fjed%2Fblob%2Fmain%2F.env.example&project-name=jed)

The button creates a Vercel project from this repository and asks for `VITE_SUPABASE_URL`, `VITE_SUPABASE_PUBLISHABLE_KEY`, `APP_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `SUPABASE_JWT_SECRET`, `MEDIA_UPLOAD_TICKET_SECRET`, and `CONTACT_IP_HASH_SECRET`.

### 1. Create the app repository

Clone the starter into a new folder and move into it:

```bash
git clone https://github.com/jahzlariosa/jed.git my-site
cd my-site
```

You can name the folder anything you like. `my-site` is just an example.

### 2. Install dependencies

```bash
npm ci
```

Using Windows PowerShell 5.1? Run each command on its own line. It doesn't support chaining commands with `&&`.

If `.env.local` is missing or incomplete, the install prints a reminder to run `npm run setup`. That reminder does not stop the install.

### 3. Configure environment

```bash
npm run setup
```

Setup writes `.env.local` from [`.env.example`](./.env.example), asks for your Supabase URL, publishable key, and the other required settings, and checks that Supabase accepts the publishable key. It does not print secret values. For a hosted project, copy the URL and keys from **Supabase Dashboard > Project Settings > API**.

For local Supabase, start the stack first (step 4), run `npx supabase status`, then run `npm run setup` again and use the API URL and anon / publishable key.

### 4. Link and push the database schema

**Option A: Supabase CLI (recommended)**

Local (Docker):

```bash
npx supabase start
npx supabase db reset
```

Hosted:

```bash
npx supabase login
npx supabase link --project-ref <your-project-ref>
npx supabase db push
```

**Option B: SQL editor**

If you cannot use the CLI, open **Admin > SQL templates** after your first admin exists, or copy each file from `supabase/migrations/` in filename order into the Supabase **SQL Editor** and run them one at a time. Do not skip files. `supabase/seed.sql` is optional and mainly for local dev samples.

### 5. Run the dev server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). While the dev server is running, an incomplete Supabase setup opens `/setup` instead of the rest of the site. That page is not available in production.

**Local auth emails** (confirm, reset) go to Inbucket when using `supabase start`: [http://127.0.0.1:54324](http://127.0.0.1:54324).

### 6. Check the setup

```bash
npm run doctor
```

Doctor checks the environment, Supabase connectivity, the latest migration when the key can read it, and the Node.js version. It exits with an error when a check fails, and it does not print secret values.

### 7. Create the first admin

1. Enable email signups in Supabase (**Authentication → Providers → Email**) if needed.
2. Sign up at `http://localhost:3000/signup` (or invite a user in the dashboard).
3. In the Supabase **SQL Editor**, run once (replace the email):

```sql
insert into public.user_roles (user_id, role_code)
select user_id, 'admin'
from public.profiles
where lower(email) = lower('you@example.com')
on conflict do nothing;
```

4. Sign in and open **`/admin`**. Legacy `/admin-panel` URLs redirect to `/admin`.

## Environment variables

Copy from [`.env.example`](./.env.example). Never commit real secrets.

| Variable | Client? | Purpose | Where to find it |
|----------|---------|---------|------------------|
| `VITE_SUPABASE_URL` | Yes (browser) | Supabase API URL | Dashboard → **Project Settings → API → Project URL**. Local: `npx supabase status` |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | Yes | Anon / publishable key for the browser | Dashboard → **API → Project API keys → anon** (or publishable). Local: `supabase status` |
| `VITE_AUTH_GOOGLE_ENABLED` | Yes | Set `true` to show Google on login/signup | You must also enable Google in Supabase **Authentication → Providers** |
| `APP_URL` | No (server only) | Canonical site origin for auth email links (no trailing slash) | Your production URL, e.g. `https://www.example.com`. Local default: `http://localhost:3000` |
| `SUPABASE_SERVICE_ROLE_KEY` | No | Admin user CRUD (create/delete users, password/email changes) | Dashboard → **API → service_role** (secret). Never prefix with `VITE_` |
| `SUPABASE_JWT_SECRET` | No | API/MCP personal access tokens (short-lived user JWT) | Dashboard → **API → JWT Keys** (JWT secret). Local: `npx supabase status`. Required for **Admin → API and MCP** |
| `MEDIA_UPLOAD_TICKET_SECRET` | No | HMAC secret for signed admin media upload tickets (32+ characters) | Generate with `npm run secrets:generate`. Required for **Admin → Media** uploads from the CMS editor |
| `CONTACT_IP_HASH_SECRET` | Production | HMAC secret for hashing visitor IPs for the contact form rate limit. The contact form refuses to save messages in production without it | Generate with `npm run secrets:generate` |
| `RESEND_API_KEY` | No | Optional. Emails each contact form message to the contact email in **Admin → Settings**. Messages are always saved to **Admin → Inbox** either way | [resend.com](https://resend.com) → **API Keys** |
| `CONTACT_FROM_EMAIL` | No | Optional. Sender address for contact form emails. Needed with `RESEND_API_KEY` | An address on a domain verified in Resend, e.g. `no-reply@example.com` |

**Generating app secrets**

`npm run secrets:generate` creates random values for the secrets this app owns (`CONTACT_IP_HASH_SECRET` and `MEDIA_UPLOAD_TICKET_SECRET`). It adds only the missing ones to `.env.local`, never overwrites existing values, and prints key names only. For Vercel, run `npm run secrets:generate -- --print` to output `KEY=value` lines to paste into **Settings > Environment Variables**. Treat that output as secret. Supabase and Resend keys come from their dashboards, not from this script.

Legacy aliases `VITE_SUPABASE_ANON_KEY` and `VITE_SUPABASE_KEY` still work on the server but prefer `VITE_SUPABASE_PUBLISHABLE_KEY`.

**`APP_URL` notes**

- Production must be `https` (except loopback).
- On Vercel **Preview**, you may leave `APP_URL` unset so links use `https://<deployment>.vercel.app`.
- Set Supabase **Authentication → URL Configuration**: **Site URL** = your `APP_URL`, and add redirect URLs including `<APP_URL>/auth/callback` and `<APP_URL>/reset-password`.

## Branding

After sign-in, go to **Admin → Settings**:

- **Site name** drives the marketing header, titles, and auth chrome.
- **Accent color** (`brand_hex`) maps to `--brand` for buttons, links, and focus rings on marketing and admin.
- **Logo URL** is stored in site settings and used where the UI reads public branding.

Defaults come from migrations until you save settings in admin.

## Contact email

In **Admin → Settings**, set **Contact email**. When it is set:

- The homepage contact section links to **`/contact`**.
- The contact form submits through the server (honeypot + rate limit) and opens a `mailto:` handoff to that address.

When contact email is empty, `/contact` explains that the form is not available yet.

## Password and leaked-password protection

- App and Zod validators require passwords of **8 to 72 characters**.
- Local Supabase Auth: `supabase/config.toml` sets `minimum_password_length = 8` and `password_hibp_enabled = true`.
- **Hosted Supabase:** open **Authentication → Sign in / Providers → Email** and enable **Prevent use of leaked passwords** (breach list check). `config.toml` does not apply to hosted Auth; set this in the dashboard for each environment.

## MFA settings

In **Admin → Settings → Multi-factor authentication**:

- **Allow authenticator setup** (`mfa_enabled`): master switch for TOTP enrollment UI and enforcement.
- **Sign-in policy** (`mfa_policy`): `off`, `optional`, `required_admins`, or `required_all`.

Members enroll at **Account** or via `/mfa-setup` when redirected. Admins must enroll themselves before turning on **required_admins** or **required_all**. Step-up uses `/mfa-challenge`.

## Admin SQL templates

**Admin → SQL templates** (`/admin/sql-templates`, requires `admin.access`):

- Lists every `supabase/migrations/*.sql` file plus `supabase/seed.sql`, bundled at build time.
- Shows a plain-English summary, when to run it, **applied / not applied** (via `list_applied_schema_migrations`), collapsible SQL, and **Copy**.
- The UI never executes SQL. Use the CLI (`db push` / `db reset`) or paste into the Supabase SQL Editor yourself.

Each new migration file must have an entry in `src/lib/cms/migration-explanations.ts` (CI tests this).

## Deploy to Vercel

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2Fjahzlariosa%2Fjed&env=VITE_SUPABASE_URL,VITE_SUPABASE_PUBLISHABLE_KEY,APP_URL,SUPABASE_SERVICE_ROLE_KEY,SUPABASE_JWT_SECRET,MEDIA_UPLOAD_TICKET_SECRET,CONTACT_IP_HASH_SECRET&envDescription=Required%20settings%20from%20your%20Supabase%20project%20and%20generated%20app%20secrets&envLink=https%3A%2F%2Fgithub.com%2Fjahzlariosa%2Fjed%2Fblob%2Fmain%2F.env.example&project-name=jed)

1. **Import** the GitHub repository: Vercel > **Add New > Project**. Or use the button above. It asks for the required environment variables.
2. **Build settings**: Install `npm ci`, Build `npm run build`, Node **22.x** (matches `.nvmrc`). Framework preset **Other** is fine.
3. **Environment variables** (at minimum):

   | Name | Environments |
   |------|----------------|
   | `VITE_SUPABASE_URL` | Production, Preview |
   | `VITE_SUPABASE_PUBLISHABLE_KEY` | Production, Preview |
   | `APP_URL` | Production (your live domain) |
   | `SUPABASE_SERVICE_ROLE_KEY` | Production (and Preview only if you use admin user tools on previews) |
   | `SUPABASE_JWT_SECRET` | Production (and Preview if you use API/MCP tokens on previews) |
   | `MEDIA_UPLOAD_TICKET_SECRET` | Production (and Preview if editors upload media on previews) |
   | `CONTACT_IP_HASH_SECRET` | Production, Preview |

4. Deploy. Note the production URL.
5. In **Supabase → Authentication → URL Configuration**:
   - **Site URL** = production `APP_URL`
   - **Redirect URLs**: `https://<your-domain>/auth/callback`, `https://<your-domain>/reset-password`, and preview URLs you use (`https://*.vercel.app/auth/callback` if your project allows wildcards).
6. Redeploy after env changes if Vercel cached an old build.

Pull requests get **CI** (lint, typecheck, test, build, audit) and a **Vercel preview** URL.

## Project structure

```
├── src/
│   ├── routes/           # File-based routes (pages, loaders, admin)
│   ├── components/       # UI (marketing, admin, auth, blog)
│   ├── auth/             # Session, permissions, MFA, sign-in/out
│   └── lib/              # Supabase clients, CMS, SEO, security headers
├── supabase/
│   ├── migrations/       # Schema source of truth (apply in order)
│   ├── seed.sql          # Optional local seed data
│   └── config.toml       # Local Supabase config
├── public/               # Static assets (favicon, robots.txt)
├── AGENTS.md             # Agent and contributor spec
├── .env.example          # Env contract (copy to .env.local)
└── vite.config.ts        # Vite + TanStack Start + Nitro (Vercel preset)
```

Generated files such as `src/routeTree.gen.ts` are produced by `npm run generate-routes` when routes change.

## Scripts

| Command | What it does |
|---------|----------------|
| `npm run setup` | Write `.env.local` and check the Supabase publishable key |
| `npm run doctor` | Check env, Supabase, migrations, and Node.js |
| `npm run dev` | Dev server at port 3000 |
| `npm run build` | Production build (Vercel output under `.vercel/output`) |
| `npm run preview` | Serve the production build locally |
| `npm run typecheck` | TypeScript 7 native `tsc --noEmit` (`@typescript/native`; JS API via `@typescript/typescript6` for Vite and tooling) |
| `npm run check` | Biome lint + format check |
| `npm run format` | Auto-format with Biome |
| `npm test` | Vitest unit tests |
| `npm run test:watch` | Vitest in watch mode |
| `npm run test:mfa-e2e` | Optional MFA flow script (needs env + running app) |
| `npm run generate-routes` | Regenerate TanStack Router route tree |
| `npm run verify:bundle` | Assert server bundle excludes forbidden deps |

## Common problems

| Symptom | Likely cause | Fix |
|---------|----------------|-----|
| Login works locally but email links go to the wrong host | `APP_URL` missing or wrong | Set `APP_URL` in Vercel Production to your live domain; check Supabase Site URL |
| "Invalid API key" or always signed out | Wrong Supabase URL/key in `.env.local` | Match Dashboard → API; restart `npm run dev` after env changes |
| `/admin` redirects to login after SQL grant | Role not applied or wrong email | Re-run admin SQL; confirm row in `user_roles` for `admin` |
| Admin **Users** actions fail | Missing service role | Set `SUPABASE_SERVICE_ROLE_KEY` on the server (never `VITE_*`) |
| `/contact` says form unavailable | No contact email | Set **Contact email** in Admin → Settings |
| Search returns nothing | Migrations not applied | Run `20261015160000_public_content_search.sql` (or full `db push`) |
| SQL templates all "not applied" | RPC migration missing or wrong project | Apply `20261015161000_admin_schema_migrations_rpc.sql`; confirm linked Supabase project |
| Preview deploy auth fails | Redirect URL not allow-listed | Add exact preview URL + `/auth/callback` in Supabase |
| `npm run build` fails on Vercel | Node version | Use Node 22.x in project settings |

## Updating from the starter

A cloned site does not update on its own. To pull improvements from JED into a client repo:

1. Add the starter as a remote (one time): `git remote add starter https://github.com/jahzlariosa/jed.git`. If you never changed `origin` after cloning, it still points at the starter, so first point it at the client repo with `git remote set-url origin <client-repo-url>`.
2. Fetch: `git fetch starter`
3. Review diffs: `git log HEAD..starter/main --oneline` and `git diff HEAD starter/main`
4. Merge or cherry-pick only what you need. Expect conflicts in branding, `AGENTS.md`, and client-specific routes.
5. Re-run migrations on each environment after schema changes: `npx supabase db push` or apply new files from SQL templates.
6. Run `npm ci`, `npm run check`, `npm test`, and `npm run build` before deploying.

Keep client-specific env vars and Supabase projects separate per client.

## CI

GitHub Actions runs on every PR and on `main`: `npm ci`, Biome, typecheck, tests, build, and `npm audit --omit=dev --audit-level=high`. Require the **Lint, typecheck, test, build, audit** check on `main` under branch protection.
