-- Full-text search for published posts and pages (anon reads via SECURITY DEFINER RPC).

alter table public.posts
  add column if not exists search_document tsvector;

create or replace function public.posts_search_document_update()
returns trigger
language plpgsql
as $$
begin
  new.search_document :=
    setweight(to_tsvector('english', coalesce(new.title, '')), 'A')
    || setweight(to_tsvector('english', coalesce(new.excerpt, '')), 'B')
    || setweight(to_tsvector('english', regexp_replace(coalesce(new.body_html, ''), '<[^>]+>', ' ', 'g')), 'C')
    || setweight(to_tsvector('english', coalesce(new.speaker, '')), 'D');
  return new;
end;
$$;

drop trigger if exists posts_search_document_trg on public.posts;
create trigger posts_search_document_trg
  before insert or update of title, excerpt, body_html, speaker
  on public.posts
  for each row
  execute function public.posts_search_document_update();

update public.posts
set search_document =
  setweight(to_tsvector('english', coalesce(title, '')), 'A')
  || setweight(to_tsvector('english', coalesce(excerpt, '')), 'B')
  || setweight(to_tsvector('english', regexp_replace(coalesce(body_html, ''), '<[^>]+>', ' ', 'g')), 'C')
  || setweight(to_tsvector('english', coalesce(speaker, '')), 'D');

create index if not exists posts_search_document_gin
  on public.posts using gin (search_document);

alter table public.content_entries
  add column if not exists search_document tsvector;

create or replace function public.content_entries_search_document_update()
returns trigger
language plpgsql
as $$
declare
  body_text text;
begin
  body_text := coalesce(new.meta_description, '');
  new.search_document :=
    setweight(to_tsvector('english', coalesce(new.title, '')), 'A')
    || setweight(to_tsvector('english', body_text), 'B')
    || setweight(to_tsvector('english', coalesce(new.slug, '')), 'C');
  return new;
end;
$$;

drop trigger if exists content_entries_search_document_trg on public.content_entries;
create trigger content_entries_search_document_trg
  before insert or update of title, meta_description, slug
  on public.content_entries
  for each row
  execute function public.content_entries_search_document_update();

update public.content_entries
set search_document =
  setweight(to_tsvector('english', coalesce(title, '')), 'A')
  || setweight(to_tsvector('english', coalesce(meta_description, '')), 'B')
  || setweight(to_tsvector('english', coalesce(slug, '')), 'C')
where kind = 'page';

create index if not exists content_entries_search_document_gin
  on public.content_entries using gin (search_document);

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
set search_path = public
as $$
declare
  q text := trim(coalesce(search_query, ''));
  tsq tsquery;
begin
  if char_length(q) < 1 then
    return;
  end if;

  page_limit := least(greatest(page_limit, 1), 50);
  page_offset := greatest(page_offset, 0);

  begin
    tsq := websearch_to_tsquery('english', q);
  exception when others then
    tsq := plainto_tsquery('english', q);
  end;

  return query
  (
    select
      'post'::text as result_kind,
      p.slug,
      p.title,
      left(coalesce(nullif(p.excerpt, ''), regexp_replace(p.body_html, '<[^>]+>', ' ', 'g')), 280) as excerpt,
      ts_rank(p.search_document, tsq) as rank,
      ts_headline('english', p.title, tsq, 'StartSel=<mark>, StopSel=</mark>') as headline
    from public.posts p
    where (
      p.status = 'published'
      or (
        p.status = 'scheduled'
        and p.published_at is not null
        and p.published_at <= timezone('utc', now())
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
      left(coalesce(c.meta_description, ''), 280) as excerpt,
      ts_rank(c.search_document, tsq) as rank,
      ts_headline('english', c.title, tsq, 'StartSel=<mark>, StopSel=</mark>') as headline
    from public.content_entries c
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
