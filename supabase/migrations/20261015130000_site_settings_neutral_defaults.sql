update public.site_settings
set
  site_name = 'AMIANAN Starter',
  brand_hex = '#111111'
where site_name = 'Site name'
  and upper(brand_hex) = '#4F46E5';

alter table public.site_settings
  alter column site_name set default 'AMIANAN Starter';

alter table public.site_settings
  alter column brand_hex set default '#111111';
