-- service_role-only admin_set_user_role for atomic user role changes (catalog lock: #44).

create or replace function public.admin_set_user_role(
  p_actor_user_id uuid,
  p_target_user_id uuid,
  p_role_code text
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_admin_holders bigint;
begin
  perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtext('admin_role_catalog'));

  if p_actor_user_id is null or p_target_user_id is null or p_role_code is null then
    raise exception 'forbidden' using errcode = '42501';
  end if;

  if p_actor_user_id = p_target_user_id then
    raise exception 'self role change' using errcode = '42501';
  end if;

  if not exists (
    select 1 from public.roles as r where r.code = p_role_code
  ) then
    raise exception 'role not found' using errcode = 'P0002';
  end if;

  if exists (
    select 1
    from public.role_permissions as rp
    where rp.role_code = p_role_code
      and not exists (
        select 1
        from public.user_roles as ur
        inner join public.role_permissions as actor_rp
          on actor_rp.role_code = ur.role_code
        where ur.user_id = p_actor_user_id
          and actor_rp.permission_code = rp.permission_code
      )
  ) then
    raise exception 'forbidden role' using errcode = '42501';
  end if;

  if exists (
    select 1
    from public.user_roles as ur
    inner join public.role_permissions as rp on rp.role_code = ur.role_code
    where ur.user_id = p_target_user_id
      and not exists (
        select 1
        from public.user_roles as actor_ur
        inner join public.role_permissions as actor_rp
          on actor_rp.role_code = actor_ur.role_code
        where actor_ur.user_id = p_actor_user_id
          and actor_rp.permission_code = rp.permission_code
      )
  ) then
    raise exception 'forbidden target user' using errcode = '42501';
  end if;

  insert into public.user_roles (user_id, role_code)
  values (p_target_user_id, p_role_code)
  on conflict (user_id, role_code) do nothing;

  delete from public.user_roles
  where user_id = p_target_user_id
    and role_code <> p_role_code;

  select pg_catalog.count(distinct ur.user_id) into v_admin_holders
  from public.user_roles as ur
  inner join public.role_permissions as rp on rp.role_code = ur.role_code
  where rp.permission_code = 'admin.access';

  if v_admin_holders < 1 then
    raise exception 'no admin access holders' using errcode = '42501';
  end if;
end;
$$;

revoke all on function public.admin_set_user_role(uuid, uuid, text) from public;
revoke execute on function public.admin_set_user_role(uuid, uuid, text) from anon;
revoke execute on function public.admin_set_user_role(uuid, uuid, text) from authenticated;
grant execute on function public.admin_set_user_role(uuid, uuid, text) to service_role;
