-- Admin user directory: filtered pagination with auth + MFA metadata (admin only).

create index if not exists user_roles_role_code_user_id_idx
  on public.user_roles (role_code, user_id);

create or replace function public.admin_list_directory_users(
  p_q text default null,
  p_role text default null,
  p_status text default null,
  p_mfa text default null,
  p_created_from timestamptz default null,
  p_created_to timestamptz default null,
  p_limit integer default 25,
  p_offset integer default 0
)
returns table (
  user_id uuid,
  email text,
  display_name text,
  avatar_url text,
  profile_created_at timestamptz,
  banned_until timestamptz,
  email_confirmed_at timestamptz,
  has_mfa boolean,
  total_count bigint
)
language plpgsql
security definer
set search_path = ''
as $$
begin
  if p_limit is null or p_limit < 1 or p_limit > 100 then
    raise exception 'invalid limit' using errcode = '22023';
  end if;

  if p_offset is null or p_offset < 0 then
    raise exception 'invalid offset' using errcode = '22023';
  end if;

  return query
  with base as (
    select
      p.user_id,
      p.email,
      p.display_name,
      p.avatar_url,
      p.created_at as profile_created_at,
      u.banned_until,
      u.email_confirmed_at,
      exists (
        select 1
        from auth.mfa_factors as mf
        where mf.user_id = p.user_id
          and mf.status = 'verified'
      ) as has_mfa
    from public.profiles as p
    inner join auth.users as u on u.id = p.user_id
    where (
      p_role is null
      or exists (
        select 1
        from public.user_roles as ur
        where ur.user_id = p.user_id
          and ur.role_code = p_role
      )
    )
    and (
      p_q is null
      or p_q = ''
      or p.email ilike ('%' || p_q || '%')
      or coalesce(p.display_name, '') ilike ('%' || p_q || '%')
    )
    and (
      p_created_from is null
      or p.created_at >= p_created_from
    )
    and (
      p_created_to is null
      or p.created_at < (p_created_to + interval '1 day')
    )
    and (
      p_status is null
      or p_status = ''
      or (
        p_status = 'banned'
        and u.banned_until is not null
        and u.banned_until > pg_catalog.now()
      )
      or (
        p_status = 'unconfirmed'
        and u.email_confirmed_at is null
        and (
          u.banned_until is null
          or u.banned_until <= pg_catalog.now()
        )
      )
      or (
        p_status = 'active'
        and u.email_confirmed_at is not null
        and (
          u.banned_until is null
          or u.banned_until <= pg_catalog.now()
        )
      )
    )
    and (
      p_mfa is null
      or p_mfa = ''
      or (p_mfa = 'enabled' and exists (
        select 1
        from auth.mfa_factors as mf
        where mf.user_id = p.user_id
          and mf.status = 'verified'
      ))
      or (p_mfa = 'disabled' and not exists (
        select 1
        from auth.mfa_factors as mf
        where mf.user_id = p.user_id
          and mf.status = 'verified'
      ))
    )
  ),
  counted as (
    select
      b.*,
      count(*) over () as total_count
    from base as b
  )
  select
    c.user_id,
    c.email,
    c.display_name,
    c.avatar_url,
    c.profile_created_at,
    c.banned_until,
    c.email_confirmed_at,
    c.has_mfa,
    c.total_count
  from counted as c
  order by c.profile_created_at desc, c.user_id
  limit p_limit
  offset p_offset;
end;
$$;

revoke all on function public.admin_list_directory_users(
  text,
  text,
  text,
  text,
  timestamptz,
  timestamptz,
  integer,
  integer
) from public;

revoke execute on function public.admin_list_directory_users(
  text,
  text,
  text,
  text,
  timestamptz,
  timestamptz,
  integer,
  integer
) from authenticated;

grant execute on function public.admin_list_directory_users(
  text,
  text,
  text,
  text,
  timestamptz,
  timestamptz,
  integer,
  integer
) to service_role;

revoke execute on function public.admin_list_directory_users(
  text,
  text,
  text,
  text,
  timestamptz,
  timestamptz,
  integer,
  integer
) from anon;
