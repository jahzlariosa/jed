export const PERMISSIONS = {
  adminAccess: 'admin.access',
  profilesReadAll: 'profiles.read_all',
  rolesReadAll: 'roles.read_all',
  rolesManage: 'roles.manage',
  contentRead: 'content.read',
  contentWrite: 'content.write',
  mediaRead: 'media.read',
  mediaWrite: 'media.write',
  settingsRead: 'settings.read',
  settingsWrite: 'settings.write',
} as const

export type Permission = (typeof PERMISSIONS)[keyof typeof PERMISSIONS]

export type AccessDto = {
  roles: string[]
  permissions: Permission[]
}

const PERMISSION_SET = new Set<string>(Object.values(PERMISSIONS))

export function isPermission(value: string): value is Permission {
  return PERMISSION_SET.has(value)
}
