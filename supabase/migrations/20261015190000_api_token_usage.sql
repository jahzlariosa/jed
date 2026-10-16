-- Aggregated API call counts per personal access token (owner only).

create index if not exists audit_log_api_token_action_idx
  on public.audit_log ((metadata->>'api_token_id'), created_at desc)
  where action like 'api.%';

create or replace function public.list_my_api_token_usage()
returns table (
  token_id uuid,
  token_name text,
  call_count bigint,
  last_called_at timestamptz
)
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_user_id uuid;
begin
  v_user_id := (select auth.uid());
  if v_user_id is null then
    raise exception 'unauthorized' using errcode = '42501';
  end if;
  return query
  select
    t.id,
    t.name,
    pg_catalog.count(a.id)::bigint,
    pg_catalog.max(a.created_at)
  from public.api_tokens as t
  left join public.audit_log as a
    on a.metadata->>'api_token_id' = t.id::text
    and a.action like 'api.%'
  where t.user_id = v_user_id
  group by t.id, t.name
  order by pg_catalog.max(a.created_at) desc nulls last, t.created_at desc;
end;
$$;

revoke all on function public.list_my_api_token_usage() from public;
revoke all on function public.list_my_api_token_usage() from anon;
grant execute on function public.list_my_api_token_usage() to authenticated;
