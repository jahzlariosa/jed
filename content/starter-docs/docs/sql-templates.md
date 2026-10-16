---
title: SQL templates
description: The migration catalog in the admin panel, and how to apply schema changes.
slug: /docs/sql-templates
order: 9
---

# SQL templates

**Admin > SQL templates** (`/admin/sql-templates`) lists every database migration that ships with the site, so you can see what's applied and copy anything that isn't. It needs the `admin.access` permission.

## What you see

For every file in `supabase/migrations/`, plus `supabase/seed.sql`:

- A plain-English summary of what it does.
- When to run it.
- Whether it's **applied** or **not applied** on the connected database.
- The full SQL, collapsed by default, with a **Copy** button.

The files are bundled when the site is built, so the list always matches the deployed code.

## The screen never runs SQL

Nothing on this screen changes your database. To apply a migration, use the Supabase CLI:

```bash
npx supabase db push
```

or copy the SQL into the Supabase SQL Editor and run it yourself. Run files in filename order and don't skip any.

## When everything shows "not applied"

The applied status comes from a database function added in `20261015161000_admin_schema_migrations_rpc.sql`. If that migration hasn't run, or the site points at a different Supabase project than you expect, every row shows "not applied". Apply that file and check which project `VITE_SUPABASE_URL` points to.

## Adding a migration

Every new migration file needs a matching entry in `src/lib/cms/migration-explanations.ts` with a summary and a "when to run" note. A test fails in CI if one is missing.

## Reading templates through the API

Admins can list templates with `GET /api/v1/sql-templates` and read one with `GET /api/v1/sql-templates/:id`. MCP clients use `list_sql_templates` and `get_sql_template`. Both are read only, and nothing in the API can run SQL.
