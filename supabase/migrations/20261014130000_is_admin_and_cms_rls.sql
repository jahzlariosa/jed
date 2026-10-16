-- Single source of truth for CMS admin: matches app isAdmin(access) / requireAdmin().

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.user_roles ur
    where ur.user_id = (select auth.uid())
      and ur.role_code = 'admin'
  );
$$;

revoke all on function public.is_admin() from public;
grant execute on function public.is_admin() to authenticated, anon;

-- CMS RLS: admins via is_admin() (replaces has_permission checks on these tables).

drop policy if exists site_settings_select on public.site_settings;
drop policy if exists site_settings_update on public.site_settings;
drop policy if exists media_assets_select on public.media_assets;
drop policy if exists media_assets_insert on public.media_assets;
drop policy if exists media_assets_update on public.media_assets;
drop policy if exists media_assets_delete on public.media_assets;
drop policy if exists content_entries_select on public.content_entries;
drop policy if exists content_entries_insert on public.content_entries;
drop policy if exists content_entries_update on public.content_entries;
drop policy if exists content_entries_delete on public.content_entries;
drop policy if exists content_activity_select on public.content_activity;
drop policy if exists content_activity_insert on public.content_activity;

create policy site_settings_select on public.site_settings
  for select to authenticated
  using ((select public.is_admin()));

create policy site_settings_update on public.site_settings
  for update to authenticated
  using ((select public.is_admin()))
  with check ((select public.is_admin()));

create policy media_assets_select on public.media_assets
  for select to authenticated
  using ((select public.is_admin()));

create policy media_assets_insert on public.media_assets
  for insert to authenticated
  with check ((select public.is_admin()));

create policy media_assets_update on public.media_assets
  for update to authenticated
  using ((select public.is_admin()))
  with check ((select public.is_admin()));

create policy media_assets_delete on public.media_assets
  for delete to authenticated
  using ((select public.is_admin()));

create policy content_entries_select on public.content_entries
  for select to authenticated
  using ((select public.is_admin()));

create policy content_entries_insert on public.content_entries
  for insert to authenticated
  with check ((select public.is_admin()));

create policy content_entries_update on public.content_entries
  for update to authenticated
  using ((select public.is_admin()))
  with check ((select public.is_admin()));

create policy content_entries_delete on public.content_entries
  for delete to authenticated
  using ((select public.is_admin()));

create policy content_activity_select on public.content_activity
  for select to authenticated
  using ((select public.is_admin()));

create policy content_activity_insert on public.content_activity
  for insert to authenticated
  with check ((select public.is_admin()));

drop policy if exists media_bucket_read on storage.objects;
drop policy if exists media_bucket_insert on storage.objects;
drop policy if exists media_bucket_update on storage.objects;
drop policy if exists media_bucket_delete on storage.objects;

create policy media_bucket_read on storage.objects
  for select to authenticated
  using (bucket_id = 'media' and (select public.is_admin()));

create policy media_bucket_insert on storage.objects
  for insert to authenticated
  with check (bucket_id = 'media' and (select public.is_admin()));

create policy media_bucket_update on storage.objects
  for update to authenticated
  using (bucket_id = 'media' and (select public.is_admin()))
  with check (bucket_id = 'media' and (select public.is_admin()));

create policy media_bucket_delete on storage.objects
  for delete to authenticated
  using (bucket_id = 'media' and (select public.is_admin()));
