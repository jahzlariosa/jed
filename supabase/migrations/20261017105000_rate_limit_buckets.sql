-- Shared rate-limit counters for multi-instance server functions.
-- No live Postgres integration test in CI; see rate-limit-buckets-migration.test.ts.

create table if not exists private.rate_limit_buckets (
  bucket_key text primary key,
  window_start timestamptz not null,
  hit_count integer not null default 0 check (hit_count >= 0),
  expires_at timestamptz not null
);

alter table private.rate_limit_buckets
  add column if not exists expires_at timestamptz;

update private.rate_limit_buckets as b
set expires_at = b.window_start + interval '1 hour'
where b.expires_at is null;

alter table private.rate_limit_buckets
  alter column expires_at set not null;

alter table private.rate_limit_buckets enable row level security;

revoke all on table private.rate_limit_buckets from public;
revoke all on table private.rate_limit_buckets from anon;
revoke all on table private.rate_limit_buckets from authenticated;

create or replace function public.consume_rate_limit_bucket(
  p_bucket_key text,
  p_max_hits integer,
  p_window_seconds integer
)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_now timestamptz := pg_catalog.timezone('utc', pg_catalog.now());
  v_count integer;
begin
  if p_bucket_key is null or pg_catalog.length(p_bucket_key) < 1 or pg_catalog.length(p_bucket_key) > 512 then
    raise exception 'invalid bucket' using errcode = '22023';
  end if;

  if p_max_hits is null or p_max_hits < 1 or p_max_hits > 10000 then
    raise exception 'invalid limit' using errcode = '22023';
  end if;

  if p_window_seconds is null or p_window_seconds < 1 or p_window_seconds > 86400 then
    raise exception 'invalid window' using errcode = '22023';
  end if;

  delete from private.rate_limit_buckets as b
  where b.expires_at < v_now;

  with upsert as (
    insert into private.rate_limit_buckets as r (
      bucket_key,
      window_start,
      hit_count,
      expires_at
    )
    values (
      p_bucket_key,
      v_now,
      1,
      v_now + (p_window_seconds * interval '1 second')
    )
    on conflict (bucket_key) do update
    set
      hit_count = case
        when r.expires_at < v_now then 1
        else r.hit_count + 1
      end,
      window_start = case
        when r.expires_at < v_now then v_now
        else r.window_start
      end,
      expires_at = case
        when r.expires_at < v_now
          then v_now + (p_window_seconds * interval '1 second')
        else r.expires_at
      end
    returning r.hit_count
  )
  select u.hit_count into v_count
  from upsert as u;

  return v_count <= p_max_hits;
end;
$$;

revoke all on function public.consume_rate_limit_bucket(text, integer, integer) from public;
revoke execute on function public.consume_rate_limit_bucket(text, integer, integer) from anon;
revoke execute on function public.consume_rate_limit_bucket(text, integer, integer) from authenticated;
grant execute on function public.consume_rate_limit_bucket(text, integer, integer) to service_role;
