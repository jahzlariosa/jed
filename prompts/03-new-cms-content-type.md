# New CMS content type

Read `AGENTS.md` → Data, Security, Caching.

1. Migration: table + RLS (`authenticated` + `has_permission` / ownership).
2. Grant only required privileges in the migration (revoke broad grants first).
3. `createServerFn` with `.validator()` + `requirePermission`.
4. Admin screen under `src/routes/_authenticated/admin` and nav in `admin-nav.ts`.
5. Update `AGENTS.md` catch-up.
