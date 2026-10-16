import {
  getRequest,
  setResponseHeader,
  setResponseStatus,
} from '@tanstack/react-start/server'

import { getAppUrl } from '#/lib/app-url.server'
import { type createClient, tryCreateClient } from '#/lib/supabase/server'

import { UNAUTHORIZED_MESSAGE } from './errors'
import { isPermission, type AccessDto, type Permission } from './permissions'
import type { AppUser } from './user'

export function markPrivateNoStore() {
  setResponseHeader('Cache-Control', 'private, no-store')
}

export type RequestSupabase = ReturnType<typeof createClient>

/**
 * Per-request auth context. Keyed by the live `Request` in a WeakMap, so it is collected with
 * the request and never holds user data past it (no module-level user state). One request
 * makes at most one `getUser()` call and one roles->permissions query, however many of
 * `requireUser` / `requirePermission` / `getAccess` run during SSR.
 */
type RequestAuth = {
  client: RequestSupabase | null
  user?: Promise<AppUser | null>
  access: Map<string, Promise<AccessDto>>
  profileOk?: Map<string, Promise<void>>
  bearerTokenId?: string
  bearerScopes?: Permission[]
  skipMfa?: boolean
}

export function getBearerTokenId(): string | null {
  return getRequestAuth().bearerTokenId ?? null
}

export function installBearerRequestAuth(input: {
  client: RequestSupabase
  user: AppUser
  tokenId: string
  tokenScopes: Permission[]
  access: AccessDto
}) {
  const request = getRequest()
  const context: RequestAuth = {
    client: input.client,
    user: Promise.resolve(input.user),
    access: new Map([[input.user.id, Promise.resolve(input.access)]]),
    profileOk: new Map(),
    bearerTokenId: input.tokenId,
    bearerScopes: input.tokenScopes,
    skipMfa: true,
  }
  requestAuth.set(request, context)
}

const requestAuth = new WeakMap<Request, RequestAuth>()

export function getRequestAuthContext(): RequestAuth {
  return getRequestAuth()
}

function getRequestAuth(): RequestAuth {
  const request = getRequest()
  let context = requestAuth.get(request)
  if (!context) {
    context = {
      client: tryCreateClient(),
      access: new Map(),
      profileOk: new Map(),
    }
    requestAuth.set(request, context)
  }
  return context
}

/** The cookie-backed Supabase client for this request (created once, reused by every read). */
export function getRequestClient(): RequestSupabase {
  const client = getRequestAuth().client
  if (!client) {
    const error = new Error('Supabase is not configured')
    console.error(error)
    throw error
  }
  return client
}

/**
 * Drop the memoised user/access after anything that changes the session (sign in, sign up,
 * sign out, password update) so a later read in the same request cannot see stale identity.
 */
export function clearRequestAuth() {
  requestAuth.delete(getRequest())
}

async function loadCurrentUserFromClaims(
  client: RequestSupabase,
): Promise<AppUser | null> {
  let result: Awaited<ReturnType<typeof client.auth.getClaims>>
  try {
    result = await client.auth.getClaims()
  } catch (thrown) {
    console.error(thrown)
    return null
  }
  const { data, error } = result

  if (error) {
    if (error.name !== 'AuthSessionMissingError') {
      console.error(error)
    }
    return null
  }

  const claims = data?.claims
  if (!claims?.sub) {
    return null
  }

  return {
    id: claims.sub,
    email: typeof claims.email === 'string' ? claims.email : null,
  }
}

async function loadCurrentUserFromGoTrue(
  client: RequestSupabase,
): Promise<AppUser | null> {
  const { data, error } = await client.auth.getUser()

  if (error) {
    if (error.name !== 'AuthSessionMissingError') {
      console.error(error)
    }
    return null
  }

  if (!data.user) {
    return null
  }

  return { id: data.user.id, email: data.user.email ?? null }
}

async function loadCurrentUser(
  client: RequestSupabase | null,
): Promise<AppUser | null> {
  if (!client) {
    return null
  }

  const { usesAsymmetricAuthJwks } = await import('./jwks-capability.server')
  if (await usesAsymmetricAuthJwks()) {
    return loadCurrentUserFromClaims(client)
  }
  return loadCurrentUserFromGoTrue(client)
}

export async function getCurrentUser(): Promise<AppUser | null> {
  markPrivateNoStore()
  const context = getRequestAuth()
  context.user ??= loadCurrentUser(context.client)
  return await context.user
}

async function assertProfileAllowsAccess(
  client: RequestSupabase,
  userId: string,
): Promise<void> {
  const { data, error } = await client
    .from('profiles')
    .select('user_id')
    .eq('user_id', userId)
    .maybeSingle()

  if (error) {
    console.error(error)
    throw new Error('Unable to verify account')
  }
  if (!data) {
    setResponseStatus(401)
    throw new Error(UNAUTHORIZED_MESSAGE)
  }
}

export async function requireUser(options?: {
  skipMfaCheck?: boolean
}): Promise<AppUser> {
  const context = getRequestAuth()
  const user = await getCurrentUser()
  if (!user) {
    setResponseStatus(401)
    throw new Error(UNAUTHORIZED_MESSAGE)
  }
  const client = context.client
  if (client) {
    let verified = context.profileOk?.get(user.id)
    if (!verified) {
      verified = assertProfileAllowsAccess(client, user.id)
      context.profileOk?.set(user.id, verified)
    }
    await verified
  }
  const skipMfa = options?.skipMfaCheck || context.skipMfa
  if (!skipMfa) {
    const { assertMfaServerAccess } = await import('./mfa-gate.server')
    const access = await getAccess(user.id)
    await assertMfaServerAccess({ user, access, scope: 'session' })
  }
  return user
}

async function loadAccess(
  client: RequestSupabase | null,
  userId: string,
): Promise<AccessDto> {
  if (!client) {
    console.error(
      'Supabase client unavailable while loading access for',
      userId,
    )
    return { roles: [], permissions: [] }
  }

  // One round trip: user_roles -> roles -> role_permissions via the foreign keys.
  const { data, error } = await client
    .from('user_roles')
    .select('role_code, roles(role_permissions(permission_code))')
    .eq('user_id', userId)

  if (error) {
    console.error(error)
    throw new Error('Unable to load roles')
  }

  const rows = data ?? []
  const roles = rows.map((row) => row.role_code)
  const permissions = [
    ...new Set(
      rows
        .flatMap((row) => row.roles?.role_permissions ?? [])
        .map((row) => row.permission_code)
        .filter(isPermission),
    ),
  ]

  return { roles, permissions }
}

/** Load roles with an explicit client (for example right after sign-in, before cookies replay). */
export async function getAccessWithClient(
  userId: string,
  client: RequestSupabase,
): Promise<AccessDto> {
  return loadAccess(client, userId)
}

export async function getAccess(
  userId: string,
  clientOverride?: RequestSupabase | null,
): Promise<AccessDto> {
  if (clientOverride) {
    return loadAccess(clientOverride, userId)
  }
  const context = getRequestAuth()
  let access = context.access.get(userId)
  if (!access) {
    access = loadAccess(context.client, userId)
    context.access.set(userId, access)
  }
  return access
}

export type { RequirePermissionOptions } from './require-permission.server'
export { requirePermission } from './require-permission.server'

/** Public origin for auth email links. Comes from APP_URL, never from the Host header. */
export function getAppOrigin() {
  return getAppUrl()
}
