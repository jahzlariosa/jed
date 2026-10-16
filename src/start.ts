import {
  createCsrfMiddleware,
  createMiddleware,
  createStart,
} from '@tanstack/react-start'
import { setResponseHeader } from '@tanstack/react-start/server'

import { safeInternalPath } from '#/auth/path'
import { getTrustedAppOrigins } from '#/lib/app-url'
import { getAppUrl } from '#/lib/app-url.server'
import { applyPublicHtmlContentSecurityPolicy } from '#/lib/apply-public-html-csp.server'
import {
  bindRequestSsrNonce,
  requireRequestSsrNonce,
} from '#/lib/ssr-nonce.server'
import {
  HSTS_HEADER,
  STATIC_SECURITY_HEADERS,
  buildContentSecurityPolicy,
  generateNonce,
} from '#/lib/security-headers.server'
import {
  NOINDEX_HEADERS,
  BLOG_PUBLIC_CACHE_HEADERS,
  PUBLIC_CACHE_HEADERS,
  PUBLIC_XML_CACHE_HEADERS,
} from '#/lib/seo'
import {
  getCachedRedirectExternalHosts,
  lookupCachedRedirect,
} from '#/lib/seo/redirect-cache.server'
import { loadPublicSeoSettings } from '#/lib/seo/public-settings.server'
import {
  isBlogPublicCachePath,
  isPreviewDeployment,
  isPublicCacheableHtmlPath,
  isPublicXmlPath,
  normalizeTrailingSlash,
  requestAllowsPublicEdgeCache,
  shouldSkipRedirectLookup,
  shouldUseLightRequestMiddleware,
} from '#/lib/seo/request-policy.server'
import { createServiceRoleClient } from '#/lib/supabase/service-role.server'

const bindSsrNonceMiddleware = createMiddleware().server(
  async ({ request, next }) => {
    const nonce = generateNonce()
    bindRequestSsrNonce(request, nonce)
    return next({ context: { nonce } })
  },
)

const csrfMiddleware = createCsrfMiddleware({
  filter: (ctx) => ctx.handlerType === 'serverFn',
  origin: (origin, ctx) => {
    const trusted = getTrustedAppOrigins()
    if (trusted.includes(origin)) {
      return true
    }
    return origin === new URL(ctx.request.url).origin
  },
})

function isAllowedExternalUrl(target: string, allowHosts: string[]): boolean {
  try {
    const url = new URL(target)
    if (url.protocol !== 'https:') {
      return false
    }
    return allowHosts.includes(url.hostname)
  } catch {
    return false
  }
}

async function recordRedirectHit(path: string): Promise<void> {
  try {
    const supabase = createServiceRoleClient()
    await supabase.rpc('record_url_redirect_hit', { request_path: path })
  } catch (error) {
    console.error(error)
  }
}

/** Edge-cacheable public HTML/XML: omit Cookie from Vary (see vercel.json credentialed query transform). */
const PUBLIC_EDGE_VARY = 'Accept-Encoding, Authorization'

function publicEdgeCacheTags(pathname: string): string[] | undefined {
  if (pathname === '/blog/rss.xml') {
    return ['content', 'content:list', 'blog', 'blog:list']
  }
  if (isPublicXmlPath(pathname)) {
    return ['content', 'content:list']
  }
  if (!isPublicCacheableHtmlPath(pathname)) {
    return undefined
  }
  const tags = ['content', 'content:list', 'html-csp-v2']
  if (pathname === '/' || pathname.startsWith('/blog')) {
    tags.push('blog', 'blog:list')
  }
  return tags
}

function applyEdgeCacheHeaders(
  response: Response,
  pathname: string,
  edgeCacheable: boolean,
): Response {
  const headers = new Headers(response.headers)
  if (headers.has('set-cookie')) {
    headers.set('Cache-Control', 'private, no-store')
    headers.set('Vary', 'Cookie, Authorization')
    return new Response(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers,
    })
  }
  if (!edgeCacheable) {
    if (isPublicXmlPath(pathname) || isPublicCacheableHtmlPath(pathname)) {
      headers.set('Cache-Control', 'private, no-store')
      headers.set('Vary', 'Cookie, Authorization')
    }
    return new Response(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers,
    })
  }
  if (isBlogPublicCachePath(pathname)) {
    headers.set('Cache-Control', BLOG_PUBLIC_CACHE_HEADERS['Cache-Control'])
  } else if (isPublicXmlPath(pathname)) {
    headers.set('Cache-Control', PUBLIC_XML_CACHE_HEADERS['Cache-Control'])
  } else if (isPublicCacheableHtmlPath(pathname)) {
    headers.set('Cache-Control', PUBLIC_CACHE_HEADERS['Cache-Control'])
  }
  headers.set('Vary', PUBLIC_EDGE_VARY)
  const cacheTags = publicEdgeCacheTags(pathname)
  if (cacheTags?.length) {
    const tagValue = cacheTags.join(', ')
    headers.set('Cache-Tag', tagValue)
    headers.set('Vercel-Cache-Tag', tagValue)
  }
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  })
}

function applyLightSecurityHeaders(nonce: string, isProduction: boolean) {
  setResponseHeader(
    isProduction
      ? 'Content-Security-Policy'
      : 'Content-Security-Policy-Report-Only',
    buildContentSecurityPolicy(nonce, process.env, {
      ga4: null,
      gtm: null,
      plausible: null,
      vercelAnalytics: false,
    }),
  )
  for (const [name, value] of Object.entries(STATIC_SECURITY_HEADERS)) {
    setResponseHeader(name, value)
  }
  if (isProduction) {
    setResponseHeader('Strict-Transport-Security', HSTS_HEADER)
  }
}

