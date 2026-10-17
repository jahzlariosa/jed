-- Least privilege on profile_bylines (select only).

revoke all on public.profile_bylines from public;
revoke all on public.profile_bylines from anon;
revoke all on public.profile_bylines from authenticated;

grant select on public.profile_bylines to anon, authenticated;
