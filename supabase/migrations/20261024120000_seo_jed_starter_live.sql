-- Align hosted jed-starter SEO settings and hide starter demo CMS rows from crawlers.
-- Apply on the jed-starter Supabase project (not run automatically from this repo).

update public.site_settings
set
  site_name = 'JED',
  site_url = 'https://jed-starter.vercel.app',
  seo_default_description = 'TanStack Start Supabase starter for client sites. Two-step login, RLS roles, an admin with a block editor, a blog, REST API and MCP server. Free on GitHub.'
where id = 1;

alter table public.site_settings
  alter column site_name set default 'JED';

update public.content_entries
set
  noindex = true,
  sitemap_exclude = true
where kind = 'page'
  and slug = 'test-page';

update public.posts
set
  noindex = true,
  sitemap_exclude = true
where slug = 'test-blog-post';
