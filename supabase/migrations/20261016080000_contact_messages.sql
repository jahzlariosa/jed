-- Contact form inbox. Public visitors never touch this table directly:
-- the server inserts with the service role, admins read and set status.

create table if not exists public.contact_messages (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text not null,
  message text not null,
  ip_hash text,
  user_agent text,
  status text not null default 'new',
  created_at timestamptz not null default now(),
  constraint contact_messages_name_len check (char_length(name) between 1 and 120),
  constraint contact_messages_email_len check (char_length(email) between 3 and 320),
  constraint contact_messages_message_len check (char_length(message) between 1 and 4000),
  constraint contact_messages_ip_hash_len check (ip_hash is null or char_length(ip_hash) <= 128),
  constraint contact_messages_user_agent_len check (user_agent is null or char_length(user_agent) <= 500),
  constraint contact_messages_status_check check (status in ('new', 'read', 'archived'))
);

create index if not exists contact_messages_created_at_idx
  on public.contact_messages (created_at desc);

create index if not exists contact_messages_ip_hash_created_at_idx
  on public.contact_messages (ip_hash, created_at desc);

alter table public.contact_messages enable row level security;

revoke all on table public.contact_messages from anon, authenticated;
grant select on table public.contact_messages to authenticated;
grant update (status) on table public.contact_messages to authenticated;
grant all on table public.contact_messages to service_role;

drop policy if exists contact_messages_admin_select on public.contact_messages;
drop policy if exists contact_messages_admin_update on public.contact_messages;

create policy contact_messages_admin_select on public.contact_messages
  for select to authenticated
  using ((select public.has_permission('admin.access')));

create policy contact_messages_admin_update on public.contact_messages
  for update to authenticated
  using ((select public.has_permission('admin.access')))
  with check ((select public.has_permission('admin.access')));
