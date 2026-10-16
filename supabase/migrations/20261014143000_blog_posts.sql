-- Blog posts table (no notes migration — notes table not used in this starter).

create table if not exists public.posts (
  id uuid primary key default gen_random_uuid(),
  kind text not null default 'article'
    check (kind in ('article', 'project', 'learning', 'update')),
  slug text not null,
  title text not null check (char_length(title) between 1 and 200),
  speaker text not null default '' check (char_length(speaker) <= 200),
  excerpt text not null default '' check (char_length(excerpt) <= 500),
  body_html text not null default '',
  body_blocks jsonb not null default '[]'::jsonb,
  cover_image_url text
    check (cover_image_url is null or char_length(cover_image_url) <= 2000),
  tags text[] not null default '{}'::text[],
  video_url text
    check (video_url is null or char_length(video_url) <= 2000),
  published_at timestamptz,
  status text not null default 'draft'
    check (status in ('draft', 'published', 'scheduled', 'trash')),
  featured_media_id uuid references public.media_assets (id) on delete set null,
  meta_title text check (meta_title is null or char_length(meta_title) <= 200),
  meta_description text
    check (meta_description is null or char_length(meta_description) <= 500),
  author_id uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint posts_slug_key unique (slug),
  constraint posts_slug_format check (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$')
);

create index if not exists posts_status_published_at_idx
  on public.posts (status, published_at desc nulls last);

create index if not exists posts_kind_status_idx
  on public.posts (kind, status);

create index if not exists posts_status_updated_at_idx
  on public.posts (status, updated_at desc);

alter table public.posts enable row level security;

drop policy if exists posts_select_public on public.posts;
create policy posts_select_public
  on public.posts for select to anon, authenticated
  using (
    status = 'published'
    or (
      status = 'scheduled'
      and published_at is not null
      and published_at <= timezone('utc', now())
    )
  );

drop policy if exists posts_select_admin on public.posts;
create policy posts_select_admin
  on public.posts for select to authenticated
  using ((select public.is_admin()));

drop policy if exists posts_insert_admin on public.posts;
create policy posts_insert_admin
  on public.posts for insert to authenticated
  with check ((select public.is_admin()));

drop policy if exists posts_update_admin on public.posts;
create policy posts_update_admin
  on public.posts for update to authenticated
  using ((select public.is_admin()))
  with check ((select public.is_admin()));

drop policy if exists posts_delete_admin on public.posts;
create policy posts_delete_admin
  on public.posts for delete to authenticated
  using ((select public.is_admin()));
