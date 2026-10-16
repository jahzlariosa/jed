import { RESERVED_CMS_PAGE_SLUGS } from '#/lib/cms/pages'

const PUBLIC_XML_PATHS = new Set([
  '/sitemap.xml',
  '/blog/rss.xml',
  '/robots.txt',
])

export function isPublicXmlPath(pathname: string): boolean {
  return PUBLIC_XML_PATHS.has(pathname)
}

export function isPreviewDeployment(): boolean {
  const env = process.env.VERCEL_ENV
  return Boolean(env && env !== 'production')
}

export function normalizeTrailingSlash(pathname: string): string | null {
  if (pathname.length > 1 && pathname.endsWith('/')) {
    return pathname.slice(0, -1)
  }
  return null
}

/** Vercel edge route transform query key; separates CDN cache from anonymous HTML. */
export const EDGE_CREDENTIALED_CACHE_QUERY = '__amn_edge_cred'

/** Supabase Auth SSR cookie name: `sb-<project-ref>-auth-token`. */
export const SUPABASE_AUTH_COOKIE_RE = /\bsb-[^=;\s]+-auth-token(?:\.\d+)?=/i

const DRAFT_PREVIEW_VALUES = new Set(['true', '1'])

export function requestHasSupabaseAuthCookie(request: Request): boolean {
  const cookie = request.headers.get('cookie')
  if (!cookie) {
    return false
  }
  return SUPABASE_AUTH_COOKIE_RE.test(cookie)
}

export function requestHasAuthCredentials(request: Request): boolean {
  const authorization = request.headers.get('authorization')?.trim()
  if (authorization) {
    return true
  }
  return requestHasSupabaseAuthCookie(request)
}

export function hasDraftPreviewParam(url: URL): boolean {
  const value = url.searchParams.get('draftPreview')
  if (!value) {
    return false
  }
  return DRAFT_PREVIEW_VALUES.has(value.toLowerCase())
}

export function requestAllowsPublicEdgeCache(
  request: Request,
  url: URL,
): boolean {
  if (requestHasAuthCredentials(request)) {
    return false
  }
  if (url.searchParams.has(EDGE_CREDENTIALED_CACHE_QUERY)) {
    return false
  }
  if (hasDraftPreviewParam(url)) {
    return false
  }
  return true
}

export function shouldSkipRedirectLookup(pathname: string): boolean {
  return (
    pathname.startsWith('/admin') ||
    pathname.startsWith('/api') ||
    pathname.startsWith('/auth')
  )
}

/** Skip redirect DB, public SEO settings, and HTML CSP hashing (admin, API, auth, server fns). */
export function shouldUseLightRequestMiddleware(
  pathname: string,
  request: Request,
): boolean {
  if (request.headers.get('x-tsr-serverFn') === 'true') {
    return true
  }
  return shouldSkipRedirectLookup(pathname)
}

const NON_PUBLIC_HTML_PREFIXES = [
  '/login',
  '/signup',
  '/forgot-password',
  '/check-email',
  '/reset-password',
  '/update-password',
  '/mfa-setup',
  '/mfa-challenge',
  '/account',
  '/admin',
  '/admin-panel',
  '/roles',
  '/auth',
]

export function isBlogPublicCachePath(pathname: string): boolean {
  return (
    pathname === '/blog' ||
    pathname.startsWith('/blog/') ||
    pathname === '/blog/rss.xml'
  )
}

export function isPublicCacheableHtmlPath(pathname: string): boolean {
  for (const prefix of NON_PUBLIC_HTML_PREFIXES) {
    if (pathname === prefix || pathname.startsWith(`${prefix}/`)) {
      return false
    }
  }
  if (pathname === '/') {
    return true
  }
  if (
    pathname.startsWith('/blog') ||
    pathname.startsWith('/docs') ||
    pathname.startsWith('/features')
  ) {
    return true
  }
  if (pathname === '/contact' || pathname === '/search') {
    return true
  }
  const segment = pathname.slice(1)
  if (
    segment &&
    !segment.includes('/') &&
    !RESERVED_CMS_PAGE_SLUGS.has(segment)
  ) {
    return /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(segment)
  }
  return false
}
