---
title: Environment variables
description: Every environment variable the app reads, where each value comes from, and which are safe for the browser.
slug: /docs/environment
order: 2
---

# Environment variables

Copy `.env.example` to `.env.local` for local work. On Vercel, set the same names under **Project > Settings > Environment Variables**. Never commit real values.

Anything that starts with `VITE_` ends up in the browser bundle, so only public values use that prefix. Keys that grant extra access stay server-only.

## Reference

| Variable | Browser? | Purpose | Where to find it |
|----------|----------|---------|------------------|
| `VITE_SUPABASE_URL` | Yes | Supabase API URL | **Project Settings > API > Project URL**. Local: `npx supabase status` |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | Yes | Anon or publishable key | **Project Settings > API**, anon or publishable key. Local: `npx supabase status` |
| `VITE_AUTH_GOOGLE_ENABLED` | Yes | Set to `true` to show Google on `/login` and `/signup` | Also enable Google under **Authentication > Providers** in Supabase |
| `APP_URL` | No | Your site's public origin, used in sign-up and password reset emails. No trailing slash. | Your production URL, for example `https://www.example.com`. Local: `http://localhost:3000` |
| `SUPABASE_SERVICE_ROLE_KEY` | No | Admin user tools (create and delete users, change emails and passwords) and API token lookup | **Project Settings > API > service_role** |
| `SUPABASE_JWT_SECRET` | No | Signs short-lived sessions for API and MCP tokens | **Project Settings > API > JWT Keys**. Local: `npx supabase status` |
| `MEDIA_UPLOAD_TICKET_SECRET` | No | Signs admin media upload tickets | Run `npm run secrets:generate` |
| `CONTACT_IP_HASH_SECRET` | No | Hashes visitor IPs for the contact form rate limit. Required in production | Run `npm run secrets:generate` |
| `RESEND_API_KEY` | No | Optional. Emails each contact form message to your contact email | [resend.com](https://resend.com) > **API Keys** |
| `CONTACT_FROM_EMAIL` | No | Optional. Sender address for contact emails, needed with `RESEND_API_KEY` | An address on a domain verified in Resend |

The server also accepts `VITE_SUPABASE_ANON_KEY` and `VITE_SUPABASE_KEY` as older names for the publishable key. Use `VITE_SUPABASE_PUBLISHABLE_KEY` for new projects.

## Example

```env
VITE_SUPABASE_URL=http://127.0.0.1:54321
VITE_SUPABASE_PUBLISHABLE_KEY=
VITE_AUTH_GOOGLE_ENABLED=false
APP_URL=http://localhost:3000
SUPABASE_SERVICE_ROLE_KEY=
SUPABASE_JWT_SECRET=
MEDIA_UPLOAD_TICKET_SECRET=
CONTACT_IP_HASH_SECRET=
```

## Generating app secrets

Run `npm run secrets:generate` to create random values for the secrets the app owns: `CONTACT_IP_HASH_SECRET` and `MEDIA_UPLOAD_TICKET_SECRET`. It adds only the keys missing from `.env.local`, keeps existing values, and prints key names only.

For Vercel, run `npm run secrets:generate -- --print`. It prints `KEY=value` lines to paste into **Project > Settings > Environment Variables** and does not write any file. Treat that output as secret and don't paste it anywhere else.

Supabase and Resend keys come from their own dashboards.

## Notes on APP_URL

- In production it must use `https`. Loopback addresses are the only exception.
- On Vercel Preview you can leave it unset. Links then use the deployment's own `https://<deployment>.vercel.app` address.
- In Supabase, under **Authentication > URL Configuration**, set **Site URL** to your `APP_URL` and add `<APP_URL>/auth/callback` and `<APP_URL>/reset-password` as redirect URLs.

## Notes on the secret keys

- Never put the service role key in a `VITE_` variable. It bypasses row level security.
- Without `SUPABASE_SERVICE_ROLE_KEY`, the **Users** screen can't create or delete accounts.
- Without `SUPABASE_JWT_SECRET`, the **API and MCP** screen won't create tokens. Supabase projects that only use asymmetric JWT signing keys aren't supported for tokens.
- Without `CONTACT_IP_HASH_SECRET`, the contact form won't save messages in production. Locally a development fallback is used.
- If a secret leaks, rotate it in Supabase and update Vercel straight away.

## Vercel

| Name | Environments |
|------|--------------|
| `VITE_SUPABASE_URL` | Production, Preview |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | Production, Preview |
| `APP_URL` | Production (your live domain) |
| `SUPABASE_SERVICE_ROLE_KEY` | Production, and Preview only if you use admin user tools on previews |
| `CONTACT_IP_HASH_SECRET` | Production, Preview |
| `SUPABASE_JWT_SECRET` | Production, and Preview only if you use API tokens on previews |

Redeploy after changing environment variables so the new values are picked up.
