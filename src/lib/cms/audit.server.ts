import '@tanstack/react-start/server-only'

import type { createClient } from '#/lib/supabase/server'
import type { Json } from '#/lib/supabase/database.types'

export async function writeAuditLog(
  supabase: ReturnType<typeof createClient>,
  input: {
    actorUserId: string
    action: string
    targetType: string
    targetId?: string | null
    metadata?: Record<string, unknown>
  },
) {
  const row = {
    actor_user_id: input.actorUserId,
    action: input.action.slice(0, 120),
    target_type: input.targetType.slice(0, 80),
    target_id: input.targetId?.slice(0, 120) ?? null,
    metadata: (input.metadata ?? {}) as Json,
  }
  const { error } = await supabase.from('audit_log').insert(row)
  if (error) {
    console.error('audit_log insert failed', {
      action: row.action,
      targetType: row.target_type,
      targetId: row.target_id,
      message: error.message,
      code: error.code,
    })
    return { error: error.message }
  }
  return { ok: true as const }
}
