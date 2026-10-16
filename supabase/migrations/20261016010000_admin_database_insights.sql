-- Read-only database insights for the admin Database page (service_role RPC only).

create or replace function public.admin_database_overview()
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  result jsonb;
  db_bytes bigint;
begin
  select pg_catalog.pg_database_size(pg_catalog.current_database()) into db_bytes;

  select jsonb_build_object(
    'databaseBytes',
    db_bytes,
    'storageBuckets',
    coalesce(
      (
        select jsonb_agg(
          jsonb_build_object(
            'bucketId',
            bucket_id,
            'objectCount',
            object_count,
            'totalBytes',
            total_bytes
          )
          order by bucket_id
        )
        from (
          select
            o.bucket_id,
            pg_catalog.count(*)::bigint as object_count,
            coalesce(
              pg_catalog.sum((o.metadata ->> 'size')::bigint),
              0::bigint
            ) as total_bytes
          from storage.objects o
          group by o.bucket_id
        ) buckets
      ),
      '[]'::jsonb
    )
  )
  into result;

  return result;
end;
$$;

create or replace function public.admin_database_tables()
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  result jsonb := '[]'::jsonb;
  rec record;
  table_json jsonb;
begin
  for rec in
    select
      c.oid,
      c.relname as table_name,
      pg_catalog.pg_total_relation_size(c.oid) as total_bytes,
      pg_catalog.pg_relation_size(c.oid) as table_bytes,
      pg_catalog.pg_indexes_size(c.oid) as index_bytes,
      coalesce(st.n_live_tup, 0)::bigint as estimated_rows
    from pg_catalog.pg_class c
    join pg_catalog.pg_namespace n on n.oid = c.relnamespace
    left join pg_catalog.pg_stat_user_tables st on st.relid = c.oid
    where n.nspname = 'public'
      and c.relkind = 'r'
    order by c.relname
  loop
    select jsonb_build_object(
      'schema',
      'public',
      'name',
      rec.table_name,
      'totalBytes',
      rec.total_bytes,
      'tableBytes',
      rec.table_bytes,
      'indexBytes',
      rec.index_bytes,
      'estimatedRows',
      rec.estimated_rows,
      'columns',
      coalesce(
        (
          select jsonb_agg(
            jsonb_build_object(
              'name',
              col.column_name,
              'dataType',
              col.data_type,
              'isNullable',
              col.is_nullable = 'YES'
            )
            order by col.ordinal_position
          )
          from information_schema.columns col
          where col.table_schema = 'public'
            and col.table_name = rec.table_name
        ),
        '[]'::jsonb
      ),
      'indexes',
      coalesce(
        (
          select jsonb_agg(
            jsonb_build_object(
              'name',
              idx.indexname,
              'definition',
              idx.indexdef
            )
            order by idx.indexname
          )
          from pg_catalog.pg_indexes idx
          where idx.schemaname = 'public'
            and idx.tablename = rec.table_name
        ),
        '[]'::jsonb
      )
    )
    into table_json;

    result := result || jsonb_build_array(table_json);
  end loop;

  return result;
end;
$$;

create or replace function public.admin_database_diagram()
returns jsonb
language sql
stable
security definer
set search_path = ''
as $$
  with tables as (
    select c.relname as name
    from pg_catalog.pg_class c
    join pg_catalog.pg_namespace n on n.oid = c.relnamespace
    where n.nspname = 'public'
      and c.relkind = 'r'
    order by c.relname
  ),
  rels as (
    select
      src.relname as from_table,
      a.attname as from_column,
      tgt.relname as to_table,
      af.attname as to_column
    from pg_catalog.pg_constraint c
    join pg_catalog.pg_class src on src.oid = c.conrelid
    join pg_catalog.pg_namespace ns on ns.oid = src.relnamespace
      and ns.nspname = 'public'
    join pg_catalog.pg_class tgt on tgt.oid = c.confrelid
    join pg_catalog.pg_attribute a on a.attrelid = c.conrelid
      and a.attnum = c.conkey[1]
      and not a.attisdropped
    join pg_catalog.pg_attribute af on af.attrelid = c.confrelid
      and af.attnum = c.confkey[1]
      and not af.attisdropped
    where c.contype = 'f'
  )
  select jsonb_build_object(
    'tables',
    coalesce((select jsonb_agg(t.name order by t.name) from tables t), '[]'::jsonb),
    'relationships',
    coalesce(
      (
        select jsonb_agg(
          jsonb_build_object(
            'fromTable',
            r.from_table,
            'fromColumn',
            r.from_column,
            'toTable',
            r.to_table,
            'toColumn',
            r.to_column
          )
          order by r.from_table, r.from_column
        )
        from rels r
      ),
      '[]'::jsonb
    )
  );
$$;

create or replace function public.admin_database_activity()
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  has_pgss boolean;
  result jsonb;
begin
  select pg_catalog.to_regclass('extensions.pg_stat_statements') is not null
  into has_pgss;

  select jsonb_build_object(
    'connectionsByState',
    coalesce(
      (
        select jsonb_agg(
          jsonb_build_object('state', coalesce(state, 'unknown'), 'count', cnt)
          order by cnt desc
        )
        from (
          select pg_catalog.coalesce(sa.state, 'unknown') as state, pg_catalog.count(*)::bigint as cnt
          from pg_catalog.pg_stat_activity sa
          where sa.datname = pg_catalog.current_database()
          group by pg_catalog.coalesce(sa.state, 'unknown')
        ) grouped
      ),
      '[]'::jsonb
    ),
    'slowQueriesAvailable',
    has_pgss,
    'slowQueries',
    case
      when has_pgss then coalesce(
        (
          select jsonb_agg(
            jsonb_build_object(
              'queryId',
              s.queryid::text,
              'meanTimeMs',
              round((s.mean_exec_time)::numeric, 2),
              'calls',
              s.calls
            )
            order by s.mean_exec_time desc
          )
          from (
            select
              pss.queryid,
              pss.mean_exec_time,
              pss.calls
            from extensions.pg_stat_statements pss
            where pss.calls > 0
            order by pss.mean_exec_time desc
            limit 10
          ) s
        ),
        '[]'::jsonb
      )
      else '[]'::jsonb
    end
  )
  into result;

  return result;
end;
$$;

revoke all on function public.admin_database_overview() from public;
revoke all on function public.admin_database_tables() from public;
revoke all on function public.admin_database_diagram() from public;
revoke all on function public.admin_database_activity() from public;

revoke execute on function public.admin_database_overview() from anon;
revoke execute on function public.admin_database_tables() from anon;
revoke execute on function public.admin_database_diagram() from anon;
revoke execute on function public.admin_database_activity() from anon;

revoke execute on function public.admin_database_overview() from authenticated;
revoke execute on function public.admin_database_tables() from authenticated;
revoke execute on function public.admin_database_diagram() from authenticated;
revoke execute on function public.admin_database_activity() from authenticated;

grant execute on function public.admin_database_overview() to service_role;
grant execute on function public.admin_database_tables() to service_role;
grant execute on function public.admin_database_diagram() to service_role;
grant execute on function public.admin_database_activity() to service_role;
