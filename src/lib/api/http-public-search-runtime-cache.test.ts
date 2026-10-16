import { beforeEach, describe, expect, it, vi } from 'vitest'

import { handleApiV1Request } from '#/lib/api/http.server'
import {
  buildPublicCacheKey,
  invalidatePublishedContentCache,
  readRuntimeCache,
} from '#/lib/api-runtime-cache.server'

vi.mock('@vercel/functions', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@vercel/functions')>()
  return {
    ...actual,
    invalidateByTag: vi.fn(async () => undefined),
  }
})

vi.mock('#/domain/execute.server', () => ({
  executeDomainOperation: vi.fn(),
}))

describe('public search runtime cache invalidation', () => {
  beforeEach(async () => {
    vi.clearAllMocks()
    const { executeDomainOperation } = await import('#/domain/execute.server')
    vi.mocked(executeDomainOperation).mockReset()
  })

  it('drops a cached search payload after invalidatePublishedContentCache', async () => {
    const { executeDomainOperation } = await import('#/domain/execute.server')
    const query = { q: 'publishme', page: '1' }
    const cacheKey = buildPublicCacheKey('/public/search', query)

    vi.mocked(executeDomainOperation)
      .mockResolvedValueOnce({
        body: {
          q: 'publishme',
          page: 1,
          pageCount: 1,
          items: [{ title: 'Published post' }],
        },
        status: 200,
      })
      .mockResolvedValueOnce({
        body: { q: 'publishme', page: 1, pageCount: 1, items: [] },
        status: 200,
      })

    const url = 'https://example.com/api/v1/public/search?q=publishme&page=1'
    const first = await handleApiV1Request(new Request(url))
    expect(first.status).toBe(200)
    expect(await first.json()).toMatchObject({
      items: [{ title: 'Published post' }],
    })

    const stored = await readRuntimeCache(cacheKey)
    expect(stored?.body).toContain('Published post')

    await invalidatePublishedContentCache('post-id')

    const afterInvalidate = await readRuntimeCache(cacheKey)
    expect(afterInvalidate).toBeNull()

    const second = await handleApiV1Request(new Request(url))
    expect(await second.json()).toMatchObject({ items: [] })
    expect(executeDomainOperation).toHaveBeenCalledTimes(2)
  })

  it('does not write cache entries when execute returns non-200', async () => {
    const { executeDomainOperation } = await import('#/domain/execute.server')
    vi.mocked(executeDomainOperation).mockResolvedValue({
      body: { error: 'nope' },
      status: 500,
    })

    const query = { q: 'hello', page: '1' }
    const cacheKey = buildPublicCacheKey('/public/search', query)

    await handleApiV1Request(
      new Request('https://example.com/api/v1/public/search?q=hello&page=1'),
    )

    expect(await readRuntimeCache(cacheKey)).toBeNull()
  })
})
