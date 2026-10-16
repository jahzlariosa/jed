-- SEO readiness: site settings, per-entry fields, redirects (410, hits), public SEO RPC.

alter table public.site_settings
  add column if not exists og_locale text not null default 'en_US',
  add column if not exists twitter_handle text,
  add column if not exists allow_search_indexing boolean not null default true,
  add column if not exists robots_extra_rules text not null default '',
  add column if not exists sitemap_include_blog boolean not null default true,
  add column if not exists sitemap_include_pages boolean not null default true,
  add column if not exists sitemap_include_docs boolean not null default true,
  add column if not exists sitemap_excluded_paths jsonb not null default '[]'::jsonb,
  add column if not exists google_site_verification text,
  add column if not exists bing_site_verification text,
  add column if not exists ga4_measurement_id text,
  add column if not exists gtm_container_id text,
  add column if not exists plausible_domain text,
  add column if not exists vercel_analytics_enabled boolean not null default false,
  add column if not exists default_og_image_alt text,
  add column if not exists org_schema_type text not null default 'Organization'
    check (org_schema_type in ('Organization', 'LocalBusiness')),
  add column if not exists org_legal_name text,
  add column if not exists org_logo_url text,
  add column if not exists org_address text,
  add column if not exists org_phone text,
  add column if not exists org_email text,
  add column if not exists org_opening_hours text,
  add column if not exists org_same_as jsonb not null default '[]'::jsonb,
  add column if not exists redirect_external_hosts jsonb not null default '[]'::jsonb;

alter table public.site_settings
  drop constraint if exists site_settings_ga4_measurement_id_check,
  drop constraint if exists site_settings_gtm_container_id_check,
  drop constraint if exists site_settings_google_site_verification_check,
  drop constraint if exists site_settings_bing_site_verification_check,
  drop constraint if exists site_settings_plausible_domain_check,
  drop constraint if exists site_settings_twitter_handle_check;

alter table public.site_settings
  add constraint site_settings_ga4_measurement_id_check
    check (ga4_measurement_id is null or ga4_measurement_id ~ '^G-[A-Z0-9]+$'),
  add constraint site_settings_gtm_container_id_check
    check (gtm_container_id is null or gtm_container_id ~ '^GTM-[A-Z0-9]+$'),
  add constraint site_settings_google_site_verification_check
    check (google_site_verification is null or google_site_verification ~ '^[\w-]+$'),
  add constraint site_settings_bing_site_verification_check
    check (bing_site_verification is null or bing_site_verification ~ '^[\w-]+$'),
  add constraint site_settings_plausible_domain_check
    check (plausible_domain is null or plausible_domain ~ '^[\w.-]+$'),
  add constraint site_settings_twitter_handle_check
    check (twitter_handle is null or twitter_handle ~ '^@[\w]{1,15}$');

alter table public.content_entries
  add column if not exists canonical_url text,
  add column if not exists og_image_id uuid references public.media_assets (id) on delete set null,
  add column if not exists og_image_alt text,
  add column if not exists noindex boolean not null default false,
  add column if not exists sitemap_exclude boolean not null default false;

alter table public.posts
  add column if not exists canonical_url text,
  add column if not exists og_image_id uuid references public.media_assets (id) on delete set null,
  add column if not exists og_image_alt text,
  add column if not exists cover_image_alt text,
  add column if not exists noindex boolean not null default false,
  add column if not exists sitemap_exclude boolean not null default false;

alter table public.url_redirects
  add column if not exists hit_count bigint not null default 0,
  add column if not exists last_hit_at timestamptz,
  add column if not exists is_external boolean not null default false;

alter table public.url_redirects
  drop constraint if exists url_redirects_status_code_check;

alter table public.url_redirects
  add constraint url_redirects_status_code_check
  check (status_code in (301, 302, 410));

drop function if exists public.lookup_url_redirect(text);

