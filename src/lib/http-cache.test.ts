import { describe, expect, it } from 'vitest'

import {
  buildPublicCacheKey,
  normalizePublicSearchQuery,
} from '#/lib/api-runtime-cache.server'
import {
  cacheHeaders,
  ifNoneMatchSatisfies,
  MCP_ROUTE_PATHS,
  notModifiedResponse,
  requestHasApiCredentials,
  strongEtagFromPayload,
} from '#/lib/http-cache.server'

describe('cacheHeaders', () => {
  it('forces private no-store when Authorization is present on public routes', () => {
    const request = new Request('https://example.com/api/v1/public/search', {
      headers: { Authorization: 'Bearer amn_live_test' },
    })
    const headers = cacheHeaders('public-published', request, {
      etag: '"abc"',
      cacheTags: ['content:list'],
    })
    expect(headers['Cache-Control']).toBe('private, no-store')
    expect(headers.Pragma).toBe('no-cache')
    expect(headers.Vary).toBe('Authorization, Cookie')
    expect(headers.ETag).toBeUndefined()
    expect(headers['Cache-Tag']).toBeUndefined()
  })

  it('returns public openapi headers for anonymous requests', () => {
    const request = new Request('https://example.com/api/v1/openapi.json')
    const headers = cacheHeaders('public-openapi', request, {
      etag: '"spec"',
    })
    expect(headers['Cache-Control']).toContain('public')
    expect(headers['Cache-Control']).toContain('s-maxage=3600')
    expect(headers.Vary).toBe('Accept-Encoding, Authorization')
    expect(headers.ETag).toBe('"spec"')
  })

  it('health is always no-store', () => {
    const request = new Request('https://example.com/api/v1/health')
    const headers = cacheHeaders('health-no-store', request)
    expect(headers['Cache-Control']).toBe('private, no-store')
  })
})

describe('requestHasApiCredentials', () => {
  it('treats any Cookie header as credentials on public routes', () => {
    const headers = cacheHeaders(
      'public-published',
      new Request('https://example.com/api/v1/public/search', {
        headers: { Cookie: 'theme=dark' },
      }),
      { etag: '"x"', cacheTags: ['content:list'] },
    )
    expect(headers['Cache-Control']).toBe('private, no-store')
    expect(headers.ETag).toBeUndefined()
  })

  it('detects bearer tokens and cookies', () => {
    expect(
      requestHasApiCredentials(
        new Request('https://x', {
          headers: { Authorization: 'Bearer token' },
        }),
      ),
    ).toBe(true)
    expect(
      requestHasApiCredentials(
        new Request('https://x', {
          headers: { Cookie: 'any=value' },
        }),
      ),
    ).toBe(true)
    expect(requestHasApiCredentials(new Request('https://x'))).toBe(false)
  })
})

describe('public cache key builder', () => {
  it('normalizes search query and drops unknown keys', () => {
    const params = new URLSearchParams(
      'page=2&q=Hello&Host=evil&x-forwarded-host=evil',
    )
    const normalized = normalizePublicSearchQuery(params)
    expect(normalized).toEqual({ page: '2', q: 'hello' })
    if (!normalized) {
      throw new Error('expected normalized query')
    }
    const key = buildPublicCacheKey('/public/search', normalized)
    expect(key).toBe('v1:pub:/public/search:page=2&q=hello:1')
    expect(key).not.toContain('Host')
    expect(key).not.toContain('forwarded')
  })

  it('returns null when q is shorter than 2 characters', () => {
    expect(
      normalizePublicSearchQuery(new URLSearchParams('q=a&page=1')),
    ).toBeNull()
  })
})

describe('ETag and 304', () => {
  it('returns 304 when If-None-Match matches for anonymous public routes', () => {
    const etag = strongEtagFromPayload('{"ok":true}')
    const request = new Request('https://example.com/api/v1/openapi.json', {
      headers: { 'If-None-Match': etag },
    })
    const response = notModifiedResponse(request, 'public-openapi', etag)
    expect(response?.status).toBe(304)
    expect(response?.headers.get('ETag')).toBe(etag)
  })

  it('matches weak ETag prefixes from intermediaries', () => {
    const etag = strongEtagFromPayload('{"ok":true}')
    expect(ifNoneMatchSatisfies(`W/${etag}`, etag)).toBe(true)
    expect(ifNoneMatchSatisfies(etag, `W/${etag}`)).toBe(true)
  })

  it('skips 304 when a bearer token is present', () => {
    const etag = strongEtagFromPayload('{"ok":true}')
    const request = new Request('https://example.com/api/v1/openapi.json', {
      headers: {
        'If-None-Match': etag,
        Authorization: 'Bearer amn_live_x',
      },
    })
    expect(notModifiedResponse(request, 'public-openapi', etag)).toBeNull()
  })
})

describe('MCP route inventory', () => {
  it('documents MCP routes for header tests', () => {
    expect(MCP_ROUTE_PATHS.length).toBe(5)
  })
})
