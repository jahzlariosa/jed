-- Remove legacy RPC bypassed by admin_set_user_role (service_role only).

drop function if exists public.set_user_role_atomic(uuid, text);
