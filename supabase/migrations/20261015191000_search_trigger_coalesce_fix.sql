-- Fix search_document triggers: coalesce is not in pg_catalog (42883 on insert/update).

create or replace function public.posts_search_document_update()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.search_document :=
    pg_catalog.setweight(
      pg_catalog.to_tsvector('english', coalesce(new.title, '')),
      'A'
    )
    || pg_catalog.setweight(
      pg_catalog.to_tsvector('english', coalesce(new.excerpt, '')),
      'B'
    )
    || pg_catalog.setweight(
      pg_catalog.to_tsvector(
        'english',
        pg_catalog.regexp_replace(
          coalesce(new.body_html, ''),
          '<[^>]+>',
          ' ',
          'g'
        )
      ),
      'C'
    )
    || pg_catalog.setweight(
      pg_catalog.to_tsvector('english', coalesce(new.speaker, '')),
      'D'
    );
  return new;
end;
$$;

create or replace function public.content_entries_search_document_update()
returns trigger
language plpgsql
set search_path = ''
as $$
declare
  body_text text;
begin
  body_text := coalesce(new.meta_description, '');
  new.search_document :=
    pg_catalog.setweight(
      pg_catalog.to_tsvector('english', coalesce(new.title, '')),
      'A'
    )
    || pg_catalog.setweight(
      pg_catalog.to_tsvector('english', body_text),
      'B'
    )
    || pg_catalog.setweight(
      pg_catalog.to_tsvector('english', coalesce(new.slug, '')),
      'C'
    );
  return new;
end;
$$;
