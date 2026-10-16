-- 1) System roles (is_system = true: member, admin) must not have their permission
--    mappings changed through the API. A roles.manage holder could otherwise strip
--    permissions from `admin` or grant any permission to `member` (every signup).
--    Mappings for system roles are changed by migrations (which bypass RLS) only.
drop policy if exists role_permissions_insert_managers on public.role_permissions;
drop policy if exists role_permissions_delete_managers on public.role_permissions;

create policy role_permissions_insert_managers
  on public.role_permissions
  for insert
  to authenticated
  with check (
    (select public.has_permission('roles.manage'))
    and exists (
      select 1
      from public.roles r
      where r.code = role_code
        and r.is_system = false
    )
  );

create policy role_permissions_delete_managers
  on public.role_permissions
  for delete
  to authenticated
  using (
    (select public.has_permission('roles.manage'))
    and exists (
      select 1
      from public.roles r
      where r.code = role_code
        and r.is_system = false
    )
  );

-- 2) Users must not rewrite their own profile (email is display identity in the admin
--    directory). There are no user-editable profile columns today, so remove the UPDATE
--    grant and policy. Email still syncs via private.handle_user_email_updated
--    (SECURITY DEFINER trigger on auth.users), which does not need this grant.
--    If a user-editable column is added later, grant UPDATE on that column only.
drop policy if exists profiles_update_own on public.profiles;
revoke update on table public.profiles from authenticated;
