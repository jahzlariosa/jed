import { describe, expect, it } from 'vitest'

import {
  EDGE_CREDENTIALED_CACHE_QUERY,
  isPublicCacheableHtmlPath,
  requestAllowsPublicEdgeCache,
  requestHasSupabaseAuthCookie,
  shouldUseLightRequestMiddleware,
} from '#/lib/seo/request-policy.server'

describe('isPublicCacheableHtmlPath', () => {
  const privatePaths = [
    '/login',
    '/signup',
    '/forgot-password',
    '/account',
    '/admin',
    '/admin/content',
    '/admin-panel',
    '/roles',
    '/auth/callback',
    '/update-password',
    '/mfa-setup',
    '/mfa-challenge',
  ]

  for (const path of privatePaths) {
    it(`returns false for ${path}`, () => {
      expect(isPublicCacheableHtmlPath(path)).toBe(false)
    })
  }

  it('returns true for marketing paths', () => {
    expect(isPublicCacheableHtmlPath('/')).toBe(true)
    expect(isPublicCacheableHtmlPath('/blog')).toBe(true)
    expect(isPublicCacheableHtmlPath('/contact')).toBe(true)
  })
})

describe('shouldUseLightRequestMiddleware', () => {
  it('skips heavy SEO work for admin, API, and server functions', () => {
    expect(
      shouldUseLightRequestMiddleware(
        '/admin/content',
        new Request('https://x/'),
      ),
    ).toBe(true)
    expect(
      shouldUseLightRequestMiddleware(
        '/api/v1/openapi.json',
        new Request('https://x/'),
      ),
    ).toBe(true)
    expect(
      shouldUseLightRequestMiddleware('/blog', new Request('https://x/')),
    ).toBe(false)
    expect(
      shouldUseLightRequestMiddleware(
        '/blog',
        new Request('https://x/', {
          headers: { 'x-tsr-serverFn': 'true' },
        }),
      ),
    ).toBe(true)
  })
})

describe('requestAllowsPublicEdgeCache', () => {
  it('denies credentialed and edge-bypass query requests', () => {
    const base = new URL('https://example.com/')
    expect(requestAllowsPublicEdgeCache(new Request(base), base)).toBe(true)
    expect(
      requestAllowsPublicEdgeCache(
        new Request(base, {
          headers: { cookie: 'sb-project-ref-auth-token=eyJhbGciOiJIUzI1NiJ9' },
        }),
        base,
      ),
    ).toBe(false)
    expect(
      requestHasSupabaseAuthCookie(
        new Request(base, {
          headers: { cookie: 'sb-ref-auth-token.0=chunk-one' },
        }),
      ),
    ).toBe(true)
    expect(
      requestAllowsPublicEdgeCache(
        new Request(base, { headers: { cookie: '_vercel_jwt=preview' } }),
        base,
      ),
    ).toBe(true)
    expect(
      requestAllowsPublicEdgeCache(
        new Request(base, { headers: { authorization: 'Bearer x' } }),
        base,
      ),
    ).toBe(false)
    const bypass = new URL(
      `https://example.com/?${EDGE_CREDENTIALED_CACHE_QUERY}=1`,
    )
    expect(requestAllowsPublicEdgeCache(new Request(bypass), bypass)).toBe(
      false,
    )
  })
})
