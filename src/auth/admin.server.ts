import { setResponseStatus } from '@tanstack/react-start/server'

import { isAdmin } from './admin'
import { assertMfaServerAccess } from './mfa-gate.server'
import { FORBIDDEN_MESSAGE } from './errors'
import type { AccessDto } from './permissions'
import {
  getAccess,
  getRequestClient,
  getRequestAuthContext,
  requireUser,
} from './session.server'
import type { AppUser } from './user'

export async function requireAdmin(options?: { fresh?: boolean }): Promise<{
  user: AppUser
  access: AccessDto
  supabase: ReturnType<typeof getRequestClient>
}> {
  const authContext = getRequestAuthContext()
  const user = await requireUser({ skipMfaCheck: authContext.skipMfa })
  const supabase = getRequestClient()
  if (options?.fresh) {
    const { data: authData, error: authError } = await supabase.auth.getUser()
    if (authError || !authData.user || authData.user.id !== user.id) {
      setResponseStatus(401)
      throw new Error('Unauthorized')
    }
  }
  const access = await getAccess(user.id)
  if (!isAdmin(access)) {
    setResponseStatus(403)
    throw new Error(FORBIDDEN_MESSAGE)
  }
  if (!authContext.skipMfa) {
    await assertMfaServerAccess({ user, access, scope: 'admin' })
  }
  return { user, access, supabase }
}
