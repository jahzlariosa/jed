import { describe, expect, it } from 'vitest'

import { maybeRedirectSignedOutAdminHtml } from './admin-html-redirect.server'

describe('maybeRedirectSignedOutAdminHtml', () => {
  it('redirects signed-out HTML GET /admin to login', () => {
    const response = maybeRedirectSignedOutAdminHtml(
      new Request('https://example.com/admin', {
        headers: { Accept: 'text/html' },
      }),
    )
    expect(response?.status).toBe(302)
    expect(response?.headers.get('Location')).toBe('/login?redirect=%2Fadmin')
  })

  it('preserves nested admin path in redirect param', () => {
    const response = maybeRedirectSignedOutAdminHtml(
      new Request('https://example.com/admin/content?tab=seo', {
        headers: { Accept: 'text/html' },
      }),
    )
    expect(response?.headers.get('Location')).toBe(
      '/login?redirect=%2Fadmin%2Fcontent%3Ftab%3Dseo',
    )
  })

  it('does not redirect JSON or server-fn requests', () => {
    expect(
      maybeRedirectSignedOutAdminHtml(
        new Request('https://example.com/admin', {
          headers: { Accept: 'application/json' },
        }),
      ),
    ).toBeNull()
    expect(
      maybeRedirectSignedOutAdminHtml(
        new Request('https://example.com/admin', {
          headers: { 'x-tsr-serverFn': 'true' },
        }),
      ),
    ).toBeNull()
  })

  it('does not redirect when auth cookie is present', () => {
    expect(
      maybeRedirectSignedOutAdminHtml(
        new Request('https://example.com/admin', {
          headers: {
            Accept: 'text/html',
            Cookie: 'sb-test-auth-token=abc',
          },
        }),
      ),
    ).toBeNull()
  })
})
