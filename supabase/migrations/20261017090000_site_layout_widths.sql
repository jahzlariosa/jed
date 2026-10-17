alter table public.site_settings
  add column if not exists navbar_width text not null default 'full',
  add column if not exists footer_width text not null default 'full';

alter table public.site_settings
  drop constraint if exists site_settings_navbar_width_check;

alter table public.site_settings
  add constraint site_settings_navbar_width_check
  check (navbar_width in ('full', 'contained', 'full_content_contained'));

alter table public.site_settings
  drop constraint if exists site_settings_footer_width_check;

alter table public.site_settings
  add constraint site_settings_footer_width_check
  check (footer_width in ('full', 'contained', 'full_content_contained'));