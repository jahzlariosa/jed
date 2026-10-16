import '@tanstack/react-start/server-only'

import { setResponseStatus } from '@tanstack/react-start/server'
import { ZodError } from 'zod'
import { isPermission, type Permission } from '#/auth/permissions'
import { getRequestClient } from '#/auth/session.server'
import {
  assertBearerPermission,
  authenticateBearerRequest,
  requireBearerAuth,
} from '#/lib/api/bearer-auth.server'
import {
  auditApiWriteDenied,
  isApiForbiddenError,
} from '#/lib/api/api-denied-audit.server'
import { writeApiAuditLog } from '#/lib/api/audit-api.server'
import {
  loadIdempotencyRecord,
  resolveWriteIdempotencyKey,
  storeIdempotencyRecord,
} from '#/lib/api/idempotency.server'
import {
  assertApiRateLimit,
  ApiRateLimitError,
} from '#/lib/api/rate-limit-api.server'
import { createSupabaseServerClient } from '#/lib/supabase/server'

import type { DomainOperation, DomainScopes } from './types'
import type { DomainContext } from './types'

function operationNeedsPermissions(
  scopes: DomainScopes,
): Permission[] | null | 'auth' {
  if (scopes === 'public') {
    return null
  }
  if (scopes === 'authenticated') {
    return 'auth'
  }
  return scopes
}

export async function buildDomainContext(
  request: Request,
  scopes: DomainScopes,
  options?: { skipPublicSearchRateLimit?: boolean },
): Promise<DomainContext> {
  const needed = operationNeedsPermissions(scopes)
  if (needed === null) {
    if (!options?.skipPublicSearchRateLimit) {
      try {
        assertApiRateLimit({
          request,
          action: 'public-search',
          limit: 120,
          windowMs: 60_000,
        })
      } catch (error) {
        if (error instanceof ApiRateLimitError) {
          setResponseStatus(429)
          throw new Error('Too many requests')
        }
        throw error
      }
    }
    const bearer = await authenticateBearerRequest(request)
    if (bearer) {
      return {
        user: bearer.user,
        access: bearer.access,
        supabase: bearer.supabase,
        apiTokenId: bearer.tokenId,
      }
    }
    return {
      user: null,
      access: null,
      supabase: createSupabaseServerClient(),
      apiTokenId: null,
    }
  }

  const bearer = await requireBearerAuth(request)
  if (needed === 'auth') {
    return {
      user: bearer.user,
      access: bearer.access,
      supabase: bearer.supabase,
      apiTokenId: bearer.tokenId,
    }
  }

  for (const permission of needed) {
    assertBearerPermission(bearer, permission)
  }
  return {
    user: bearer.user,
    access: bearer.access,
    supabase: bearer.supabase,
    apiTokenId: bearer.tokenId,
  }
}

export function parseQueryRecord(url: URL): Record<string, string> {
  const record: Record<string, string> = {}
  url.searchParams.forEach((value, key) => {
    record[key] = value
  })
  return record
}

async function readJsonBody(
  request: Request,
): Promise<Record<string, unknown>> {
  if (request.method === 'GET' || request.method === 'HEAD') {
    return {}
  }
  const contentType = request.headers.get('content-type') ?? ''
  if (!contentType.includes('application/json')) {
    return {}
  }
  try {
    const parsed = await request.json()
    if (
      typeof parsed === 'object' &&
      parsed !== null &&
      !Array.isArray(parsed)
    ) {
      return parsed as Record<string, unknown>
    }
    return {}
  } catch {
    setResponseStatus(400)
    throw new Error('Invalid JSON body')
  }
}

export type DomainExecuteResult = {
  body: unknown
  status: number
}

export async function executeDomainOperation(
  request: Request,
  operation: DomainOperation<unknown, unknown>,
  params: Record<string, string>,
  options?: {
    directInput?: unknown
    idempotencyKey?: string | null
    skipPublicSearchRateLimit?: boolean
  },
): Promise<DomainExecuteResult> {
  let ctx: DomainContext
  try {
    ctx = await buildDomainContext(request, operation.scopes, {
      skipPublicSearchRateLimit: options?.skipPublicSearchRateLimit,
    })
  } catch (error) {
    if (isApiForbiddenError(error)) {
      await auditApiWriteDenied(request, operation)
    }
    throw error
  }

  const url = new URL(request.url)
  const query = parseQueryRecord(url)
  const body =
    options?.directInput !== undefined ? {} : await readJsonBody(request)
  const rawInput = options?.directInput ?? { ...query, ...params, ...body }

  const isWrite = operation.method !== 'GET'
  let idempotencyKey: string | null = null
  if (isWrite && ctx.apiTokenId) {
    const isMcpCall = options?.directInput !== undefined
    if (isMcpCall && !options?.idempotencyKey?.trim()) {
      setResponseStatus(400)
      throw new Error('idempotencyKey is required')
    }
    idempotencyKey = resolveWriteIdempotencyKey(request, ctx.apiTokenId, {
      explicitKey: options?.idempotencyKey,
    })
    const cached = await loadIdempotencyRecord(ctx.apiTokenId, idempotencyKey)
    if (cached) {
      return { body: cached.responseBody, status: cached.statusCode }
    }
  }

  let input: unknown
  try {
    input = operation.inputSchema.parse(rawInput)
  } catch (error) {
    if (error instanceof ZodError) {
      setResponseStatus(400)
      throw new Error('Invalid request')
    }
    throw error
  }

  let result: unknown
  try {
    result = await operation.handler(ctx, input)
  } catch (error) {
    if (isApiForbiddenError(error)) {
      await auditApiWriteDenied(request, operation)
    }
    throw error
  }
  const status = 200

  if (ctx.user && ctx.apiTokenId) {
    await writeApiAuditLog(getRequestClient(), {
      actorUserId: ctx.user.id,
      apiTokenId: ctx.apiTokenId,
      action: `api.${operation.id}`,
      targetType: 'api',
      targetId: operation.id,
      metadata: { method: operation.method, path: operation.path },
    })
    if (operation.destructive) {
      await writeApiAuditLog(getRequestClient(), {
        actorUserId: ctx.user.id,
        apiTokenId: ctx.apiTokenId,
        action: `api.${operation.id}.destructive`,
        targetType: 'api',
        targetId: operation.id,
        metadata: { method: operation.method, path: operation.path },
      })
    }
  }

  if (isWrite && ctx.apiTokenId && idempotencyKey) {
    await storeIdempotencyRecord(ctx.apiTokenId, idempotencyKey, status, result)
  }

  return { body: result, status }
}

export function parseScopesInput(value: unknown): Permission[] {
  if (!Array.isArray(value)) {
    return []
  }
  return value.filter((item): item is Permission => isPermission(String(item)))
}
