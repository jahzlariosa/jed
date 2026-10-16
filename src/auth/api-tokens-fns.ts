import { createServerFn } from '@tanstack/react-start'
import { z } from 'zod'

import { requireAdminRead, requireAdminWrite } from '#/auth/admin-access.server'
import { isPermission, PERMISSIONS, type Permission } from '#/auth/permissions'
import { getRequestClient, markPrivateNoStore } from '#/auth/session.server'
import { generateApiTokenSecret, hashApiToken } from '#/lib/api/token-hash'
import { getUserJwtMintCapability } from '#/lib/api/user-jwt.server'
import { writeAuditLog } from '#/lib/cms/audit.server'

const createTokenSchema = z.object({
  name: z.string().trim().min(1).max(120),
  expiresInDays: z.coerce.number().int().min(1).max(365).default(90),
  scopes: z.array(z.string()).max(32),
})

function parseScopes(scopes: string[], live: Permission[]): Permission[] {
  const allowed = new Set(live)
  const picked: Permission[] = []
  for (const scope of scopes) {
    if (!isPermission(scope)) {
      continue
    }
    if (!allowed.has(scope)) {
      continue
    }
    picked.push(scope)
  }
  return picked
}

export const listApiTokenUsageFn = createServerFn({ method: 'GET' }).handler(
  async () => {
    markPrivateNoStore()
    const { supabase } = await requireAdminRead()
    const { data, error } = await supabase.rpc('list_my_api_token_usage')
    if (error) {
      console.error(error)
      throw new Error('Unable to load API usage')
    }
    return {
      items: (data ?? []).map((row) => ({
        tokenId: row.token_id,
        tokenName: row.token_name,
        callCount: Number(row.call_count ?? 0),
        lastCalledAt: row.last_called_at,
      })),
    }
  },
)

export const listApiTokensFn = createServerFn({ method: 'GET' }).handler(
  async () => {
    markPrivateNoStore()
    const { user, supabase } = await requireAdminRead()
    const { data, error } = await supabase
      .from('api_tokens')
      .select(
        'id, name, prefix, scopes, expires_at, revoked_at, last_used_at, created_at',
      )
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
    if (error) {
      console.error(error)
      throw new Error('Unable to load tokens')
    }
    return { items: data ?? [] }
  },
)

export const createApiTokenFn = createServerFn({ method: 'POST' })
  .validator((input: unknown) => createTokenSchema.parse(input))
  .handler(async ({ data }) => {
    markPrivateNoStore()
    const capability = await getUserJwtMintCapability()
    if (!capability.ok) {
      return {
        error:
          capability.reason === 'asymmetric_only'
            ? 'API tokens need SUPABASE_JWT_SECRET on this project. Asymmetric-only signing is not supported yet.'
            : 'Set SUPABASE_JWT_SECRET in the server environment before creating tokens.',
      }
    }
    const { user, access, supabase } = await requireAdminWrite()
    if (!access.permissions.includes(PERMISSIONS.adminAccess)) {
      return { error: 'Only admins can create API tokens.' }
    }
    const scopes = parseScopes(data.scopes, access.permissions)
    if (scopes.length === 0) {
      return { error: 'Choose at least one scope you already have.' }
    }
    const { token, prefix } = generateApiTokenSecret()
    const tokenHash = hashApiToken(token)
    const expiresAt = new Date()
    expiresAt.setUTCDate(expiresAt.getUTCDate() + data.expiresInDays)
    const { data: row, error } = await supabase
      .from('api_tokens')
      .insert({
        user_id: user.id,
        name: data.name,
        prefix,
        token_hash: tokenHash,
        scopes,
        expires_at: expiresAt.toISOString(),
      })
      .select('id, prefix, scopes, expires_at, created_at')
      .single()
    if (error || !row) {
      console.error(error)
      return { error: 'Unable to create token' }
    }
    await writeAuditLog(getRequestClient(), {
      actorUserId: user.id,
      action: 'api_token.create',
      targetType: 'api_token',
      targetId: row.id,
      metadata: { prefix: row.prefix, scopes },
    })
    return {
      ok: true as const,
      token,
      tokenMeta: row,
    }
  })

export const revokeApiTokenFn = createServerFn({ method: 'POST' })
  .validator((input: unknown) => {
    if (typeof input !== 'object' || input === null) {
      throw new Error('Unable to revoke token')
    }
    return {
      id: z
        .string()
        .uuid()
        .parse((input as Record<string, unknown>).id),
    }
  })
  .handler(async ({ data }) => {
    markPrivateNoStore()
    const { user, supabase } = await requireAdminWrite()
    const { error } = await supabase
      .from('api_tokens')
      .update({ revoked_at: new Date().toISOString() })
      .eq('id', data.id)
      .eq('user_id', user.id)
      .is('revoked_at', null)
    if (error) {
      console.error(error)
      return { error: 'Unable to revoke token' }
    }
    await writeAuditLog(getRequestClient(), {
      actorUserId: user.id,
      action: 'api_token.revoke',
      targetType: 'api_token',
      targetId: data.id,
    })
    return { ok: true as const }
  })

export const getApiMintStatusFn = createServerFn({ method: 'GET' }).handler(
  async () => {
    markPrivateNoStore()
    await requireAdminRead()
    const capability = await getUserJwtMintCapability()
    return capability
  },
)
