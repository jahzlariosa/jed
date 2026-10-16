import type { AccessDto } from './permissions'

/** Matches `public.is_admin()` (user_roles.role_code = 'admin'). */
export function isAdmin(access: AccessDto): boolean {
  return access.roles.includes('admin')
}
