import '@tanstack/react-start/server-only'

import { setResponseStatus } from '@tanstack/react-start/server'

import { isAdmin } from '#/auth/admin'
import { FORBIDDEN_MESSAGE } from '#/auth/errors'
import type { DomainContext } from '#/domain/types'

export function assertDomainAdmin(ctx: DomainContext): void {
  if (!ctx.user || !ctx.access || !isAdmin(ctx.access)) {
    setResponseStatus(403)
    throw new Error(FORBIDDEN_MESSAGE)
  }
}
