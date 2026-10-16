-- Batch: redirects, audit log, media limits, MFA setting, role swap RPC, path checks, grants hygiene.

alter table public.site_settings
  add column if not exists contact_email text
    check (contact_email is null or char_length(contact_email) between 3 and 255),
  add column if not exists require_mfa_for_admins boolean not null default false;

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

create table if not exists public.url_redirects (
  id uuid primary key default gen_random_uuid(),
  from_path text not null unique
    check (from_path ~ '^/(?!/)(?!.*\.\.)[A-Za-z0-9/._?=&-]*$'),
  to_path text not null
    check (to_path ~ '^/(?!/)(?!.*\.\.)[A-Za-z0-9/._?=&-]*$'),
  status_code smallint not null default 301 check (status_code in (301, 302)),
  enabled boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists url_redirects_from_enabled_idx
  on public.url_redirects (from_path)
  where enabled = true;

alter table public.url_redirects enable row level security;

drop policy if exists url_redirects_select on public.url_redirects;
drop policy if exists url_redirects_write on public.url_redirects;

create policy url_redirects_select on public.url_redirects
  for select to authenticated
  using ((select public.is_admin()));

create policy url_redirects_write on public.url_redirects
  for all to authenticated
  using ((select public.is_admin()))
  with check ((select public.is_admin()));

create table if not exists public.audit_log (
  id uuid primary key default gen_random_uuid(),
  actor_user_id uuid references auth.users (id) on delete set null,
  action text not null,
  target_type text not null,
  target_id text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists audit_log_created_at_idx on public.audit_log (created_at desc);

alter table public.audit_log enable row level security;

drop policy if exists audit_log_select on public.audit_log;
drop policy if exists audit_log_insert on public.audit_log;

create policy audit_log_select on public.audit_log
  for select to authenticated
  using ((select public.is_admin()));

create policy audit_log_insert on public.audit_log
  for insert to authenticated
  with check (actor_user_id = (select auth.uid()));

create or replace function public.lookup_url_redirect(request_path text)
returns table (to_path text, status_code smallint)
language sql
stable
security definer
set search_path = ''
as $$
  select r.to_path, r.status_code
  from public.url_redirects r
  where r.enabled = true
    and r.from_path = request_path
  limit 1;
$$;

revoke all on function public.lookup_url_redirect(text) from public;
grant execute on function public.lookup_url_redirect(text) to authenticated, anon;

create or replace function public.set_user_role_atomic(
  target_user_id uuid,
  new_role_code text
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  admin_count integer;
begin
  if not public.is_admin() then
    raise exception 'forbidden';
  end if;

  select count(*)::integer into admin_count
  from public.user_roles
  where role_code = 'admin';

  if exists (
    select 1 from public.user_roles
    where user_id = target_user_id and role_code = 'admin'
  ) and new_role_code <> 'admin' and admin_count <= 1 then
    raise exception 'last_admin';
  end if;

  delete from public.user_roles where user_id = target_user_id;
  insert into public.user_roles (user_id, role_code)
  values (target_user_id, new_role_code);
end;
$$;

revoke all on function public.set_user_role_atomic(uuid, text) from public;
grant execute on function public.set_user_role_atomic(uuid, text) to authenticated;

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
set search_path = ''
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

create schema if not exists private;

create or replace function private.is_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.user_roles ur
    where ur.user_id = (select auth.uid())
      and ur.role_code = 'admin'
  );
$$;

revoke all on function private.is_admin() from public;
grant execute on function private.is_admin() to authenticated;

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select private.is_admin();
$$;

revoke all on function public.is_admin() from public;
grant execute on function public.is_admin() to authenticated;

update storage.buckets
set
  file_size_limit = 8388608,
  allowed_mime_types = array[
    'image/jpeg',
    'image/png',
    'image/webp',
    'image/gif',
    'image/avif'
  ]::text[]
where id = 'media';

revoke all on table public.url_redirects from anon;
grant select on table public.url_redirects to authenticated;
