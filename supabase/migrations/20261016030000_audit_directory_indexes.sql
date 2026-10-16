-- Optional composite indexes for filtered audit directory queries.
-- created_at is already indexed (audit_log_created_at_idx).

create index if not exists audit_log_actor_created_at_idx
  on public.audit_log (actor_user_id, created_at desc);

create index if not exists audit_log_action_created_at_idx
  on public.audit_log (action, created_at desc);

create index if not exists audit_log_target_type_created_at_idx
  on public.audit_log (target_type, created_at desc);
