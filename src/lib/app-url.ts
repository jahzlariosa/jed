type Env = Record<string, string | undefined>

const LOOPBACK_HOSTS = new Set(['localhost', '127.0.0.1', '[::1]'])

/**
 * Public origin of this deployment, used for links in auth emails (staff invites,
 * password reset). Never derived from the request Host header.
 *
 * - `APP_URL` wins when set (production, custom domains, or a fixed preview domain).
 * - On Vercel *preview* deploys with no `APP_URL`, fall back to `https://$VERCEL_URL`.
 * - Outside production (local dev), default to http://localhost:3000.
 * - Anywhere else (production without `APP_URL`) it is a startup error: fail closed.
 */
export function resolveAppUrl(env: Env): string {
  const explicit = env.APP_URL?.trim()
  const isProduction = env.NODE_ENV === 'production'

  let candidate = explicit
  if (!candidate && env.VERCEL_ENV === 'preview' && env.VERCEL_URL) {
    candidate = `https://${env.VERCEL_URL.trim()}`
  }
  if (!candidate && !isProduction) {
    candidate = 'http://localhost:3000'
  }
  if (!candidate) {
    throw new Error(
      'APP_URL is required in production (for example https://app.example.com)',
    )
  }

  let url: URL
  try {
    url = new URL(candidate)
  } catch {
    throw new Error(
      'APP_URL must be an absolute URL such as https://app.example.com',
    )
  }

  if (url.protocol !== 'https:' && url.protocol !== 'http:') {
    throw new Error('APP_URL must use http or https')
  }
  const isLoopback = LOOPBACK_HOSTS.has(url.hostname)
  if (isProduction && url.protocol !== 'https:' && !isLoopback) {
    throw new Error(
      'APP_URL must use https in production (loopback hosts excepted)',
    )
  }
  if (
    url.username ||
    url.password ||
    url.search ||
    url.hash ||
    url.pathname !== '/'
  ) {
    throw new Error(
      'APP_URL must be an origin only (no path, query, hash or credentials)',
    )
  }

  return url.origin
}

/**
 * Sibling origin when a site is served on both apex and www (e.g. APP_URL is
 * https://example.com but pages are also served at https://www.example.com).
 */
export function companionSiteOrigin(origin: string): string | undefined {
  let url: URL
  try {
    url = new URL(origin)
  } catch {
    return undefined
  }

  const { hostname, protocol } = url
  if (
    LOOPBACK_HOSTS.has(hostname) ||
    hostname.endsWith('.vercel.app') ||
    hostname.endsWith('.localhost')
  ) {
    return undefined
  }

  if (hostname.startsWith('www.')) {
    return `${protocol}//${hostname.slice(4)}`
  }

  return `${protocol}//www.${hostname}`
}

/** Origins allowed for CSRF / trusted comparisons alongside the request origin. */
export function getTrustedAppOrigins(env: Env = process.env): string[] {
  try {
    const primary = resolveAppUrl(env)
    const companion = companionSiteOrigin(primary)
    return companion ? [primary, companion] : [primary]
  } catch (error) {
    console.error(error)
    return []
  }
}
