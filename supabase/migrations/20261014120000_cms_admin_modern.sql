-- CMS tables for modern /admin (content, media, settings, activity).

insert into public.permissions (code, description) values
  ('content.read', 'Read site content entries'),
  ('content.write', 'Create and edit content entries'),
  ('media.read', 'Read media library'),
  ('media.write', 'Upload and delete media'),
  ('settings.read', 'Read site settings'),
  ('settings.write', 'Update site settings')
on conflict (code) do nothing;

insert into public.role_permissions (role_code, permission_code)
select 'admin', code
from public.permissions
where code in (
  'content.read',
  'content.write',
  'media.read',
  'media.write',
  'settings.read',
  'settings.write'
)
on conflict do nothing;

create table if not exists public.site_settings (
  id smallint primary key default 1 check (id = 1),
  site_name text not null default 'Site name',
  site_url text,
  timezone text not null default 'UTC',
  language text not null default 'en',
  brand_hex text not null default '#4F46E5',
  logo_url text,
  seo_title_template text not null default '{title} · {site}',
  seo_default_description text,
  social_image_url text,
  analytics_id text,
  webhook_url text,
  updated_at timestamptz not null default now()
);

alter table public.site_settings enable row level security;

create table if not exists public.media_assets (
  id uuid primary key default gen_random_uuid(),
  filename text not null,
  storage_path text not null unique,
  mime_type text not null,
  byte_size bigint not null check (byte_size >= 0),
  alt_text text,
  created_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now()
);

create index if not exists media_assets_created_at_idx
  on public.media_assets (created_at desc);

alter table public.media_assets enable row level security;

create table if not exists public.content_entries (
  id uuid primary key default gen_random_uuid(),
  kind text not null check (kind in ('page', 'post')),
  title text not null,
  slug text not null,
  status text not null default 'draft' check (status in ('draft', 'published', 'scheduled')),
  body jsonb not null default '[]'::jsonb,
  show_in_nav boolean not null default false,
  published_at timestamptz,
  scheduled_at timestamptz,
  tags text[] not null default '{}',
  featured_media_id uuid references public.media_assets (id) on delete set null,
  meta_title text,
  meta_description text,
  created_by uuid references auth.users (id) on delete set null,
  updated_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint content_entries_slug_key unique (slug)
);

create index if not exists content_entries_status_updated_idx
  on public.content_entries (status, updated_at desc);

create index if not exists content_entries_kind_status_idx
  on public.content_entries (kind, status);

alter table public.content_entries enable row level security;

create table if not exists public.content_activity (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid references auth.users (id) on delete set null,
  action text not null,
  summary text not null,
  entity_type text not null,
  entity_id uuid,
  created_at timestamptz not null default now()
);

create index if not exists content_activity_created_at_idx
  on public.content_activity (created_at desc);

alter table public.content_activity enable row level security;

-- RLS: authenticated + has_permission
create policy site_settings_select on public.site_settings
  for select to authenticated
  using (public.has_permission('settings.read') or public.has_permission('admin.access'));

create policy site_settings_update on public.site_settings
  for update to authenticated
  using (public.has_permission('settings.write'))
  with check (public.has_permission('settings.write'));

create policy media_assets_select on public.media_assets
  for select to authenticated
  using (public.has_permission('media.read') or public.has_permission('admin.access'));

create policy media_assets_insert on public.media_assets
  for insert to authenticated
  with check (public.has_permission('media.write'));

create policy media_assets_update on public.media_assets
  for update to authenticated
  using (public.has_permission('media.write'))
  with check (public.has_permission('media.write'));

create policy media_assets_delete on public.media_assets
  for delete to authenticated
  using (public.has_permission('media.write'));

create policy content_entries_select on public.content_entries
  for select to authenticated
  using (public.has_permission('content.read') or public.has_permission('admin.access'));

create policy content_entries_insert on public.content_entries
  for insert to authenticated
  with check (public.has_permission('content.write'));

create policy content_entries_update on public.content_entries
  for update to authenticated
  using (public.has_permission('content.write'))
  with check (public.has_permission('content.write'));

create policy content_entries_delete on public.content_entries
  for delete to authenticated
  using (public.has_permission('content.write'));

create policy content_activity_select on public.content_activity
  for select to authenticated
  using (public.has_permission('content.read') or public.has_permission('admin.access'));

create policy content_activity_insert on public.content_activity
  for insert to authenticated
  with check (public.has_permission('content.write'));

insert into public.site_settings (id) values (1) on conflict (id) do nothing;

insert into storage.buckets (id, name, public)
values ('media', 'media', true)
on conflict (id) do nothing;

create policy media_bucket_read on storage.objects
  for select to authenticated
  using (bucket_id = 'media');

create policy media_bucket_insert on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'media'
    and public.has_permission('media.write')
  );

create policy media_bucket_update on storage.objects
  for update to authenticated
  using (bucket_id = 'media' and public.has_permission('media.write'))
  with check (bucket_id = 'media' and public.has_permission('media.write'));

create policy media_bucket_delete on storage.objects
  for delete to authenticated
  using (bucket_id = 'media' and public.has_permission('media.write'));
