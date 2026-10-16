-- Admin directory query shapes (apply on hosted DB when ready).

create extension if not exists pg_trgm;

create index if not exists profiles_created_at_user_id_idx
  on public.profiles (created_at desc, user_id);

create index if not exists profiles_email_trgm_idx
  on public.profiles using gin (email gin_trgm_ops);

create index if not exists user_roles_role_code_idx
  on public.user_roles (role_code);

create index if not exists user_roles_user_id_role_code_idx
  on public.user_roles (user_id, role_code);

do $$
begin
  if exists (
    select 1
    from pg_tables
    where schemaname = 'public'
      and tablename = 'media_assets'
  ) then
    create index if not exists media_assets_created_at_idx
      on public.media_assets (created_at desc);
  end if;
end $$;
