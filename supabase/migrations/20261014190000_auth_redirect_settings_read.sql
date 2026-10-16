-- Post-sign-in paths are not secret; members need them without admin-only site_settings SELECT.

create or replace function public.get_site_auth_redirects()
returns table (
  redirect_after_sign_in_admin text,
  redirect_after_sign_in_user text,
  redirect_after_sign_up text,
  redirect_after_password_reset text,
  redirect_after_sign_out text
)
language sql
stable
security definer
set search_path = public
as $$
  select
    s.redirect_after_sign_in_admin,
    s.redirect_after_sign_in_user,
    s.redirect_after_sign_up,
    s.redirect_after_password_reset,
    s.redirect_after_sign_out
  from public.site_settings s
  where s.id = 1;
$$;

revoke all on function public.get_site_auth_redirects() from public;
grant execute on function public.get_site_auth_redirects() to authenticated, anon;
