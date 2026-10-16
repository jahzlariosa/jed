import { beforeEach, describe, expect, it, vi } from 'vitest'

import { handleApiV1Request } from '#/lib/api/http.server'
import * as runtimeCache from '#/lib/api-runtime-cache.server'
import * as publicRateLimit from '#/lib/api/public-cache-rate-limit.server'

vi.mock('#/domain/execute.server', () => ({
  executeDomainOperation: vi.fn(async () => ({
    body: { q: 'hi', page: 1, pageCount: 1, items: [] },
    status: 200,
  })),
}))

vi.mock('#/lib/api-runtime-cache.server', async (importOriginal) => {
  const actual = await importOriginal<typeof runtimeCache>()
  return {
    ...actual,
    readRuntimeCache: vi.fn(async () => null),
    writeRuntimeCache: vi.fn(async () => undefined),
  }
})

describe('handleApiV1Request public search caching', () => {
  beforeEach(() => {
    vi.mocked(runtimeCache.writeRuntimeCache).mockClear()
    vi.mocked(runtimeCache.readRuntimeCache).mockClear()
  })

  it('writes runtime cache for anonymous public search', async () => {
    const response = await handleApiV1Request(
      new Request('https://example.com/api/v1/public/search?q=hi&page=1'),
    )
    expect(response.status).toBe(200)
    expect(response.headers.get('Cache-Control')).toContain('public')
    expect(runtimeCache.writeRuntimeCache).toHaveBeenCalledOnce()
  })

  it('runs rate limiting before runtime cache lookup', async () => {
    const order: string[] = []
    const rateSpy = vi
      .spyOn(publicRateLimit, 'assertPublicSearchRateLimit')
      .mockImplementation(() => {
        order.push('rate')
      })
    vi.mocked(runtimeCache.readRuntimeCache).mockImplementation(async () => {
      order.push('read')
      return null
    })
    await handleApiV1Request(
      new Request('https://example.com/api/v1/public/search?q=hi&page=1'),
    )
    expect(order).toEqual(['rate', 'read'])
    rateSpy.mockRestore()
  })

  it('does not read runtime cache when a bearer token is present', async () => {
    await handleApiV1Request(
      new Request('https://example.com/api/v1/public/search?q=hi&page=1', {
        headers: {
          Authorization: 'Bearer amn_live_abc123456789012345678901234',
        },
      }),
    )
    expect(runtimeCache.readRuntimeCache).not.toHaveBeenCalled()
  })

  it('does not write runtime cache when a bearer token is present', async () => {
    const response = await handleApiV1Request(
      new Request('https://example.com/api/v1/public/search?q=hi&page=1', {
        headers: {
          Authorization: 'Bearer amn_live_abc123456789012345678901234',
        },
      }),
    )
    expect(response.headers.get('Cache-Control')).toBe('private, no-store')
    expect(runtimeCache.writeRuntimeCache).not.toHaveBeenCalled()
  })

  it('returns different bodies for different tokens without sharing cache keys', async () => {
    const { executeDomainOperation } = await import('#/domain/execute.server')
    vi.mocked(executeDomainOperation)
      .mockResolvedValueOnce({
        body: { roles: ['admin'] },
        status: 200,
      })
      .mockResolvedValueOnce({
        body: { roles: ['member'] },
        status: 200,
      })

    const responseA = await handleApiV1Request(
      new Request('https://example.com/api/v1/me', {
        headers: { Authorization: 'Bearer amn_live_aaaaaaaaaaaaaaaaaaaaaaaa' },
      }),
    )
    const responseB = await handleApiV1Request(
      new Request('https://example.com/api/v1/me', {
        headers: { Authorization: 'Bearer amn_live_bbbbbbbbbbbbbbbbbbbbbbbb' },
      }),
    )
    expect(await responseA.json()).not.toEqual(await responseB.json())
    expect(responseA.headers.get('Cache-Control')).toBe('private, no-store')
    expect(responseB.headers.get('Cache-Control')).toBe('private, no-store')
    expect(runtimeCache.readRuntimeCache).not.toHaveBeenCalled()
    expect(executeDomainOperation).toHaveBeenCalledTimes(2)
  })

  it('skips executor rate limit when q is under 2 characters', async () => {
    const { executeDomainOperation } = await import('#/domain/execute.server')
    vi.mocked(executeDomainOperation).mockResolvedValue({
      body: { q: 'a', page: 1, pageCount: 1, items: [] },
      status: 200,
    })

    await handleApiV1Request(
      new Request('https://example.com/api/v1/public/search?q=a&page=1'),
    )

    expect(executeDomainOperation).toHaveBeenCalledWith(
      expect.any(Request),
      expect.anything(),
      expect.anything(),
      { skipPublicSearchRateLimit: true },
    )
  })

  it('passes normalized q and page to execute on the cached path', async () => {
    const { executeDomainOperation } = await import('#/domain/execute.server')
    vi.mocked(executeDomainOperation).mockImplementation(
      async (_request, _operation, _params, options) => {
        expect(options?.directInput).toEqual({ q: 'hello', page: 2 })
        expect(options?.skipPublicSearchRateLimit).toBe(true)
        return {
          body: { q: 'hello', page: 2, pageCount: 1, items: [] },
          status: 200,
        }
      },
    )

    const response = await handleApiV1Request(
      new Request(
        'https://example.com/api/v1/public/search?q=HELLO&page=2&evil=1',
      ),
    )
    const json = await response.json()
    expect(json.q).toBe('hello')
    expect(json.page).toBe(2)
  })
})
