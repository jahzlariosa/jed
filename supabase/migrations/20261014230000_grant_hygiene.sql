-- Revoke broad table grants; grant only what RLS-backed API paths need.

revoke all on table public.profiles from anon;
revoke all on table public.permissions from anon;
revoke all on table public.roles from anon;
revoke all on table public.role_permissions from anon;
revoke all on table public.user_roles from anon;
revoke all on table public.site_settings from anon;
revoke all on table public.media_assets from anon;
revoke all on table public.content_entries from anon;
revoke all on table public.content_activity from anon;
revoke all on table public.posts from anon;
revoke all on table public.url_redirects from anon;
revoke all on table public.audit_log from anon;

revoke all on table public.profiles from authenticated;
revoke all on table public.permissions from authenticated;
revoke all on table public.roles from authenticated;
revoke all on table public.role_permissions from authenticated;
revoke all on table public.user_roles from authenticated;
revoke all on table public.site_settings from authenticated;
revoke all on table public.media_assets from authenticated;
revoke all on table public.content_entries from authenticated;
revoke all on table public.content_activity from authenticated;
revoke all on table public.posts from authenticated;
revoke all on table public.url_redirects from authenticated;
revoke all on table public.audit_log from authenticated;

-- anon: public read surfaces + redirect lookup
grant select on table public.content_entries to anon;
grant select on table public.posts to anon;

grant execute on function public.lookup_url_redirect(text) to anon;
grant execute on function public.get_site_auth_redirects() to anon;

-- authenticated: RBAC + CMS (RLS enforces rows)
grant select on table public.profiles to authenticated;
grant select on table public.permissions to authenticated;
grant select on table public.roles to authenticated;
grant select on table public.role_permissions to authenticated;
grant select, insert, delete on table public.user_roles to authenticated;
grant select, insert, update, delete on table public.roles to authenticated;
grant select, insert, delete on table public.role_permissions to authenticated;

grant select, update on table public.site_settings to authenticated;

grant select, insert, update, delete on table public.media_assets to authenticated;
grant select, insert, update, delete on table public.content_entries to authenticated;
grant select, insert on table public.content_activity to authenticated;
grant select, insert, update, delete on table public.posts to authenticated;

grant select, insert, update, delete on table public.url_redirects to authenticated;
grant select, insert on table public.audit_log to authenticated;

grant execute on function public.has_permission(text) to authenticated;
grant execute on function public.is_admin() to authenticated;
grant execute on function public.lookup_url_redirect(text) to authenticated;
grant execute on function public.get_site_auth_redirects() to authenticated;
grant execute on function public.set_user_role_atomic(uuid, text) to authenticated;
