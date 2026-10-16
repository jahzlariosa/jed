-- Allow '.' in redirect paths (e.g. /blog/post.html); idempotent policy refresh.

alter table public.site_settings
  drop constraint if exists site_settings_redirect_after_sign_in_admin_path,
  drop constraint if exists site_settings_redirect_after_sign_in_user_path,
  drop constraint if exists site_settings_redirect_after_sign_up_path,
  drop constraint if exists site_settings_redirect_after_password_reset_path,
  drop constraint if exists site_settings_redirect_after_sign_out_path;

alter table public.site_settings
  add constraint site_settings_redirect_after_sign_in_admin_path
    check (redirect_after_sign_in_admin ~ '^/(?!/)(?!.*\.\.)[A-Za-z0-9/._?=&-]*$'),
  add constraint site_settings_redirect_after_sign_in_user_path
    check (redirect_after_sign_in_user ~ '^/(?!/)(?!.*\.\.)[A-Za-z0-9/._?=&-]*$'),
  add constraint site_settings_redirect_after_sign_up_path
    check (redirect_after_sign_up ~ '^/(?!/)(?!.*\.\.)[A-Za-z0-9/._?=&-]*$'),
  add constraint site_settings_redirect_after_password_reset_path
    check (redirect_after_password_reset ~ '^/(?!/)(?!.*\.\.)[A-Za-z0-9/._?=&-]*$'),
  add constraint site_settings_redirect_after_sign_out_path
    check (redirect_after_sign_out ~ '^/(?!/)(?!.*\.\.)[A-Za-z0-9/._?=&-]*$');

alter table public.url_redirects
  drop constraint if exists url_redirects_from_path_check,
  drop constraint if exists url_redirects_to_path_check;

alter table public.url_redirects
  add constraint url_redirects_from_path_check
    check (from_path ~ '^/(?!/)(?!.*\.\.)[A-Za-z0-9/._?=&-]*$'),
  add constraint url_redirects_to_path_check
    check (to_path ~ '^/(?!/)(?!.*\.\.)[A-Za-z0-9/._?=&-]*$');

drop policy if exists url_redirects_select on public.url_redirects;
drop policy if exists url_redirects_write on public.url_redirects;

create policy url_redirects_select on public.url_redirects
  for select to authenticated
  using ((select public.is_admin()));

create policy url_redirects_write on public.url_redirects
  for all to authenticated
  using ((select public.is_admin()))
  with check ((select public.is_admin()));

drop policy if exists audit_log_select on public.audit_log;
drop policy if exists audit_log_insert on public.audit_log;

create policy audit_log_select on public.audit_log
  for select to authenticated
  using ((select public.is_admin()));

create policy audit_log_insert on public.audit_log
  for insert to authenticated
  with check (actor_user_id = (select auth.uid()));
