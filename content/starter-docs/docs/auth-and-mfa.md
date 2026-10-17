---
title: Authentication and MFA
description: How sign-in, password reset, Google sign-in, and the authenticator policy work.
slug: /docs/auth-and-mfa
order: 4
---

# Authentication and MFA

Sign-in runs on Supabase Auth. Sessions are stored in cookies and checked on the server on every request, so the browser never holds a token the app relies on for access.

## Sign-in pages

| Page | What it's for |
|------|---------------|
| `/signup` | Create an account with email and password |
| `/check-email` | Shown after sign-up while the person confirms their email |
| `/login` | Sign in |
| `/admin/login` | Sign in to the admin panel |
| `/forgot-password` | Request a password reset email |
| `/reset-password` | Choose a new password from the email link |
| `/auth/callback` | Where Supabase sends people back after email links and Google sign-in |
| `/account` | Profile, avatar, password, and authenticator settings |

Email links use `APP_URL` as their base, so set it correctly in production. See [Environment variables](/docs/environment).

## Google sign-in

To show a Google button on `/login` and `/signup`:

1. Enable Google under **Authentication > Providers** in Supabase.
2. Set `VITE_AUTH_GOOGLE_ENABLED=true`.
3. Redeploy.

## Where people land after sign-in

In **Admin > Settings** you choose where people go after they sign in (with separate pages for admins and members), sign up, reset their password, and sign out. By default admins go to `/admin`, members to `/`, a password reset leads to `/account`, and signing out leads to `/login`. Destinations must be paths on your own site.

## Multi-factor authentication

The starter supports authenticator apps (TOTP). Two settings in **Admin > Settings > Multi-factor authentication** control it.

**Allow authenticator setup** turns the feature on or off. When it's off, nobody sees setup screens and nothing is enforced, whatever the policy says.

**Sign-in policy** decides who has to use it:

| Policy | Effect |
|--------|--------|
| `off` | No authenticator prompts |
| `optional` | Anyone can add an authenticator. People who have one are asked for a code when they sign in. |
| `required_admins` | Admins must set up an authenticator and enter a code before they can open `/admin`. Members are unaffected. |
| `required_all` | Everyone must set up an authenticator and enter a code to use any signed-in page. |

### Setting up an authenticator

People add an authenticator from their **Account** page. If a policy requires one and they haven't set it up, they're sent to `/mfa-setup` first. When a code is needed, they're sent to `/mfa-challenge`.

### Turning on a required policy

You can't require MFA for others until you've set up your own authenticator. If you try, the settings screen shows: "Set up your own authenticator before requiring MFA for others." This keeps you from locking yourself out of the admin panel.

## Password strength

Passwords must be at least **8 characters**. The app validates length on every password form and server function.

**Leaked password protection** checks new passwords against public breach lists (Have I Been Pwned). For **local** Supabase, `supabase/config.toml` sets `minimum_password_length = 8` and `password_hibp_enabled = true` under `[auth]`.

**Hosted** projects do not read `config.toml` for Auth. Turn on the same protection in the Supabase Dashboard: **Authentication → Sign in / Providers → Email → Prevent use of leaked passwords** (wording may vary slightly by dashboard version). Enable it in every production project.

## Session security

- Sessions live in `HttpOnly`, `Secure` cookies.
- Server functions check the signed-in user on the server and reject cross-site requests.
- Pages that depend on the session are sent with private, no-store cache headers so a shared cache never serves one person's page to another.
- When MFA is required, Postgres RLS checks the session **AAL** claim so a password-only JWT cannot change CMS data through the Supabase API.
