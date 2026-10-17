import '@tanstack/react-start/server-only'

import { safeInternalPath } from '#/auth/path'
import { requestHasAuthCredentials } from '#/lib/seo/request-policy.server'

function requestPrefersHtml(request: Request): boolean {
  const accept = request.headers.get('accept')?.toLowerCase() ?? ''
  if (accept.includes('application/json')) {
    return false
  }
  if (accept.includes('text/html')) {
    return true
  }
  if (request.headers.get('x-tsr-serverFn') === 'true') {
    return false
  }
  return accept === '' || accept.includes('*/*')
}

/** Signed-out document navigations to /admin should 302 to login, not 401. */
export function maybeRedirectSignedOutAdminHtml(
  request: Request,
): Response | null {
  const url = new URL(request.url)
  const pathname = url.pathname

  if (
    !pathname.startsWith('/admin') ||
    pathname === '/admin/login' ||
    pathname.startsWith('/api/')
  ) {
    return null
  }

  if (request.method !== 'GET' && request.method !== 'HEAD') {
    return null
  }

  if (requestHasAuthCredentials(request)) {
    return null
  }

  if (!requestPrefersHtml(request)) {
    return null
  }

  const returnTo =
    safeInternalPath(`${pathname}${url.search}`, '/admin') ?? '/admin'
  const location = `/login?redirect=${encodeURIComponent(returnTo)}`

  return new Response(null, {
    status: 302,
    headers: {
      Location: location,
      'Cache-Control': 'private, no-store',
    },
  })
}
