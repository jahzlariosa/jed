import '@tanstack/react-start/server-only'

import { requireAdmin } from '#/auth/admin.server'
import type { AccessDto, Permission } from '#/auth/permissions'
import { PERMISSIONS } from '#/auth/permissions'
import {
  getRequestClient,
  requirePermission,
  type RequirePermissionOptions,
} from '#/auth/session.server'
import type { AppUser } from '#/auth/user'

/** Every RBAC permission used in the admin/CMS surface requires admin-scope MFA. */
export const ADMIN_SURFACE_PERMISSIONS: ReadonlySet<Permission> = new Set(
  Object.values(PERMISSIONS),
)

export function permissionsRequireAdminMfaScope(needed: Permission[]): boolean {
  return needed.some((permission) => ADMIN_SURFACE_PERMISSIONS.has(permission))
}

export type CmsAuthResult = {
  user: AppUser
  access: AccessDto
  supabase: ReturnType<typeof getRequestClient>
}

/** Admin/CMS reads: admin MFA, claims-backed session (no GoTrue round trip). */
async function invokeRequirePermission(
  needed: Permission[],
  options?: RequirePermissionOptions,
): Promise<{ user: AppUser; access: AccessDto }> {
  if (needed.length === 0) {
    throw new Error('At least one permission is required')
  }
  const [first, ...rest] = needed
  if (options?.fresh) {
    return requirePermission({ fresh: true }, first, ...rest)
  }
  return requirePermission(first, ...rest)
}

export async function requireCmsAccess(
  ...needed: Permission[]
): Promise<CmsAuthResult> {
  const auth = await invokeRequirePermission(needed)
  return { ...auth, supabase: getRequestClient() }
}

/** Admin/CMS writes: admin MFA plus fresh `auth.getUser()` id check. */
export async function requireCmsWrite(
  ...needed: Permission[]
): Promise<CmsAuthResult> {
  const auth = await invokeRequirePermission(needed, { fresh: true })
  return { ...auth, supabase: getRequestClient() }
}

/** `is_admin()` RPC paths (posts admin, redirects, audit, …). */
export async function requireAdminRead(): Promise<
  CmsAuthResult & { supabase: ReturnType<typeof getRequestClient> }
> {
  const auth = await requireAdmin()
  return { ...auth }
}

export async function requireAdminWrite(): Promise<
  CmsAuthResult & { supabase: ReturnType<typeof getRequestClient> }
> {
  return requireAdmin({ fresh: true })
}

export type { RequirePermissionOptions }
