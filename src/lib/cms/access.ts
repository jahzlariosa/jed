import { PERMISSIONS, type Permission } from '#/auth/permissions'

export function canUseAdmin(permissions: Permission[]) {
  return permissions.includes(PERMISSIONS.adminAccess)
}

export function displayRoleLabel(roles: string[], permissions: Permission[]) {
  if (roles.includes('admin')) {
    return 'Owner'
  }
  if (permissions.includes(PERMISSIONS.contentWrite)) {
    return 'Editor'
  }
  return 'Viewer'
}
