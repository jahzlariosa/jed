import { isPermission, PERMISSIONS, type Permission } from '#/auth/permissions'

export type RoleCatalogRow = {
  code: string
  name: string
  description: string
  isSystem: boolean
  permissionCodes: Permission[]
  memberCount: number
}

/** Permissions that must stay on the built-in admin role (enforced in UI; DB blocks edits). */
export const ADMIN_ROLE_REQUIRED_PERMISSIONS: readonly Permission[] = [
  PERMISSIONS.adminAccess,
  PERMISSIONS.rolesManage,
  PERMISSIONS.rolesReadAll,
  PERMISSIONS.profilesReadAll,
]

export function canManageRolesCatalog(permissions: readonly string[]): boolean {
  return permissions.includes(PERMISSIONS.rolesManage)
}

export function parseRolePermissionCodes(value: unknown): Permission[] {
  if (!Array.isArray(value)) {
    throw new Error('Choose valid permissions')
  }
  const codes: Permission[] = []
  for (const entry of value) {
    const code = String(entry ?? '').trim()
    if (!isPermission(code)) {
      throw new Error('Choose valid permissions')
    }
    if (!codes.includes(code)) {
      codes.push(code)
    }
  }
  return codes
}

export function canEditRolePermissions(role: { isSystem: boolean }): boolean {
  return !role.isSystem
}

export function canDeleteRole(input: {
  isSystem: boolean
  memberCount: number
  reassignToRoleCode?: string | null
}):
  | { ok: true }
  | { ok: false; reason: 'system' }
  | { ok: false; reason: 'assigned'; memberCount: number } {
  if (input.isSystem) {
    return { ok: false, reason: 'system' }
  }
  if (input.memberCount > 0 && !input.reassignToRoleCode?.trim()) {
    return {
      ok: false,
      reason: 'assigned',
      memberCount: input.memberCount,
    }
  }
  return { ok: true }
}

export function assertPermissionCodesWithinActorGrant(
  actorPermissions: readonly string[],
  permissionCodes: readonly Permission[],
): void {
  const grant = new Set(actorPermissions)
  for (const code of permissionCodes) {
    if (!grant.has(code)) {
      throw new Error('You can only assign permissions you already have')
    }
  }
}

export function assertAdminRolePermissionsPreserved(
  roleCode: string,
  nextPermissionCodes: readonly Permission[],
): void {
  if (roleCode !== 'admin') {
    return
  }
  for (const required of ADMIN_ROLE_REQUIRED_PERMISSIONS) {
    if (!nextPermissionCodes.includes(required)) {
      throw new Error('Built-in admin permissions cannot be changed here')
    }
  }
}
