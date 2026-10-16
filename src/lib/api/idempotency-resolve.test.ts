import { describe, expect, it } from 'vitest'

import { resolveWriteIdempotencyKey } from './idempotency.server'

describe('resolveWriteIdempotencyKey', () => {
  it('prefers an explicit tool idempotency key', () => {
    const request = new Request('https://example.com/api/mcp')
    const key = resolveWriteIdempotencyKey(request, 'token-uuid', {
      explicitKey: 'custom-key',
    })
    expect(key).toBe('custom-key')
  })

  it('uses the Idempotency-Key header when present', () => {
    const request = new Request('https://example.com/api/v1/content', {
      headers: { 'Idempotency-Key': 'header-key' },
    })
    const key = resolveWriteIdempotencyKey(request, 'token-uuid', {})
    expect(key).toBe('header-key')
  })
})
