alter table public.site_settings
  add column if not exists redirect_after_sign_in_admin text not null default '/admin',
  add column if not exists redirect_after_sign_in_user text not null default '/',
  add column if not exists redirect_after_sign_up text not null default '/',
  add column if not exists redirect_after_password_reset text not null default '/account',
  add column if not exists redirect_after_sign_out text not null default '/login';

alter table public.site_settings
  add constraint site_settings_redirect_after_sign_in_admin_path
    check (redirect_after_sign_in_admin ~ '^/[a-zA-Z0-9/_-]*$'),
  add constraint site_settings_redirect_after_sign_in_user_path
    check (redirect_after_sign_in_user ~ '^/[a-zA-Z0-9/_-]*$'),
  add constraint site_settings_redirect_after_sign_up_path
    check (redirect_after_sign_up ~ '^/[a-zA-Z0-9/_-]*$'),
  add constraint site_settings_redirect_after_password_reset_path
    check (redirect_after_password_reset ~ '^/[a-zA-Z0-9/_-]*$'),
  add constraint site_settings_redirect_after_sign_out_path
    check (redirect_after_sign_out ~ '^/[a-zA-Z0-9/_-]*$');
