-- Personal access tokens and API idempotency keys for REST/MCP.

create table if not exists public.api_tokens (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  name text not null check (char_length(name) between 1 and 120),
  prefix text not null check (char_length(prefix) between 8 and 32),
  token_hash text not null unique check (char_length(token_hash) = 64),
  scopes text[] not null default '{}'::text[]
    check (cardinality(scopes) <= 32),
  expires_at timestamptz not null,
  revoked_at timestamptz,
  last_used_at timestamptz,
  created_at timestamptz not null default now(),
  constraint api_tokens_expires_after_created check (expires_at > created_at)
);

create index if not exists api_tokens_user_id_idx on public.api_tokens (user_id);
create index if not exists api_tokens_hash_active_idx
  on public.api_tokens (token_hash)
  where revoked_at is null;

alter table public.api_tokens enable row level security;

drop policy if exists api_tokens_select_own on public.api_tokens;
drop policy if exists api_tokens_insert_own on public.api_tokens;
drop policy if exists api_tokens_update_own on public.api_tokens;

create policy api_tokens_select_own on public.api_tokens
  for select to authenticated
  using (user_id = (select auth.uid()));

create policy api_tokens_insert_own on public.api_tokens
  for insert to authenticated
  with check (user_id = (select auth.uid()));

create policy api_tokens_update_own on public.api_tokens
  for update to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

revoke all on table public.api_tokens from anon;
revoke all on table public.api_tokens from authenticated;
grant select (
  id,
  user_id,
  name,
  prefix,
  scopes,
  expires_at,
  revoked_at,
  last_used_at,
  created_at
), insert, update on table public.api_tokens to authenticated;

create table if not exists public.api_idempotency (
  id uuid primary key default gen_random_uuid(),
  token_id uuid not null references public.api_tokens (id) on delete cascade,
  key_hash text not null check (char_length(key_hash) = 64),
  status_code smallint not null,
  response_body jsonb not null,
  created_at timestamptz not null default now(),
  expires_at timestamptz not null,
  unique (token_id, key_hash)
);

create index if not exists api_idempotency_expires_idx
  on public.api_idempotency (expires_at);

alter table public.api_idempotency enable row level security;

revoke all on table public.api_idempotency from anon;
revoke all on table public.api_idempotency from authenticated;

create or replace function public.lookup_api_token_by_hash(p_token_hash text)
returns table (
  token_id uuid,
  user_id uuid,
  scopes text[],
  expires_at timestamptz
)
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  if p_token_hash is null or char_length(p_token_hash) <> 64 then
    return;
  end if;
  return query
  select
    t.id,
    t.user_id,
    t.scopes,
    t.expires_at
  from public.api_tokens as t
  where t.token_hash = p_token_hash
    and t.revoked_at is null
    and t.expires_at > pg_catalog.now();
end;
$$;

revoke all on function public.lookup_api_token_by_hash(text) from public;
revoke all on function public.lookup_api_token_by_hash(text) from anon;
revoke all on function public.lookup_api_token_by_hash(text) from authenticated;
grant execute on function public.lookup_api_token_by_hash(text) to service_role;
