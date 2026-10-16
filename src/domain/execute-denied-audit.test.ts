import { describe, expect, it, vi, beforeEach } from 'vitest'
import { z } from 'zod'

import { FORBIDDEN_MESSAGE } from '#/auth/errors'
import { executeDomainOperation } from './execute.server'
import type { DomainOperation } from './types'

vi.mock('@tanstack/react-start/server', () => ({
  setResponseStatus: vi.fn(),
  setResponseHeader: vi.fn(),
}))

const { auditApiWriteDenied } = vi.hoisted(() => ({
  auditApiWriteDenied: vi.fn(),
}))
vi.mock('#/lib/api/api-denied-audit.server', () => ({
  auditApiWriteDenied,
  isApiForbiddenError: (error: unknown) =>
    error instanceof Error && error.message === FORBIDDEN_MESSAGE,
}))

vi.mock('#/lib/api/bearer-auth.server', () => ({
  authenticateBearerRequest: vi.fn(),
  requireBearerAuth: vi.fn(),
  assertBearerPermission: vi.fn(() => {
    throw new Error(FORBIDDEN_MESSAGE)
  }),
}))

vi.mock('#/lib/api/rate-limit-api.server', () => ({
  assertApiRateLimit: vi.fn(),
  ApiRateLimitError: class extends Error {},
}))

vi.mock('#/lib/supabase/server', () => ({
  createSupabaseServerClient: vi.fn(() => ({})),
}))

vi.mock('#/auth/session.server', () => ({
  getRequestClient: vi.fn(() => ({})),
}))

vi.mock('#/lib/api/audit-api.server', () => ({
  writeApiAuditLog: vi.fn(),
}))

vi.mock('#/lib/api/idempotency.server', () => ({
  loadIdempotencyRecord: vi.fn(),
  resolveWriteIdempotencyKey: vi.fn(),
  storeIdempotencyRecord: vi.fn(),
}))

describe('executeDomainOperation denied audit', () => {
  beforeEach(() => {
    auditApiWriteDenied.mockClear()
  })

  it('audits forbidden write attempts', async () => {
    const operation: DomainOperation<unknown, unknown> = {
      id: 'save_content',
      method: 'POST',
      path: '/content',
      mcpToolName: 'save_content',
      summary: 'test',
      scopes: ['content.write'],
      inputSchema: z.object({}),
      mcpInputSchema: z.object({}),
      outputSchema: z.unknown(),
      handler: async () => ({ ok: true }),
    }

    await expect(
      executeDomainOperation(
        new Request('https://example.com/api/v1/content'),
        operation,
        {},
      ),
    ).rejects.toThrow(FORBIDDEN_MESSAGE)

    expect(auditApiWriteDenied).toHaveBeenCalledOnce()
  })
})
