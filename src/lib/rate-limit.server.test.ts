import { beforeEach, describe, expect, it, vi } from 'vitest'

const rpc = vi.fn()

vi.mock('@tanstack/react-start/server', () => ({
  getRequest: () =>
    new Request('https://example.com', {
      headers: { 'x-vercel-forwarded-for': '203.0.113.10' },
    }),
}))

vi.mock('#/lib/supabase/service-role.server', () => ({
  createServiceRoleClient: () => ({ rpc }),
}))

import { assertRateLimit } from './rate-limit.server'

describe('assertRateLimit', () => {
  beforeEach(() => {
    rpc.mockReset()
  })

  it('passes vercel IP and p_ args to the RPC', async () => {
    rpc.mockResolvedValue({ data: true, error: null })
    await assertRateLimit('auth:sign-in', 5, 60_000)
    expect(rpc).toHaveBeenCalledWith('consume_rate_limit_bucket', {
      p_bucket_key: 'auth:sign-in:203.0.113.10',
      p_max_hits: 5,
      p_window_seconds: 60,
    })
  })

  it('fails closed when the RPC errors', async () => {
    rpc.mockResolvedValue({ data: null, error: new Error('db down') })
    await expect(assertRateLimit('contact:submit', 1, 1000)).rejects.toThrow(
      'RATE_LIMITED',
    )
  })

  it('fails closed when the bucket is over limit', async () => {
    rpc.mockResolvedValue({ data: false, error: null })
    await expect(assertRateLimit('contact:submit', 1, 1000)).rejects.toThrow(
      'RATE_LIMITED',
    )
  })
})
