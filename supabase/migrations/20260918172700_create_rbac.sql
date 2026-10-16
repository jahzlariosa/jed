create table public.permissions (
  code text primary key,
  description text not null
);

create table public.roles (
  code text primary key,
  name text not null,
  description text not null default '',
  is_system boolean not null default false,
  created_at timestamptz not null default now()
);

create table public.role_permissions (
  role_code text not null references public.roles (code) on delete cascade,
  permission_code text not null references public.permissions (code) on delete cascade,
  primary key (role_code, permission_code)
);

create table public.user_roles (
  user_id uuid not null references public.profiles (user_id) on delete cascade,
  role_code text not null references public.roles (code) on delete restrict,
  created_at timestamptz not null default now(),
  primary key (user_id, role_code)
);

create index user_roles_role_code_idx on public.user_roles (role_code);

insert into public.permissions (code, description) values
  ('profiles.read_all', 'Read every profile'),
  ('roles.read_all', 'Read every user role assignment'),
  ('roles.manage', 'Assign and revoke roles');

insert into public.roles (code, name, description, is_system) values
  ('member', 'Member', 'Default access to own account', true),
  ('admin', 'Admin', 'Manage roles and read all profiles', true);

insert into public.role_permissions (role_code, permission_code) values
  ('admin', 'profiles.read_all'),
  ('admin', 'roles.read_all'),
  ('admin', 'roles.manage');

alter table public.permissions enable row level security;
alter table public.roles enable row level security;
alter table public.role_permissions enable row level security;
alter table public.user_roles enable row level security;
alter table public.permissions force row level security;
alter table public.roles force row level security;
alter table public.role_permissions force row level security;
alter table public.user_roles force row level security;

revoke all on table public.permissions from public, anon;
revoke all on table public.roles from public, anon;
revoke all on table public.role_permissions from public, anon;
revoke all on table public.user_roles from public, anon;

grant select on table public.permissions to authenticated;
grant select on table public.roles to authenticated;
grant select on table public.role_permissions to authenticated;
grant select, insert, delete on table public.user_roles to authenticated;
grant select, insert, update, delete on table public.roles to authenticated;
grant select, insert, delete on table public.role_permissions to authenticated;

grant select, insert, update, delete on table public.permissions to service_role;
grant select, insert, update, delete on table public.roles to service_role;
grant select, insert, update, delete on table public.role_permissions to service_role;
grant select, insert, update, delete on table public.user_roles to service_role;

create function public.has_permission(requested_permission text)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.user_roles ur
    join public.role_permissions rp on rp.role_code = ur.role_code
    where ur.user_id = (select auth.uid())
      and rp.permission_code = requested_permission
  );
$$;

revoke all on function public.has_permission(text) from public, anon;
grant execute on function public.has_permission(text) to authenticated, service_role;

create policy permissions_select_authenticated
  on public.permissions
  for select
  to authenticated
  using (true);

create policy roles_select_authenticated
  on public.roles
  for select
  to authenticated
  using (true);

create policy roles_insert_managers
  on public.roles
  for insert
  to authenticated
  with check ((select public.has_permission('roles.manage')));

create policy roles_update_managers
  on public.roles
  for update
  to authenticated
  using ((select public.has_permission('roles.manage')) and is_system = false)
  with check ((select public.has_permission('roles.manage')) and is_system = false);

create policy roles_delete_managers
  on public.roles
  for delete
  to authenticated
  using ((select public.has_permission('roles.manage')) and is_system = false);

create policy role_permissions_select_authenticated
  on public.role_permissions
  for select
  to authenticated
  using (true);

create policy role_permissions_insert_managers
  on public.role_permissions
  for insert
  to authenticated
  with check ((select public.has_permission('roles.manage')));

create policy role_permissions_delete_managers
  on public.role_permissions
  for delete
  to authenticated
  using ((select public.has_permission('roles.manage')));

create policy user_roles_select_own
  on public.user_roles
  for select
  to authenticated
  using ((select auth.uid()) = user_id);

create policy user_roles_select_all
  on public.user_roles
  for select
  to authenticated
  using ((select public.has_permission('roles.read_all')));

create policy user_roles_insert_managers
  on public.user_roles
  for insert
  to authenticated
  with check ((select public.has_permission('roles.manage')));

create policy user_roles_delete_managers
  on public.user_roles
  for delete
  to authenticated
  using ((select public.has_permission('roles.manage')));

create policy profiles_select_all
  on public.profiles
  for select
  to authenticated
  using ((select public.has_permission('profiles.read_all')));

create or replace function private.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (user_id, email)
  values (new.id, new.email);

  insert into public.user_roles (user_id, role_code)
  values (new.id, 'member');

  return new;
end;
$$;

create function private.prevent_last_admin_removal()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if old.role_code = 'admin' then
    if not exists (
      select 1
      from public.user_roles
      where role_code = 'admin'
        and user_id is distinct from old.user_id
    ) then
      raise exception 'Cannot remove the last admin';
    end if;
  end if;

  return old;
end;
$$;

revoke execute on function private.prevent_last_admin_removal() from public, anon, authenticated;

create trigger user_roles_prevent_last_admin
  before delete on public.user_roles
  for each row
  execute function private.prevent_last_admin_removal();
