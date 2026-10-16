# New Postgres table with RLS

Read `AGENTS.md` → Supabase and Security.

1. Add `supabase/migrations/<timestamp>_<name>.sql`.
2. Enable RLS; policies for `anon` / `authenticated` as needed.
3. Revoke `ALL` from `anon` and `authenticated`, then grant column/table minimum.
4. Prefer `has_permission()` in policies; avoid widening system roles via API.
5. Regenerate types if needed; add a focused migration test when grants change.
