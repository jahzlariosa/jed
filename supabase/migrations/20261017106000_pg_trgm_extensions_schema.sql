-- Move pg_trgm to extensions schema; qualify gin_trgm_ops for fresh and legacy databases.

create schema if not exists extensions;

create extension if not exists pg_trgm with schema extensions;

do $$
begin
  if exists (
    select 1
    from pg_catalog.pg_extension as e
    inner join pg_catalog.pg_namespace as n on n.oid = e.extnamespace
    where e.extname = 'pg_trgm'
      and n.nspname = 'public'
  ) then
    alter extension pg_trgm set schema extensions;
  end if;
end $$;

drop index if exists public.profiles_email_trgm_idx;

create index if not exists profiles_email_trgm_idx
  on public.profiles using gin (email extensions.gin_trgm_ops);
