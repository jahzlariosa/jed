import '@tanstack/react-start/server-only'

import { setResponseStatus } from '@tanstack/react-start/server'

function markResponseStatus(status: number): void {
  try {
    setResponseStatus(status)
  } catch {
    /* TanStack Start request context unavailable (unit tests). */
  }
}

import { FORBIDDEN_MESSAGE, UNAUTHORIZED_MESSAGE } from '#/auth/errors'
import { executeDomainOperation } from '#/domain/execute.server'
import { matchDomainOperation } from '#/domain/registry'
import type { DomainOperation } from '#/domain/types'
import {
  buildPublicCacheKey,
  normalizePublicSearchQuery,
  readRuntimeCache,
  writeRuntimeCache,
} from '#/lib/api-runtime-cache.server'
import {
  assertPublicOpenApiRateLimit,
  assertPublicSearchRateLimit,
} from '#/lib/api/public-cache-rate-limit.server'
import {
  applyCacheHeaders,
  getApiBuildId,
  notModifiedResponse,
  requestHasApiCredentials,
  resolveOperationCacheKind,
  strongEtagFromPayload,
  type ApiCacheKind,
} from '#/lib/http-cache.server'

const JSON_HEADERS = {
  'Content-Type': 'application/json; charset=utf-8',
}

export function apiJsonResponse(
  request: Request,
  body: unknown,
  init?: {
    status?: number
    kind?: ApiCacheKind
    etag?: string
    cacheTags?: string[]
    retryAfterSeconds?: number
  },
): Response {
  const payload = JSON.stringify(body)
  const response = new Response(payload, {
    status: init?.status ?? 200,
    headers: JSON_HEADERS,
  })
  if (init?.status) {
    markResponseStatus(init.status)
  }
  const kind = init?.kind ?? 'private'
  return applyCacheHeaders(response, request, kind, {
    etag: init?.etag,
    cacheTags: init?.cacheTags,
    retryAfterSeconds: init?.retryAfterSeconds,
  })
}

export function apiErrorResponse(
  request: Request,
  status: number,
  message: string,
  retryAfterSeconds?: number,
): Response {
  markResponseStatus(status)
  const response = new Response(JSON.stringify({ error: message }), {
    status,
    headers: JSON_HEADERS,
  })
  const kind = status === 401 || status === 403 ? 'private-auth' : 'private'
  return applyCacheHeaders(response, request, kind, {
    retryAfterSeconds,
  })
}

async function handleCachedPublicSearch(
  request: Request,
  operation: DomainOperation<unknown, unknown>,
  params: Record<string, string>,
): Promise<Response> {
  assertPublicSearchRateLimit(request)

  const url = new URL(request.url)
  const query = normalizePublicSearchQuery(url.searchParams)
  if (!query) {
    const { body, status } = await executeDomainOperation(
      request,
      operation,
      params,
      { skipPublicSearchRateLimit: true },
    )
    return apiJsonResponse(request, body, {
      status,
      kind: 'public-published',
    })
  }

  const cacheKey = buildPublicCacheKey('/public/search', query)
  const cached = await readRuntimeCache(cacheKey)
  if (cached) {
    const notModified = notModifiedResponse(
      request,
      'public-published',
      cached.etag,
      {
        cacheTags: ['content', 'content:list'],
      },
    )
    if (notModified) {
      return notModified
    }
    const hit = new Response(cached.body, {
      status: cached.status,
      headers: JSON_HEADERS,
    })
    return applyCacheHeaders(hit, request, 'public-published', {
      etag: cached.etag,
      cacheTags: ['content', 'content:list'],
    })
  }

  const { body, status } = await executeDomainOperation(
    request,
    operation,
    params,
    {
      directInput: {
        q: query.q,
        page: Number.parseInt(query.page, 10),
      },
      skipPublicSearchRateLimit: true,
    },
  )
  const payload = JSON.stringify(body)
  const etag = strongEtagFromPayload(payload)
  const notModified = notModifiedResponse(request, 'public-published', etag, {
    cacheTags: ['content', 'content:list'],
  })
  if (notModified) {
    return notModified
  }
  if (status === 200) {
    await writeRuntimeCache(
      cacheKey,
      { body: payload, etag, status },
      ['content', 'content:list'],
      300,
    )
  }
  return apiJsonResponse(request, body, {
    status,
    kind: status === 200 ? 'public-published' : 'private',
    etag: status === 200 ? etag : undefined,
    cacheTags: status === 200 ? ['content', 'content:list'] : undefined,
  })
}

