import '@tanstack/react-start/server-only'

import { setResponseStatus } from '@tanstack/react-start/server'

import { assertAdminMfaForPermissions } from '#/auth/permission-mfa.server'

import { FORBIDDEN_MESSAGE, UNAUTHORIZED_MESSAGE } from './errors'
import type { AccessDto, Permission } from './permissions'
import type { AppUser } from './user'
import { getAccess, getRequestAuthContext, requireUser } from './session.server'

export type RequirePermissionOptions = {
  fresh?: boolean
}

function isRequirePermissionOptions(
  value: unknown,
): value is RequirePermissionOptions {
  return (
    typeof value === 'object' &&
    value !== null &&
    !Array.isArray(value) &&
    'fresh' in value
  )
}

export async function requirePermission(
  first: Permission | RequirePermissionOptions,
  ...rest: Permission[]
): Promise<{ user: AppUser; access: AccessDto }> {
  const options = isRequirePermissionOptions(first) ? first : {}
  const needed = isRequirePermissionOptions(first) ? rest : [first, ...rest]
  const context = getRequestAuthContext()
  const user = await requireUser({ skipMfaCheck: context.skipMfa })
  const access = await getAccess(user.id)
  const scopeSource = context.bearerScopes ?? access.permissions

  for (const permission of needed) {
    if (!scopeSource.includes(permission)) {
      setResponseStatus(403)
      throw new Error(FORBIDDEN_MESSAGE)
    }
    if (!access.permissions.includes(permission)) {
      setResponseStatus(403)
      throw new Error(FORBIDDEN_MESSAGE)
    }
  }

  await assertAdminMfaForPermissions({
    user,
    access,
    needed,
    skipMfa: Boolean(context.skipMfa),
  })

  if (options.fresh && !context.bearerTokenId) {
    const supabase = context.client
    if (!supabase) {
      setResponseStatus(401)
      throw new Error(UNAUTHORIZED_MESSAGE)
    }
    const { data: authData, error: authError } = await supabase.auth.getUser()
    if (authError || !authData.user || authData.user.id !== user.id) {
      setResponseStatus(401)
      throw new Error(UNAUTHORIZED_MESSAGE)
    }
  }

  return { user, access }
}