create or replace function public.lookup_url_redirect(request_path text)
returns table (to_path text, status_code smallint, is_external boolean)
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  if auth.role() is distinct from 'service_role' then
    raise exception 'not authorized';
  end if;
  return query
  select r.to_path, r.status_code, r.is_external
  from public.url_redirects r
  where r.enabled = true
    and r.from_path = request_path
  limit 1;
end;
$$;

create or replace function public.record_url_redirect_hit(request_path text)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if auth.role() is distinct from 'service_role' then
    raise exception 'not authorized';
  end if;
  update public.url_redirects
  set hit_count = hit_count + 1,
      last_hit_at = timezone('utc', now())
  where enabled = true
    and from_path = request_path;
end;
$$;

revoke all on function public.record_url_redirect_hit(text) from public;
revoke all on function public.record_url_redirect_hit(text) from anon, authenticated;
grant execute on function public.record_url_redirect_hit(text) to service_role;

revoke all on function public.lookup_url_redirect(text) from public;
revoke all on function public.lookup_url_redirect(text) from anon, authenticated;
grant execute on function public.lookup_url_redirect(text) to service_role;

create or replace function public.import_url_redirects_csv(rows jsonb)
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare
  row_count integer := 0;
  item jsonb;
begin
  if auth.role() is distinct from 'service_role' then
    raise exception 'not authorized';
  end if;
  if jsonb_typeof(rows) <> 'array' then
    raise exception 'rows must be a JSON array';
  end if;
  if jsonb_array_length(rows) > 1000 then
    raise exception 'too many redirects';
  end if;
  for item in select value from jsonb_array_elements(rows) loop
    insert into public.url_redirects (
      from_path,
      to_path,
      status_code,
      enabled,
      is_external,
      updated_at
    )
    values (
      item->>'from_path',
      item->>'to_path',
      (item->>'status_code')::smallint,
      coalesce((item->>'enabled')::boolean, true),
      coalesce((item->>'is_external')::boolean, false),
      timezone('utc', now())
    )
    on conflict (from_path) do update set
      to_path = excluded.to_path,
      status_code = excluded.status_code,
      enabled = excluded.enabled,
      is_external = excluded.is_external,
      updated_at = excluded.updated_at;
    row_count := row_count + 1;
  end loop;
  return row_count;
end;
$$;

revoke all on function public.import_url_redirects_csv(jsonb) from public;
revoke all on function public.import_url_redirects_csv(jsonb) from anon, authenticated;
grant execute on function public.import_url_redirects_csv(jsonb) to service_role;

create or replace function public.get_public_seo_settings()
returns jsonb
language sql
stable
security definer
set search_path = ''
as $$
  select jsonb_build_object(
    'site_name', s.site_name,
    'seo_title_template', s.seo_title_template,
    'seo_default_description', s.seo_default_description,
    'social_image_url', s.social_image_url,
    'default_og_image_alt', s.default_og_image_alt,
    'language', s.language,
    'og_locale', s.og_locale,
    'twitter_handle', s.twitter_handle,
    'allow_search_indexing', s.allow_search_indexing,
    'google_site_verification', s.google_site_verification,
    'bing_site_verification', s.bing_site_verification,
    'ga4_measurement_id', s.ga4_measurement_id,
    'gtm_container_id', s.gtm_container_id,
    'plausible_domain', s.plausible_domain,
    'vercel_analytics_enabled', s.vercel_analytics_enabled,
    'org_schema_type', s.org_schema_type,
    'org_legal_name', s.org_legal_name,
    'org_logo_url', s.org_logo_url,
    'org_address', s.org_address,
    'org_phone', s.org_phone,
    'org_email', s.org_email,
    'org_opening_hours', s.org_opening_hours,
    'org_same_as', s.org_same_as,
    'sitemap_include_blog', s.sitemap_include_blog,
    'sitemap_include_pages', s.sitemap_include_pages,
    'sitemap_include_docs', s.sitemap_include_docs
  )
  from public.site_settings s
  where s.id = 1;
$$;

revoke all on function public.get_public_seo_settings() from public;
grant execute on function public.get_public_seo_settings() to anon, authenticated;
