-- Public read for published CMS pages (kind = page). Admin CRUD unchanged.

drop policy if exists content_entries_select_public on public.content_entries;

create policy content_entries_select_public
  on public.content_entries
  for select
  to anon, authenticated
  using (
    kind = 'page'
    and (
      status = 'published'
      or (
        status = 'scheduled'
        and coalesce(scheduled_at, published_at) is not null
        and coalesce(scheduled_at, published_at) <= timezone('utc', now())
      )
    )
  );
