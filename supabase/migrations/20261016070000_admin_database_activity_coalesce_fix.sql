-- Fix admin_database_activity: coalesce is not in pg_catalog (42883).

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
          select coalesce(sa.state, 'unknown') as state, pg_catalog.count(*)::bigint as cnt
          from pg_catalog.pg_stat_activity sa
          where sa.datname = pg_catalog.current_database()
          group by coalesce(sa.state, 'unknown')
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

revoke all on function public.admin_database_activity() from public;
revoke execute on function public.admin_database_activity() from anon;
revoke execute on function public.admin_database_activity() from authenticated;
grant execute on function public.admin_database_activity() to service_role;
