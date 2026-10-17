-- Pin search_path on SECURITY DEFINER RPCs (schema-qualify builtins).

create or replace function public.get_site_mfa_settings()
returns table (
  mfa_enabled boolean,
  mfa_policy text
)
language sql
stable
security definer
set search_path = ''
as $$
  select s.mfa_enabled, s.mfa_policy
  from public.site_settings as s
  where s.id = 1;
$$;

revoke all on function public.get_site_mfa_settings() from public;
grant execute on function public.get_site_mfa_settings() to authenticated, anon;

create or replace function public.search_published_content(
  search_query text,
  page_limit int default 20,
  page_offset int default 0
)
returns table (
  result_kind text,
  slug text,
  title text,
  excerpt text,
  rank real,
  headline text
)
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  q text := pg_catalog.btrim(pg_catalog.coalesce(search_query, ''));
  tsq tsquery;
begin
  if pg_catalog.char_length(q) < 1 then
    return;
  end if;

  page_limit := pg_catalog.least(pg_catalog.greatest(page_limit, 1), 50);
  page_offset := pg_catalog.greatest(page_offset, 0);

  begin
    tsq := pg_catalog.websearch_to_tsquery('english', q);
  exception when others then
    tsq := pg_catalog.plainto_tsquery('english', q);
  end;

  return query
  (
    select
      'post'::text as result_kind,
      p.slug,
      p.title,
      pg_catalog.left(
        pg_catalog.coalesce(
          pg_catalog.nullif(p.excerpt, ''),
          pg_catalog.regexp_replace(p.body_html, '<[^>]+>', ' ', 'g')
        ),
        280
      ) as excerpt,
      pg_catalog.ts_rank(p.search_document, tsq) as rank,
      pg_catalog.ts_headline(
        'english',
        p.title,
        tsq,
        'StartSel=<mark>, StopSel=</mark>'
      ) as headline
    from public.posts as p
    where (
      p.status = 'published'
      or (
        p.status = 'scheduled'
        and p.published_at is not null
        and p.published_at <= pg_catalog.timezone('utc', pg_catalog.now())
      )
    )
    and p.search_document @@ tsq
  )
  union all
  (
    select
      'page'::text as result_kind,
      c.slug,
      c.title,
      pg_catalog.left(pg_catalog.coalesce(c.meta_description, ''), 280) as excerpt,
      pg_catalog.ts_rank(c.search_document, tsq) as rank,
      pg_catalog.ts_headline(
        'english',
        c.title,
        tsq,
        'StartSel=<mark>, StopSel=</mark>'
      ) as headline
    from public.content_entries as c
    where c.kind = 'page'
      and c.status = 'published'
      and c.search_document @@ tsq
  )
  order by rank desc
  limit page_limit
  offset page_offset;
end;
$$;

revoke all on function public.search_published_content(text, int, int) from public;
grant execute on function public.search_published_content(text, int, int) to anon, authenticated;

drop function if exists public.list_applied_schema_migrations();

create or replace function public.list_applied_schema_migrations()
returns table (version text, name text)
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  if not (select public.is_admin()) then
    raise exception 'forbidden' using errcode = '42501';
  end if;
  return query
  select m.version::text, m.name::text
  from supabase_migrations.schema_migrations as m
  order by m.version;
end;
$$;

revoke all on function public.list_applied_schema_migrations() from public;
grant execute on function public.list_applied_schema_migrations() to authenticated;
revoke execute on function public.list_applied_schema_migrations() from anon;
