insert into public.permissions (code, description)
values ('admin.access', 'Open the admin panel')
on conflict (code) do nothing;

insert into public.role_permissions (role_code, permission_code)
values ('admin', 'admin.access')
on conflict do nothing;
