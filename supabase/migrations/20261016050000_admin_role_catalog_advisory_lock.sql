-- Serialize role catalog RPCs with a transaction-scoped advisory lock.

create or replace function public.admin_update_role_catalog(
  p_actor_user_id uuid,
  p_code text,
  p_name text,
  p_description text,
  p_permission_codes text[]
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_is_system boolean;
  perm text;
  v_admin_holders bigint;
begin
  perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtext('admin_role_catalog'));

  if p_actor_user_id is null then
    raise exception 'forbidden' using errcode = '42501';
  end if;

  if exists (
    select 1
    from pg_catalog.unnest(coalesce(p_permission_codes, array[]::text[])) as req(code)
    where not exists (
      select 1
      from public.user_roles as ur
      inner join public.role_permissions as rp on rp.role_code = ur.role_code
      where ur.user_id = p_actor_user_id
        and rp.permission_code = req.code
    )
  ) then
    raise exception 'forbidden permissions' using errcode = '42501';
  end if;

  select r.is_system into v_is_system
  from public.roles as r
  where r.code = p_code;

  if v_is_system is null then
    raise exception 'role not found' using errcode = 'P0002';
  end if;

  if v_is_system then
    raise exception 'system role' using errcode = '42501';
  end if;

  select pg_catalog.count(distinct ur.user_id) into v_admin_holders
  from public.user_roles as ur
  where (
    exists (
      select 1
      from public.role_permissions as rp
      where rp.role_code = ur.role_code
        and rp.permission_code = 'admin.access'
        and ur.role_code <> p_code
    )
    or (
      ur.role_code = p_code
      and 'admin.access' = any(coalesce(p_permission_codes, array[]::text[]))
    )
  );

  if v_admin_holders < 1 then
    raise exception 'no admin access holders' using errcode = '42501';
  end if;

  update public.roles
  set name = p_name,
      description = p_description
  where code = p_code;

  delete from public.role_permissions
  where role_code = p_code;

  if p_permission_codes is not null then
    foreach perm in array p_permission_codes loop
      insert into public.role_permissions (role_code, permission_code)
      values (p_code, perm);
    end loop;
  end if;
end;
$$;

create or replace function public.admin_delete_role_catalog(
  p_actor_user_id uuid,
  p_code text,
  p_reassign_to_role_code text default null
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_is_system boolean;
  v_member_count bigint;
  v_admin_holders bigint;
  rec record;
begin
  perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtext('admin_role_catalog'));

  if p_actor_user_id is null then
    raise exception 'forbidden' using errcode = '42501';
  end if;

  select r.is_system into v_is_system
  from public.roles as r
  where r.code = p_code;

  if v_is_system is null then
    raise exception 'role not found' using errcode = 'P0002';
  end if;

  if v_is_system then
    raise exception 'system role' using errcode = '42501';
  end if;

  select pg_catalog.count(*) into v_member_count
  from public.user_roles as ur
  where ur.role_code = p_code;

  if v_member_count > 0 and p_reassign_to_role_code is null then
    raise exception 'role has members' using errcode = 'P0001';
  end if;

  if v_member_count > 0 then
    if p_reassign_to_role_code = p_code then
      raise exception 'invalid reassign target' using errcode = '22023';
    end if;
    if not exists (
      select 1 from public.roles as r where r.code = p_reassign_to_role_code
    ) then
      raise exception 'reassign role not found' using errcode = 'P0002';
    end if;

    if exists (
      select 1
      from public.role_permissions as rp
      where rp.role_code = p_reassign_to_role_code
        and not exists (
          select 1
          from public.user_roles as ur
          inner join public.role_permissions as actor_rp
            on actor_rp.role_code = ur.role_code
          where ur.user_id = p_actor_user_id
            and actor_rp.permission_code = rp.permission_code
        )
    ) then
      raise exception 'forbidden reassign target' using errcode = '42501';
    end if;
  end if;

  select pg_catalog.count(distinct sim.user_id) into v_admin_holders
  from (
    select ur.user_id, ur.role_code
    from public.user_roles as ur
    where ur.role_code <> p_code
    union all
    select ur.user_id, p_reassign_to_role_code as role_code
    from public.user_roles as ur
    where ur.role_code = p_code
      and p_reassign_to_role_code is not null
  ) as sim
  inner join public.role_permissions as rp on rp.role_code = sim.role_code
  where rp.permission_code = 'admin.access';

  if v_admin_holders < 1 then
    raise exception 'no admin access holders' using errcode = '42501';
  end if;

  if v_member_count > 0 then
    for rec in
      select ur.user_id
      from public.user_roles as ur
      where ur.role_code = p_code
    loop
      insert into public.user_roles (user_id, role_code)
      values (rec.user_id, p_reassign_to_role_code)
      on conflict (user_id, role_code) do nothing;

      delete from public.user_roles
      where user_id = rec.user_id
        and role_code = p_code;
    end loop;
  end if;

  delete from public.role_permissions where role_code = p_code;
  delete from public.roles where code = p_code;
end;
$$;

revoke all on function public.admin_update_role_catalog(uuid, text, text, text, text[]) from public;
revoke all on function public.admin_delete_role_catalog(uuid, text, text) from public;
revoke execute on function public.admin_update_role_catalog(uuid, text, text, text, text[]) from anon;
revoke execute on function public.admin_delete_role_catalog(uuid, text, text) from anon;
revoke execute on function public.admin_update_role_catalog(uuid, text, text, text, text[]) from authenticated;
revoke execute on function public.admin_delete_role_catalog(uuid, text, text) from authenticated;

grant execute on function public.admin_update_role_catalog(uuid, text, text, text, text[]) to service_role;
grant execute on function public.admin_delete_role_catalog(uuid, text, text) to service_role;
