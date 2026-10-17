import '@tanstack/react-start/server-only'

type Env = Record<string, string | undefined>

export type AnalyticsCspConfig = {
  ga4: string | null
  gtm: string | null
  plausible: string | null
  vercelAnalytics: boolean
}

function supabaseOrigin(env: Env): string | null {
  const raw = env.VITE_SUPABASE_URL
  if (!raw) return null
  try {
    return new URL(raw).origin
  } catch {
    return null
  }
}

function analyticsOrigins(config: AnalyticsCspConfig): {
  script: string[]
  connect: string[]
} {
  const script: string[] = []
  const connect: string[] = []
  if (config.gtm) {
    script.push('https://www.googletagmanager.com')
    connect.push('https://www.googletagmanager.com')
  }
  if (config.ga4) {
    script.push('https://www.googletagmanager.com')
    connect.push(
      'https://www.google-analytics.com',
      'https://region1.google-analytics.com',
      'https://www.googletagmanager.com',
    )
  }
  if (config.plausible) {
    script.push('https://plausible.io')
    connect.push('https://plausible.io')
  }
  if (config.vercelAnalytics) {
    script.push('https://va.vercel-scripts.com')
    connect.push('https://vitals.vercel-insights.com')
  }
  return { script, connect }
}

export function buildContentSecurityPolicy(
  nonce: string,
  env: Env,
  analytics: AnalyticsCspConfig = {
    ga4: null,
    gtm: null,
    plausible: null,
    vercelAnalytics: false,
  },
): string {
  const supabase = supabaseOrigin(env)
  const { script: analyticsScript, connect: analyticsConnect } =
    analyticsOrigins(analytics)
  const connect = [
    "'self'",
    ...analyticsConnect,
    ...(supabase ? [supabase] : []),
  ]
  const imgSrc = [
    "'self'",
    'data:',
    'blob:',
    ...(supabase ? [`${supabase}/storage/v1/`] : []),
  ]
  const scriptParts = [
    "'self'",
    `'nonce-${nonce}'`,
    "'strict-dynamic'",
    ...analyticsScript,
  ]
  const directives = [
    "default-src 'self'",
    `script-src ${scriptParts.join(' ')}`,
    "style-src 'self' 'unsafe-inline'",
    `img-src ${imgSrc.join(' ')}`,
    "font-src 'self' data:",
    `connect-src ${connect.join(' ')}`,
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-src 'self' https://www.youtube.com https://www.youtube-nocookie.com",
    "frame-ancestors 'none'",
  ]
  if (env.NODE_ENV === 'production')
    directives.push('upgrade-insecure-requests')
  return directives.join('; ')
}

/** Cached public HTML: no per-request nonce (Vercel edge can store responses). */
export function buildPublicHtmlContentSecurityPolicy(
  env: Env,
  analytics: AnalyticsCspConfig = {
    ga4: null,
    gtm: null,
    plausible: null,
    vercelAnalytics: false,
  },
  inlineScriptHashes: string[] = [],
): string {
  const supabase = supabaseOrigin(env)
  const { script: analyticsScript, connect: analyticsConnect } =
    analyticsOrigins(analytics)
  const connect = [
    "'self'",
    ...analyticsConnect,
    ...(supabase ? [supabase] : []),
  ]
  const imgSrc = [
    "'self'",
    'data:',
    'blob:',
    ...(supabase ? [`${supabase}/storage/v1/`] : []),
  ]
  const scriptParts = ["'self'", ...inlineScriptHashes, ...analyticsScript]
  const directives = [
    "default-src 'self'",
    `script-src ${scriptParts.join(' ')}`,
    "style-src 'self' 'unsafe-inline'",
    `img-src ${imgSrc.join(' ')}`,
    "font-src 'self' data:",
    `connect-src ${connect.join(' ')}`,
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-src 'self' https://www.youtube.com https://www.youtube-nocookie.com",
    "frame-ancestors 'none'",
  ]
  if (env.NODE_ENV === 'production')
    directives.push('upgrade-insecure-requests')
  return directives.join('; ')
}

export const buildAnalyticsContentSecurityPolicy =
  buildPublicHtmlContentSecurityPolicy

export const STATIC_SECURITY_HEADERS: Record<string, string> = {
  'X-Content-Type-Options': 'nosniff',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Cross-Origin-Opener-Policy': 'same-origin',
  'Permissions-Policy':
    'camera=(), microphone=(), geolocation=(), payment=(), usb=(), interest-cohort=()',
  'X-Frame-Options': 'DENY',
}

export const HSTS_HEADER = 'max-age=63072000; includeSubDomains; preload'

export function generateNonce(): string {
  const bytes = new Uint8Array(16)
  crypto.getRandomValues(bytes)
  let binary = ''
  for (const byte of bytes) binary += String.fromCharCode(byte)
  return btoa(binary)
}
