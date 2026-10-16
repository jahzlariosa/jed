import { describe, expect, it, vi, beforeEach } from 'vitest'

import {
  apiErrorResponse,
  apiJsonResponse,
  handleHealthRequest,
} from '#/lib/api/http.server'
import * as runtimeCache from '#/lib/api-runtime-cache.server'

vi.mock('#/lib/api-runtime-cache.server', async (importOriginal) => {
  const actual = await importOriginal<typeof runtimeCache>()
  return {
    ...actual,
    readRuntimeCache: vi.fn(),
    writeRuntimeCache: vi.fn(),
  }
})

describe('API response cache behavior', () => {
  beforeEach(() => {
    vi.mocked(runtimeCache.readRuntimeCache).mockReset()
    vi.mocked(runtimeCache.writeRuntimeCache).mockReset()
  })

  it('returns no-store for health', () => {
    const response = handleHealthRequest(new Request('https://x/api/v1/health'))
    expect(response.headers.get('Cache-Control')).toBe('private, no-store')
  })

  it('returns no-store and Retry-After for rate limits', () => {
    const response = apiErrorResponse(
      new Request('https://x'),
      429,
      'Too many requests',
      60,
    )
    expect(response.status).toBe(429)
    expect(response.headers.get('Cache-Control')).toBe('private, no-store')
    expect(response.headers.get('Retry-After')).toBe('60')
  })

  it('does not attach ETag to token-backed JSON responses', () => {
    const response = apiJsonResponse(
      new Request('https://x', {
        headers: { Authorization: 'Bearer amn_live_abc' },
      }),
      { ok: true },
      { kind: 'private-auth', etag: '"should-drop"' },
    )
    expect(response.headers.get('ETag')).toBeNull()
    expect(response.headers.get('Cache-Control')).toBe('private, no-store')
  })

  it('keeps separate cache keys for different public search queries', async () => {
    const keyA = runtimeCache.buildPublicCacheKey('/public/search', {
      q: 'alpha',
      page: '1',
    })
    const keyB = runtimeCache.buildPublicCacheKey('/public/search', {
      q: 'beta',
      page: '1',
    })
    expect(keyA).not.toBe(keyB)
  })
})
