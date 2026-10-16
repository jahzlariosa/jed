import '@tanstack/react-start/server-only'

import { setResponseStatus } from '@tanstack/react-start/server'

import { FORBIDDEN_MESSAGE, UNAUTHORIZED_MESSAGE } from '#/auth/errors'
import { isPermission, type Permission } from '#/auth/permissions'
import {
  getAccess,
  getRequestClient,
  installBearerRequestAuth,
  markPrivateNoStore,
  type RequestSupabase,
} from '#/auth/session.server'
import type { AppUser } from '#/auth/user'
import { createServiceRoleClient } from '#/lib/supabase/service-role.server'

import { hashApiToken, isApiTokenFormat } from './token-hash'
import { createUserScopedSupabaseClient } from './supabase-user-client.server'
import { getUserJwtMintCapability } from './user-jwt.server'
import { assertApiRateLimit, ApiRateLimitError } from './rate-limit-api.server'

export type BearerAuthContext = {
  user: AppUser
  access: { roles: string[]; permissions: Permission[] }
  tokenId: string
  tokenScopes: Permission[]
  supabase: RequestSupabase
}

function parseBearerToken(request: Request): string | null {
  const header = request.headers.get('authorization')
  if (!header?.toLowerCase().startsWith('bearer ')) {
    return null
  }
  const token = header.slice(7).trim()
  if (!token || !isApiTokenFormat(token)) {
    return null
  }
  return token
}

function intersectScopes(
  tokenScopes: string[],
  livePermissions: Permission[],
): Permission[] {
  const live = new Set(livePermissions)
  return tokenScopes.filter(
    (scope): scope is Permission => isPermission(scope) && live.has(scope),
  )
}

export async function authenticateBearerRequest(
  request: Request,
): Promise<BearerAuthContext | null> {
  const raw = parseBearerToken(request)
  if (!raw) {
    return null
  }

  const capability = await getUserJwtMintCapability()
  if (!capability.ok) {
    console.error('Bearer auth unavailable:', capability.reason)
    return null
  }

  const tokenHash = hashApiToken(raw)
  const service = createServiceRoleClient()
  const { data: rows, error } = await service.rpc('lookup_api_token_by_hash', {
    p_token_hash: tokenHash,
  })
  if (error) {
    console.error(error)
    return null
  }
  const row = Array.isArray(rows) ? rows[0] : rows
  if (!row?.user_id || !row.token_id) {
    return null
  }

  const supabase = await createUserScopedSupabaseClient(row.user_id)
  const access = await getAccess(row.user_id, supabase)
  const effectiveScopes = intersectScopes(row.scopes ?? [], access.permissions)
  if ((row.scopes ?? []).length > 0 && effectiveScopes.length === 0) {
    return null
  }

  const user: AppUser = {
    id: row.user_id,
    email: null,
  }
  const { data: authUser } = await supabase.auth.getUser()
  if (authUser.user?.email) {
    user.email = authUser.user.email
  }

  const tokenScopes =
    (row.scopes ?? []).length > 0 ? effectiveScopes : access.permissions

  installBearerRequestAuth({
    client: supabase as RequestSupabase,
    user,
    tokenId: row.token_id,
    tokenScopes,
    access,
  })

  try {
    assertApiRateLimit({
      request,
      tokenId: row.token_id,
      action: 'bearer',
      limit: 600,
      windowMs: 60_000,
    })
  } catch (error) {
    if (error instanceof ApiRateLimitError) {
      return null
    }
    throw error
  }

  void service
    .from('api_tokens')
    .update({ last_used_at: new Date().toISOString() })
    .eq('id', row.token_id)
    .then(({ error: touchError }) => {
      if (touchError) {
        console.error(touchError)
      }
    })

  return {
    user,
    access: { roles: access.roles, permissions: access.permissions },
    tokenId: row.token_id,
    tokenScopes,
    supabase: getRequestClient(),
  }
}

export async function requireBearerAuth(
  request: Request,
): Promise<BearerAuthContext> {
  markPrivateNoStore()
  const ctx = await authenticateBearerRequest(request)
  if (!ctx) {
    setResponseStatus(401)
    throw new Error(UNAUTHORIZED_MESSAGE)
  }
  return ctx
}

export function bearerHasPermission(
  ctx: BearerAuthContext,
  ...needed: Permission[]
): boolean {
  for (const permission of needed) {
    if (!ctx.tokenScopes.includes(permission)) {
      return false
    }
  }
  return true
}

export function assertBearerPermission(
  ctx: BearerAuthContext,
  ...needed: Permission[]
): void {
  if (!bearerHasPermission(ctx, ...needed)) {
    setResponseStatus(403)
    throw new Error(FORBIDDEN_MESSAGE)
  }
}
