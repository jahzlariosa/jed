import '@tanstack/react-start/server-only'

import { permissionsRequireAdminMfaScope } from '#/auth/admin-access.server'
import type { AccessDto, Permission } from '#/auth/permissions'
import type { AppUser } from '#/auth/user'

export { permissionsRequireAdminMfaScope }

export async function assertAdminMfaForPermissions(input: {
  user: AppUser
  access: AccessDto
  needed: Permission[]
  skipMfa: boolean
}): Promise<void> {
  if (input.skipMfa) {
    return
  }
  if (!permissionsRequireAdminMfaScope(input.needed)) {
    return
  }
  const { assertMfaServerAccess } = await import('#/auth/mfa-gate.server')
  await assertMfaServerAccess({
    user: input.user,
    access: input.access,
    scope: 'admin',
  })
}
