import '@tanstack/react-start/server-only'

import { writeAuditLog } from '#/lib/cms/audit.server'
import type { createClient } from '#/lib/supabase/server'

export async function writeApiAuditLog(
  supabase: ReturnType<typeof createClient>,
  input: {
    actorUserId: string
    apiTokenId: string | null
    action: string
    targetType: string
    targetId?: string | null
    metadata?: Record<string, unknown>
  },
) {
  const metadata = {
    ...(input.metadata ?? {}),
    ...(input.apiTokenId ? { api_token_id: input.apiTokenId } : {}),
    channel: 'api',
  }
  await writeAuditLog(supabase, {
    actorUserId: input.actorUserId,
    action: input.action,
    targetType: input.targetType,
    targetId: input.targetId,
    metadata,
  })
}
