alter table public.site_settings
  add column if not exists mfa_enabled boolean not null default true,
  add column if not exists mfa_policy text not null default 'optional';

alter table public.site_settings
  drop constraint if exists site_settings_mfa_policy_check;

alter table public.site_settings
  add constraint site_settings_mfa_policy_check
  check (mfa_policy in ('off', 'optional', 'required_admins', 'required_all'));

update public.site_settings
set
  mfa_policy = case
    when require_mfa_for_admins is true then 'required_admins'
    else coalesce(mfa_policy, 'optional')
  end,
  mfa_enabled = true
where id = 1;

alter table public.site_settings
  drop column if exists require_mfa_for_admins;

create or replace function public.get_site_mfa_settings()
returns table (
  mfa_enabled boolean,
  mfa_policy text
)
language sql
stable
security definer
set search_path = public
as $$
  select s.mfa_enabled, s.mfa_policy
  from public.site_settings s
  where s.id = 1;
$$;

revoke all on function public.get_site_mfa_settings() from public;
grant execute on function public.get_site_mfa_settings() to authenticated, anon;
