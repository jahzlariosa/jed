-- MFA helper RPCs are internal to RLS; anon must not execute them.
-- Index rate-limit expiry sweeps.

revoke execute on function public.session_aal_is_aal2() from anon;
revoke execute on function public.site_mfa_policy_row() from anon;
revoke execute on function public.rls_requires_aal2_for_admin() from anon;
revoke execute on function public.rls_requires_aal2_for_permission(text) from anon;

create index if not exists rate_limit_buckets_expires_at_idx
  on private.rate_limit_buckets (expires_at);