const seoRequestMiddleware = createMiddleware().server(
  async ({ request, next }) => {
    const url = new URL(request.url)
    const pathname = url.pathname

    if (shouldUseLightRequestMiddleware(pathname, request)) {
      const isProduction = process.env.NODE_ENV === 'production'
      const nonce = requireRequestSsrNonce()
      applyLightSecurityHeaders(nonce, isProduction)
      return next()
    }

    const edgeCacheable =
      requestAllowsPublicEdgeCache(request, url) &&
      (isPublicXmlPath(pathname) || isPublicCacheableHtmlPath(pathname))

    const stripped = normalizeTrailingSlash(pathname)
    if (stripped) {
      const location = `${stripped}${url.search}`
      return new Response(null, {
        status: 308,
        headers: { Location: location },
      })
    }

    if (!shouldSkipRedirectLookup(pathname)) {
      const redirect = await lookupCachedRedirect(pathname)
      if (redirect) {
        void recordRedirectHit(pathname)
        if (redirect.statusCode === 410) {
          return new Response('Gone', { status: 410 })
        }
        if (redirect.isExternal) {
          const hosts = await getCachedRedirectExternalHosts()
          if (!isAllowedExternalUrl(redirect.toPath, hosts)) {
            return new Response('Bad redirect target', { status: 500 })
          }
          const external = new URL(redirect.toPath)
          return new Response(null, {
            status: redirect.statusCode,
            headers: { Location: external.href },
          })
        }
        const safe = safeInternalPath(redirect.toPath, null)
        if (!safe) {
          return new Response('Bad redirect target', { status: 500 })
        }
        const origin = getAppUrl() ?? url.origin
        const location = new URL(safe, origin).href
        return new Response(null, {
          status: redirect.statusCode,
          headers: { Location: location },
        })
      }
    }

    const preview = isPreviewDeployment()
    if (preview) {
      setResponseHeader('X-Robots-Tag', NOINDEX_HEADERS['X-Robots-Tag'])
    }

    const isProduction = process.env.NODE_ENV === 'production'
    const seoSettings = await loadPublicSeoSettings()
    const analytics = {
      ga4: seoSettings.ga4MeasurementId,
      gtm: seoSettings.gtmContainerId,
      plausible: seoSettings.plausibleDomain,
      vercelAnalytics: seoSettings.vercelAnalyticsEnabled,
    }

    if (isPublicXmlPath(pathname)) {
      for (const [name, value] of Object.entries(STATIC_SECURITY_HEADERS)) {
        setResponseHeader(name, value)
      }
      if (isProduction) {
        setResponseHeader('Strict-Transport-Security', HSTS_HEADER)
      }
      if (edgeCacheable) {
        setResponseHeader(
          'Cache-Control',
          pathname === '/blog/rss.xml'
            ? BLOG_PUBLIC_CACHE_HEADERS['Cache-Control']
            : PUBLIC_XML_CACHE_HEADERS['Cache-Control'],
        )
      } else {
        setResponseHeader('Cache-Control', 'private, no-store')
        setResponseHeader('Vary', 'Cookie, Authorization')
      }
      const response = await next()
      return response instanceof Response
        ? applyEdgeCacheHeaders(response, pathname, edgeCacheable)
        : response
    }

    const anonymousPublicHtml =
      isPublicCacheableHtmlPath(pathname) && edgeCacheable
    const nonce = requireRequestSsrNonce()
    if (!anonymousPublicHtml) {
      setResponseHeader(
        isProduction
          ? 'Content-Security-Policy'
          : 'Content-Security-Policy-Report-Only',
        buildContentSecurityPolicy(nonce, process.env, analytics),
      )
    }
    for (const [name, value] of Object.entries(STATIC_SECURITY_HEADERS)) {
      setResponseHeader(name, value)
    }
    if (isProduction) {
      setResponseHeader('Strict-Transport-Security', HSTS_HEADER)
    }

    if (!seoSettings.allowSearchIndexing) {
      setResponseHeader('X-Robots-Tag', NOINDEX_HEADERS['X-Robots-Tag'])
    }

    if (isPublicCacheableHtmlPath(pathname)) {
      if (edgeCacheable) {
        setResponseHeader(
          'Cache-Control',
          isBlogPublicCachePath(pathname)
            ? BLOG_PUBLIC_CACHE_HEADERS['Cache-Control']
            : PUBLIC_CACHE_HEADERS['Cache-Control'],
        )
      } else {
        setResponseHeader('Cache-Control', 'private, no-store')
        setResponseHeader('Vary', 'Cookie, Authorization')
      }
    }

    const result = await next({ context: { nonce } })
    if (result instanceof Response) {
      const withCsp = anonymousPublicHtml
        ? await applyPublicHtmlContentSecurityPolicy(
            result,
            process.env,
            analytics,
            isProduction,
            nonce,
          )
        : result
      return applyEdgeCacheHeaders(withCsp, pathname, edgeCacheable)
    }
    if (anonymousPublicHtml && result.response instanceof Response) {
      result.response = await applyPublicHtmlContentSecurityPolicy(
        result.response,
        process.env,
        analytics,
        isProduction,
        nonce,
      )
    }
    result.response = applyEdgeCacheHeaders(
      result.response,
      pathname,
      edgeCacheable,
    )
    return result
  },
)

export const startInstance = createStart(() => ({
  requestMiddleware: [
    bindSsrNonceMiddleware,
    csrfMiddleware,
    seoRequestMiddleware,
  ],
}))
