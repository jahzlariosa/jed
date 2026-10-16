import '@tanstack/react-start/server-only'

import { FORBIDDEN_MESSAGE } from '#/auth/errors'
import { getRequestClient } from '#/auth/session.server'
import { writeApiAuditLog } from '#/lib/api/audit-api.server'
import { authenticateBearerRequest } from '#/lib/api/bearer-auth.server'
import type { DomainOperation } from '#/domain/types'

export function isApiForbiddenError(error: unknown): boolean {
  return error instanceof Error && error.message === FORBIDDEN_MESSAGE
}

export async function auditApiWriteDenied(
  request: Request,
  operation: DomainOperation<unknown, unknown>,
): Promise<void> {
  if (operation.method === 'GET') {
    return
  }
  const bearer = await authenticateBearerRequest(request)
  if (!bearer?.tokenId || !bearer.user) {
    return
  }
  try {
    await writeApiAuditLog(getRequestClient(), {
      actorUserId: bearer.user.id,
      apiTokenId: bearer.tokenId,
      action: 'api.denied',
      targetType: 'api',
      targetId: operation.id,
      metadata: {
        method: operation.method,
        path: operation.path,
        status: 403,
      },
    })
  } catch (error) {
    console.error(error)
  }
}
