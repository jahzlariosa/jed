-- Profile email is sensitive: expose display_name/avatar_url for bylines, not email.

drop policy if exists profiles_select_all on public.profiles;

create policy profiles_select_bylines
  on public.profiles
  for select
  to authenticated
  using (true);

-- Column grants: authenticated can read public fields on any row RLS allows.
revoke select on table public.profiles from authenticated;
grant select (user_id, display_name, avatar_url, created_at, updated_at)
  on table public.profiles to authenticated;

-- Anonymous bylines (public blog, marketing) without email.
grant select (user_id, display_name, avatar_url)
  on table public.profiles to anon;

create policy profiles_select_bylines_anon
  on public.profiles
  for select
  to anon
  using (true);

create or replace view public.profile_bylines
  with (security_invoker = true)
as
  select
    user_id,
    display_name,
    avatar_url
  from public.profiles;

grant select on public.profile_bylines to authenticated, anon;
