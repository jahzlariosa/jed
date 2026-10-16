import '@tanstack/react-start/server-only'

import { createHash } from 'node:crypto'

import { getDomainOperations } from '#/domain/registry'

const PRIVATE_NO_STORE = 'private, no-store'
const PRIVATE_VARY = 'Authorization, Cookie'
/** Edge-cacheable public responses: omit Cookie so Vercel CDN can store variants. */
const PUBLIC_VARY = 'Accept-Encoding, Authorization'
const PUBLIC_PUBLISHED_CC =
  'public, max-age=60, s-maxage=300, stale-while-revalidate=600'
const PUBLIC_OPENAPI_CC =
  'public, max-age=300, s-maxage=3600, stale-while-revalidate=86400'

export type ApiCacheKind =
  | 'private'
  | 'private-auth'
  | 'public-openapi'
  | 'public-published'
  | 'health-no-store'

export type ApiCacheHeaderOptions = {
  etag?: string
  cacheTags?: string[]
  retryAfterSeconds?: number
}

export function requestHasApiCredentials(request: Request): boolean {
  const authorization = request.headers.get('Authorization')?.trim()
  if (authorization) {
    return true
  }
  const cookie = request.headers.get('Cookie')?.trim()
  return Boolean(cookie)
}

export function cacheHeaders(
  kind: ApiCacheKind,
  request: Request,
  options: ApiCacheHeaderOptions = {},
): Record<string, string> {
  const credentialed = requestHasApiCredentials(request)
  const effectiveKind = credentialed
    ? kind === 'public-openapi' || kind === 'public-published'
      ? 'private-auth'
      : kind === 'health-no-store'
        ? 'health-no-store'
        : 'private-auth'
    : kind

  const headers: Record<string, string> = {}

  switch (effectiveKind) {
    case 'health-no-store':
      headers['Cache-Control'] = PRIVATE_NO_STORE
      headers.Vary = PRIVATE_VARY
      break
    case 'private':
      headers['Cache-Control'] = PRIVATE_NO_STORE
      headers.Vary = PRIVATE_VARY
      break
    case 'private-auth':
      headers['Cache-Control'] = PRIVATE_NO_STORE
      headers.Pragma = 'no-cache'
      headers.Vary = PRIVATE_VARY
      break
    case 'public-openapi':
      headers['Cache-Control'] = PUBLIC_OPENAPI_CC
      headers.Vary = PUBLIC_VARY
      break
    case 'public-published':
      headers['Cache-Control'] = PUBLIC_PUBLISHED_CC
      headers.Vary = PUBLIC_VARY
      break
    default:
      headers['Cache-Control'] = PRIVATE_NO_STORE
      headers.Vary = PRIVATE_VARY
  }

  if (
    credentialed ||
    effectiveKind === 'private' ||
    effectiveKind === 'private-auth' ||
    effectiveKind === 'health-no-store'
  ) {
    delete headers.ETag
  } else if (options.etag) {
    headers.ETag = options.etag
  }

  if (options.cacheTags?.length && !credentialed) {
    const tagValue = options.cacheTags.join(', ')
    headers['Cache-Tag'] = tagValue
    headers['Vercel-Cache-Tag'] = tagValue
  }

  if (options.retryAfterSeconds !== undefined) {
    headers['Retry-After'] = String(options.retryAfterSeconds)
  }

  return headers
}

export function applyCacheHeaders(
  response: Response,
  request: Request,
  kind: ApiCacheKind,
  options: ApiCacheHeaderOptions = {},
): Response {
  const headers = new Headers(response.headers)
  for (const [name, value] of Object.entries(
    cacheHeaders(kind, request, options),
  )) {
    headers.set(name, value)
  }
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  })
}

export function strongEtagFromPayload(payload: string): string {
  const digest = createHash('sha256').update(payload).digest('hex')
  return `"${digest}"`
}

export function getApiBuildId(): string {
  return (
    process.env.VERCEL_GIT_COMMIT_SHA?.slice(0, 12) ??
    process.env.VERCEL_DEPLOYMENT_ID ??
    'local'
  )
}

export function resolveOperationCacheKind(
  operationId: string,
  scopes: string | string[],
): ApiCacheKind {
  if (operationId === 'search_public' && scopes === 'public') {
    return 'public-published'
  }
  return 'private'
}

export type ApiV1RouteCacheSpec = {
  method: string
  path: string
  cacheKind: ApiCacheKind
}

export function listApiV1RouteCacheSpecs(): ApiV1RouteCacheSpec[] {
  const domainRoutes = getDomainOperations().map((operation) => ({
    method: operation.method,
    path: `/api/v1${operation.path}`,
    cacheKind: resolveOperationCacheKind(operation.id, operation.scopes),
  }))
  return [
    {
      method: 'GET',
      path: '/api/v1/health',
      cacheKind: 'health-no-store',
    },
    {
      method: 'GET',
      path: '/api/v1/openapi.json',
      cacheKind: 'public-openapi',
    },
    ...domainRoutes,
  ]
}

export const MCP_ROUTE_PATHS = [
  { method: 'GET', path: '/api/mcp' },
  { method: 'POST', path: '/api/mcp' },
  { method: 'DELETE', path: '/api/mcp' },
  { method: 'OPTIONS', path: '/api/mcp' },
  { method: 'GET', path: '/api/mcp/oauth' },
] as const

export function mcpCacheHeaders(): Record<string, string> {
  return {
    'Cache-Control': PRIVATE_NO_STORE,
    Pragma: 'no-cache',
    Vary: PRIVATE_VARY,
  }
}

export function applyMcpCacheHeaders(response: Response): Response {
  const headers = new Headers(response.headers)
  for (const [name, value] of Object.entries(mcpCacheHeaders())) {
    headers.set(name, value)
  }
  headers.delete('ETag')
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  })
}

function normalizeEtagValue(value: string): string {
  const trimmed = value.trim()
  return trimmed.startsWith('W/') ? trimmed.slice(2) : trimmed
}

export function ifNoneMatchSatisfies(
  ifNoneMatch: string,
  etag: string,
): boolean {
  const target = normalizeEtagValue(etag)
  for (const part of ifNoneMatch.split(',')) {
    const candidate = part.trim()
    if (!candidate) {
      continue
    }
    if (candidate === '*') {
      return true
    }
    if (normalizeEtagValue(candidate) === target) {
      return true
    }
  }
  return false
}

export function notModifiedResponse(
  request: Request,
  kind: ApiCacheKind,
  etag: string,
  options: ApiCacheHeaderOptions = {},
): Response | null {
  if (requestHasApiCredentials(request)) {
    return null
  }
  const ifNoneMatch = request.headers.get('If-None-Match')
  if (!ifNoneMatch || !ifNoneMatchSatisfies(ifNoneMatch, etag)) {
    return null
  }
  const headers = new Headers(cacheHeaders(kind, request, { ...options, etag }))
  return new Response(null, { status: 304, headers })
}
