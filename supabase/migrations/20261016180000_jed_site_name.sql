update public.site_settings
set site_name = 'Jed'
where site_name ilike '%amianan%';

alter table public.site_settings
  alter column site_name set default 'Jed';
