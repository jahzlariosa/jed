create or replace function public.list_applied_schema_migrations()
returns table (version text)
language plpgsql
stable
security definer
set search_path = public, supabase_migrations
as $$
begin
  if not (select public.is_admin()) then
    raise exception 'forbidden' using errcode = '42501';
  end if;
  return query
    select m.version::text
    from supabase_migrations.schema_migrations m
    order by m.version;
end;
$$;

revoke all on function public.list_applied_schema_migrations() from public;
grant execute on function public.list_applied_schema_migrations() to authenticated;
