---
title: Deploying to Vercel
description: Import the project, set environment variables, and connect Supabase auth to your domain.
slug: /docs/deploy
order: 3
---

# Deploying to Vercel

1. In Vercel, choose **Add New > Project** and import your GitHub repository.
2. Use these build settings:
   - Install command: `npm ci`
   - Build command: `npm run build`
   - Node.js: 22.x, to match `.nvmrc`
   - Framework preset: **Other** works fine
3. Add the environment variables listed in [Environment variables](/docs/environment).
4. Deploy and note the production URL.
5. In Supabase, open **Authentication > URL Configuration**:
   - **Site URL**: your production `APP_URL`
   - **Redirect URLs**: `https://<your-domain>/auth/callback`, `https://<your-domain>/reset-password`, and any preview URLs you use. If your project allows wildcards, `https://*.vercel.app/auth/callback` covers previews.
6. If you change environment variables later, redeploy.

## Pull requests

Every pull request runs CI in GitHub Actions: `npm ci`, Biome, typecheck, tests, build, and `npm audit --omit=dev --audit-level=high`. Vercel also builds a preview URL for each pull request. Protect `main` by requiring the **Lint, typecheck, test, build, audit** check.

## Keep projects separate

Give every client their own Supabase project and their own Vercel project. Don't share keys between clients, and keep development and production databases apart.
