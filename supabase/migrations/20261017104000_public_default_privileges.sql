-- Stop auto-granting new public objects to anon/authenticated; re-apply explicit grants.

alter default privileges for role postgres in schema public
  revoke all on tables from anon, authenticated;

alter default privileges for role postgres in schema public
  revoke all on sequences from anon, authenticated;

alter default privileges for role postgres in schema public
  revoke all on functions from anon, authenticated;

alter default privileges for role postgres in schema public
  revoke execute on functions from public;

-- anon: public read surfaces
grant select on table public.content_entries to anon;
grant select on table public.posts to anon;
grant select on public.profile_bylines to anon;

grant execute on function public.lookup_url_redirect(text) to anon;
grant execute on function public.get_site_auth_redirects() to anon;
grant execute on function public.get_site_mfa_settings() to anon;
grant execute on function public.search_published_content(text, int, int) to anon;
grant execute on function public.get_public_seo_settings() to anon;

-- authenticated: tables (RLS enforces rows)
revoke select on table public.profiles from authenticated;
grant select (user_id, display_name, avatar_url, created_at, updated_at)
  on table public.profiles to authenticated;
grant update (display_name, avatar_url) on table public.profiles to authenticated;

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

grant select on table public.contact_messages to authenticated;
grant update (status) on table public.contact_messages to authenticated;

grant select (
  id,
  user_id,
  name,
  prefix,
  scopes,
  expires_at,
  revoked_at,
  last_used_at,
  created_at
), insert, update on table public.api_tokens to authenticated;

grant select on public.profile_bylines to authenticated;

grant usage, select on all sequences in schema public to authenticated;

-- authenticated: RPCs used by the app
grant execute on function public.has_permission(text) to authenticated;
grant execute on function public.is_admin() to authenticated;
grant execute on function public.lookup_url_redirect(text) to authenticated;
grant execute on function public.get_site_auth_redirects() to authenticated;
grant execute on function public.get_site_mfa_settings() to authenticated;
grant execute on function public.search_published_content(text, int, int) to authenticated;
grant execute on function public.get_public_seo_settings() to authenticated;
grant execute on function public.list_applied_schema_migrations() to authenticated;
grant execute on function public.list_my_api_token_usage() to authenticated;

grant execute on function public.session_aal_is_aal2() to authenticated;
grant execute on function public.rls_requires_aal2_for_admin() to authenticated;
grant execute on function public.rls_requires_aal2_for_permission(text) to authenticated;

-- service_role retains full access for server-side jobs
grant all on all tables in schema public to service_role;
grant all on all sequences in schema public to service_role;
grant execute on all functions in schema public to service_role;