export async function handleApiV1Request(request: Request): Promise<Response> {
  const url = new URL(request.url)
  const matched = matchDomainOperation(request.method, url.pathname)
  if (!matched) {
    return apiErrorResponse(request, 404, 'Not found')
  }

  const credentialed = requestHasApiCredentials(request)
  const cacheKind = resolveOperationCacheKind(
    matched.operation.id,
    matched.operation.scopes,
  )

  if (
    !credentialed &&
    cacheKind === 'public-published' &&
    matched.operation.id === 'search_public' &&
    request.method === 'GET'
  ) {
    try {
      return await handleCachedPublicSearch(
        request,
        matched.operation,
        matched.params,
      )
    } catch (error) {
      return mapApiError(request, error)
    }
  }

  try {
    const { body, status } = await executeDomainOperation(
      request,
      matched.operation,
      matched.params,
    )
    const kind = credentialed ? 'private-auth' : cacheKind
    return apiJsonResponse(request, body, { status, kind })
  } catch (error) {
    return mapApiError(request, error)
  }
}

function mapApiError(request: Request, error: unknown): Response {
  const message =
    error instanceof Error ? error.message : 'Unable to complete request'
  if (message === UNAUTHORIZED_MESSAGE || message === 'Unauthorized') {
    return apiErrorResponse(request, 401, UNAUTHORIZED_MESSAGE)
  }
  if (message === 'Too many requests') {
    return apiErrorResponse(request, 429, message, 60)
  }
  if (message === FORBIDDEN_MESSAGE) {
    return apiErrorResponse(request, 403, FORBIDDEN_MESSAGE)
  }
  if (
    message === 'Invalid request' ||
    message === 'Idempotency-Key header is required' ||
    message === 'idempotencyKey is required' ||
    message === 'Invalid JSON body'
  ) {
    return apiErrorResponse(request, 400, message)
  }
  console.error(error)
  return apiErrorResponse(request, 500, 'Unable to complete request')
}

export async function handleOpenApiRequest(
  request: Request,
): Promise<Response> {
  const { generateOpenApiDocument } = await import('#/domain/openapi.server')
  const { getAppUrl } = await import('#/lib/app-url.server')
  const origin = getAppUrl() ?? 'http://localhost:3000'
  const doc = generateOpenApiDocument(origin)
  const payload = JSON.stringify(doc)
  const etag = strongEtagFromPayload(`${getApiBuildId()}:${payload}`)

  if (requestHasApiCredentials(request)) {
    return applyCacheHeaders(
      new Response(payload, { status: 200, headers: JSON_HEADERS }),
      request,
      'private-auth',
    )
  }

  assertPublicOpenApiRateLimit(request)

  const cacheKey = buildPublicCacheKey('/openapi.json', {})
  const cached = await readRuntimeCache(cacheKey)
  if (cached) {
    const notModified = notModifiedResponse(
      request,
      'public-openapi',
      cached.etag,
    )
    if (notModified) {
      return notModified
    }
    return applyCacheHeaders(
      new Response(cached.body, {
        status: cached.status,
        headers: JSON_HEADERS,
      }),
      request,
      'public-openapi',
      { etag: cached.etag },
    )
  }

  const notModified = notModifiedResponse(request, 'public-openapi', etag)
  if (notModified) {
    return notModified
  }

  await writeRuntimeCache(
    cacheKey,
    { body: payload, etag, status: 200 },
    ['openapi'],
    3600,
  )

  return applyCacheHeaders(
    new Response(payload, { status: 200, headers: JSON_HEADERS }),
    request,
    'public-openapi',
    { etag },
  )
}

export function handleApiV1MethodNotAllowed(request: Request): Response {
  return apiErrorResponse(request, 405, 'Method not allowed')
}

export function handleHealthRequest(request: Request): Response {
  const response = new Response(JSON.stringify({ ok: true, version: 'v1' }), {
    status: 200,
    headers: JSON_HEADERS,
  })
  return applyCacheHeaders(response, request, 'health-no-store')
}
