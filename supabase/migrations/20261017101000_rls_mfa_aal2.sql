-- Require AAL2 for admin RLS when site MFA policy demands step-up (PostgREST / session JWT).

create or replace function public.session_aal_is_aal2()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce((select auth.jwt()->>'aal'), 'aal1') = 'aal2';
$$;

revoke all on function public.session_aal_is_aal2() from public;
grant execute on function public.session_aal_is_aal2() to authenticated, service_role;

create or replace function public.site_mfa_policy_row()
returns table (mfa_enabled boolean, mfa_policy text)
language sql
stable
security definer
set search_path = ''
as $$
  select s.mfa_enabled, s.mfa_policy
  from public.site_settings as s
  where s.id = 1;
$$;

revoke all on function public.site_mfa_policy_row() from public;
grant execute on function public.site_mfa_policy_row() to authenticated, service_role;

create or replace function public.rls_requires_aal2_for_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce((
    select p.mfa_enabled
      and p.mfa_policy in ('required_admins', 'required_all')
    from public.site_mfa_policy_row() as p
  ), false);
$$;

revoke all on function public.rls_requires_aal2_for_admin() from public;
grant execute on function public.rls_requires_aal2_for_admin() to authenticated, service_role;

create or replace function public.rls_requires_aal2_for_permission(requested_permission text)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce((
    select
      p.mfa_enabled
      and (
        p.mfa_policy = 'required_all'
        or (
          p.mfa_policy = 'required_admins'
          and requested_permission in (
            'admin.access',
            'content.read',
            'content.write',
            'media.read',
            'media.write',
            'settings.read',
            'settings.write',
            'profiles.read_all',
            'roles.read_all',
            'roles.manage'
          )
        )
      )
    from public.site_mfa_policy_row() as p
  ), false);
$$;

revoke all on function public.rls_requires_aal2_for_permission(text) from public;
grant execute on function public.rls_requires_aal2_for_permission(text) to authenticated, service_role;

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.user_roles as ur
    where ur.user_id = (select auth.uid())
      and ur.role_code = 'admin'
  )
  and (
    not (select public.rls_requires_aal2_for_admin())
    or (select public.session_aal_is_aal2())
  );
$$;

revoke all on function public.is_admin() from public;
grant execute on function public.is_admin() to authenticated, anon;

create or replace function public.has_permission(requested_permission text)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.user_roles as ur
    inner join public.role_permissions as rp on rp.role_code = ur.role_code
    where ur.user_id = (select auth.uid())
      and rp.permission_code = requested_permission
  )
  and (
    not (select public.rls_requires_aal2_for_permission(requested_permission))
    or (select public.session_aal_is_aal2())
  );
$$;

revoke all on function public.has_permission(text) from public, anon;
grant execute on function public.has_permission(text) to authenticated, service_role;
