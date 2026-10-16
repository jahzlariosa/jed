import { describe, expect, it, vi } from 'vitest'
import { z } from 'zod'

import { executeDomainOperation } from './execute.server'
import type { DomainOperation } from './types'

vi.mock('@tanstack/react-start/server', () => ({
  setResponseStatus: vi.fn(),
  setResponseHeader: vi.fn(),
}))

vi.mock('#/lib/api/bearer-auth.server', () => ({
  authenticateBearerRequest: vi.fn().mockResolvedValue(null),
  requireBearerAuth: vi.fn(),
  assertBearerPermission: vi.fn(),
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

describe('executeDomainOperation directInput', () => {
  it('does not parse the HTTP body when directInput is provided', async () => {
    const operation: DomainOperation<{ value: string }, { ok: boolean }> = {
      id: 'test_echo',
      method: 'GET',
      path: '/test',
      mcpToolName: 'test_echo',
      summary: 'test',
      scopes: 'public',
      inputSchema: z.object({ value: z.string() }),
      mcpInputSchema: z.object({ value: z.string() }),
      outputSchema: z.object({ ok: z.boolean() }),
      handler: async (_ctx, input) => ({ ok: input.value === 'from-mcp' }),
    }

    const request = new Request('https://example.com/api/v1/test', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: '{not-json',
    })

    const jsonSpy = vi.spyOn(request, 'json')

    const result = await executeDomainOperation(
      request,
      operation as DomainOperation<unknown, unknown>,
      {},
      {
        directInput: { value: 'from-mcp' },
      },
    )

    expect(result.body).toEqual({ ok: true })
    expect(jsonSpy).not.toHaveBeenCalled()
  })
})
