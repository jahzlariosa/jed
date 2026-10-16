-- Local development seed. Runs on `supabase db reset` only (never on `supabase db push`).
--
-- Roles, permissions and role_permissions are created by the migrations, so there is
-- nothing to seed. We deliberately do NOT create a user with a known password.
-- To get an admin locally: sign up at http://localhost:3000/signup, then run the
-- "first admin" SQL from README.md in Studio (http://127.0.0.1:54323) or psql.
select 1;
