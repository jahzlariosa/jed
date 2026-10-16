import type { SupabaseClient } from '@supabase/supabase-js'
import { createServerFn } from '@tanstack/react-start'
import { z } from 'zod'

import { requireAdminRead, requireAdminWrite } from '#/auth/admin-access.server'
import { FORBIDDEN_MESSAGE } from '#/auth/errors'
import { isPermission, PERMISSIONS, type Permission } from '#/auth/permissions'
import { markPrivateNoStore } from '#/auth/session.server'
import { parseUsersDirectoryQuery } from '#/auth/users-directory-query'
import { fetchUsersDirectory } from '#/auth/users-directory.server'
import { assertPermissionCodesWithinActorGrant } from '#/auth/roles-admin-logic'
import { parseEmail, parseRoleCode } from '#/auth/validators'
import { adminPasswordResetErrorMessage } from '#/auth/admin-reset-email'
import { getAppUrl } from '#/lib/app-url.server'
import { writeAuditLog } from '#/lib/cms/audit.server'
import type { Database } from '#/lib/supabase/database.types'
import { createServiceRoleClient } from '#/lib/supabase/service-role.server'
import { setResponseStatus } from '@tanstack/react-start/server'

const createUserSchema = z.object({
  email: z.string().email().max(255),
  displayName: z.string().max(120).optional(),
  roleCode: z.string().min(1).max(64),
  password: z.string().min(8).max(72).optional(),
  invite: z.boolean().optional(),
})

const updateUserSchema = z.object({
  userId: z.string().uuid(),
  displayName: z.string().max(120).nullable().optional(),
  roleCode: z.string().min(1).max(64).optional(),
})

const userIdSchema = z.object({ userId: z.string().uuid() })

const passwordSchema = z.object({
  userId: z.string().uuid(),
  password: z.string().min(8).max(72),
})

const emailSchema = z.object({
  userId: z.string().uuid(),
  email: z.string().email().max(255),
})

/** Default role from signup trigger (`private.handle_new_user`). */
export const DEFAULT_USER_ROLE_CODE = 'member'

async function assertCanManageUsersRead() {
  markPrivateNoStore()
  return requireAdminRead()
}

async function assertCanManageUsersWrite() {
  markPrivateNoStore()
  return requireAdminWrite()
}

async function assertCanManageUserRolesWrite() {
  markPrivateNoStore()
  const auth = await requireAdminWrite()
  if (!auth.access.permissions.includes(PERMISSIONS.rolesManage)) {
    setResponseStatus(403)
    throw new Error(FORBIDDEN_MESSAGE)
  }
  return auth
}

type ServiceClient = SupabaseClient<Database>

async function loadRolePermissionCodes(
  service: ServiceClient,
  roleCode: string,
): Promise<Permission[] | null> {
  const { data, error } = await service
    .from('roles')
    .select('code, role_permissions(permission_code)')
    .eq('code', roleCode)
    .maybeSingle()
  if (error) {
    console.error(error)
    throw new Error('Unable to load role')
  }
  if (!data) {
    return null
  }
  return (data.role_permissions ?? [])
    .map((entry) => entry.permission_code)
    .filter((code): code is Permission => isPermission(code))
}

async function loadUserEffectivePermissionCodes(
  service: ServiceClient,
  userId: string,
): Promise<Permission[]> {
  const { data, error } = await service
    .from('user_roles')
    .select('role_code, roles(role_permissions(permission_code))')
    .eq('user_id', userId)
  if (error) {
    console.error(error)
    throw new Error('Unable to load user roles')
  }
  const codes: Permission[] = []
  for (const row of data ?? []) {
    for (const entry of row.roles?.role_permissions ?? []) {
      const code = entry.permission_code
      if (isPermission(code) && !codes.includes(code)) {
        codes.push(code)
      }
    }
  }
  return codes
}

export async function assertActorCanAssignUserRole(
  service: ServiceClient,
  actorPermissions: readonly string[],
  actorUserId: string,
  targetUserId: string,
  roleCode: string,
): Promise<{ error?: string }> {
  if (actorUserId === targetUserId) {
    return { error: 'You cannot change your own role' }
  }

  const rolePermissionCodes = await loadRolePermissionCodes(service, roleCode)
  if (!rolePermissionCodes) {
    return { error: 'Role not found' }
  }

  try {
    assertPermissionCodesWithinActorGrant(actorPermissions, rolePermissionCodes)
  } catch {
    return { error: 'You can only assign permissions you already have' }
  }

  const currentPermissionCodes = await loadUserEffectivePermissionCodes(
    service,
    targetUserId,
  )
  try {
    assertPermissionCodesWithinActorGrant(
      actorPermissions,
      currentPermissionCodes,
    )
  } catch {
    return {
      error: 'You can only assign permissions you already have',
    }
  }

  return {}
}

/** Service-role RPC: subset checks, advisory lock, admin.access floor. */
export async function adminSetUserRoleViaService(
  service: ServiceClient,
  actorUserId: string,
  targetUserId: string,
  roleCode: string,
) {
  const { error } = await service.rpc('admin_set_user_role', {
    p_actor_user_id: actorUserId,
    p_target_user_id: targetUserId,
    p_role_code: roleCode,
  })
  return { error }
}

export async function assignUserRoleOnCreate(
  service: ServiceClient,
  actorUserId: string,
  actorPermissions: readonly string[],
  targetUserId: string,
  roleCode: string,
): Promise<{ error?: string }> {
  if (roleCode === DEFAULT_USER_ROLE_CODE) {
    const { error } = await service.from('user_roles').upsert({
      user_id: targetUserId,
      role_code: roleCode,
    })
    if (error) {
      console.error(error)
      return { error: 'Unable to assign role' }
    }
    return {}
  }

  if (!actorPermissions.includes(PERMISSIONS.rolesManage)) {
    return { error: FORBIDDEN_MESSAGE }
  }

  const precheck = await assertActorCanAssignUserRole(
    service,
    actorPermissions,
    actorUserId,
    targetUserId,
    roleCode,
  )
  if (precheck.error) {
    return precheck
  }

  const { error } = await adminSetUserRoleViaService(
    service,
    actorUserId,
    targetUserId,
    roleCode,
  )
  if (error) {
    console.error(error)
    const message =
      error.message.includes('no admin access holders') ||
      error.message.includes('last_admin')
        ? 'Keep at least one admin'
        : 'Unable to assign role'
    return { error: message }
  }

  return {}
}

async function recordUserAudit(
  supabase: Pick<SupabaseClient<Database>, 'from'>,
  actorUserId: string,
  action: string,
  targetId: string,
  metadata?: Record<string, unknown>,
) {
  await writeAuditLog(supabase as Parameters<typeof writeAuditLog>[0], {
    actorUserId,
    action,
    targetType: 'user',
    targetId,
    metadata,
  })
}

async function countAdmins(
  service: ReturnType<typeof createServiceRoleClient>,
) {
  const { count, error } = await service
    .from('user_roles')
    .select('user_id', { count: 'exact', head: true })
    .eq('role_code', 'admin')
  if (error) {
    console.error(error)
    throw new Error('Unable to verify admin count')
  }
  return count ?? 0
}

export const listUsersAdminFn = createServerFn({ method: 'GET' })
  .validator((input: unknown) => parseUsersDirectoryQuery(input))
  .handler(async ({ data: query }) => {
    const { user } = await assertCanManageUsersRead()
    const directory = await fetchUsersDirectory(query)
    return {
      viewerId: user.id,
      canManage: true,
      ...directory,
    }
  })

export const createUserAdminFn = createServerFn({ method: 'POST' })
  .validator((input: unknown) => createUserSchema.parse(input))
  .handler(async ({ data }) => {
    const roleCode = parseRoleCode(data.roleCode)
    const auth =
      roleCode === DEFAULT_USER_ROLE_CODE
        ? await assertCanManageUsersWrite()
        : await assertCanManageUserRolesWrite()
    const { user, supabase } = auth
    const service = createServiceRoleClient()
    const {
      assertActorMayAssignRoleBeforeUserCreate,
      rollbackCreatedUserAfterRoleFailure,
    } = await import('#/auth/users-admin-lifecycle.server')

    const rolePrecheck = await assertActorMayAssignRoleBeforeUserCreate(
      service,
      auth.access.permissions,
      roleCode,
    )
    if (rolePrecheck.error) {
      return { error: rolePrecheck.error }
    }

    if (data.invite || !data.password) {
      const { data: invited, error } =
        await service.auth.admin.inviteUserByEmail(data.email, {
          data: { invited_by: user.id },
        })
      if (error || !invited.user) {
        console.error(error)
        return { error: 'Unable to send invite' }
      }
      const roleResult = await assignUserRoleOnCreate(
        service,
        user.id,
        auth.access.permissions,
        invited.user.id,
        roleCode,
      )
      if (roleResult.error) {
        await rollbackCreatedUserAfterRoleFailure(
          service,
          supabase,
          user.id,
          invited.user.id,
          roleCode,
          roleResult.error,
          { invite: true },
        )
        return { error: roleResult.error }
      }
      if (data.displayName?.trim()) {
        await service
          .from('profiles')
          .update({ display_name: data.displayName.trim() })
          .eq('user_id', invited.user.id)
      }
      await recordUserAudit(supabase, user.id, 'user.create', invited.user.id, {
        role: roleCode,
        invite: true,
      })
      return { ok: true as const, userId: invited.user.id }
    }

    const { data: created, error } = await service.auth.admin.createUser({
      email: data.email,
      password: data.password,
      email_confirm: true,
    })
    if (error || !created.user) {
      console.error(error)
      return { error: 'Unable to create user' }
    }

    const roleResult = await assignUserRoleOnCreate(
      service,
      user.id,
      auth.access.permissions,
      created.user.id,
      roleCode,
    )
    if (roleResult.error) {
      await rollbackCreatedUserAfterRoleFailure(
        service,
        supabase,
        user.id,
        created.user.id,
        roleCode,
        roleResult.error,
      )
      return { error: roleResult.error }
    }
    if (data.displayName?.trim()) {
      await service
        .from('profiles')
        .update({ display_name: data.displayName.trim() })
        .eq('user_id', created.user.id)
    }

    await recordUserAudit(supabase, user.id, 'user.create', created.user.id, {
      role: roleCode,
    })
    return { ok: true as const, userId: created.user.id }
  })

export const updateUserAdminFn = createServerFn({ method: 'POST' })
  .validator((input: unknown) => updateUserSchema.parse(input))
  .handler(async ({ data }) => {
    const auth = data.roleCode
      ? await assertCanManageUserRolesWrite()
      : await assertCanManageUsersWrite()
    const { user, supabase } = auth
    const service = createServiceRoleClient()

    if (data.displayName !== undefined) {
      const { error } = await service
        .from('profiles')
        .update({ display_name: data.displayName })
        .eq('user_id', data.userId)
      if (error) {
        console.error(error)
        return { error: 'Unable to update profile' }
      }
      await recordUserAudit(supabase, user.id, 'user.update', data.userId)
    }

    if (data.roleCode) {
      const roleCode = parseRoleCode(data.roleCode)
      const precheck = await assertActorCanAssignUserRole(
        service,
        auth.access.permissions,
        user.id,
        data.userId,
        roleCode,
      )
      if (precheck.error) {
        return { error: precheck.error }
      }

      const { error } = await adminSetUserRoleViaService(
        service,
        user.id,
        data.userId,
        roleCode,
      )
      if (error) {
        console.error(error)
        const message =
          error.message.includes('no admin access holders') ||
          error.message.includes('last_admin')
            ? 'Keep at least one admin'
            : 'Unable to update role'
        return { error: message }
      }
      await recordUserAudit(supabase, user.id, 'user.role', data.userId, {
        role: roleCode,
      })
    }

    return { ok: true as const }
  })

export const adminSetUserPasswordFn = createServerFn({ method: 'POST' })
  .validator((input: unknown) => passwordSchema.parse(input))
  .handler(async ({ data }) => {
    const { user, supabase } = await assertCanManageUsersWrite()
    const service = createServiceRoleClient()
    const { error } = await service.auth.admin.updateUserById(data.userId, {
      password: data.password,
    })
    if (error) {
      console.error(error)
      return { error: 'Unable to set password' }
    }
    await recordUserAudit(supabase, user.id, 'user.password', data.userId)
    return { ok: true as const }
  })

export const adminSendPasswordResetEmailFn = createServerFn({ method: 'POST' })
  .validator((input: unknown) => userIdSchema.parse(input))
  .handler(async ({ data }) => {
    await assertCanManageUsersWrite()
    const service = createServiceRoleClient()
    const { data: profile, error: profileError } = await service
      .from('profiles')
      .select('email')
      .eq('user_id', data.userId)
      .maybeSingle()
    if (profileError || !profile?.email) {
      console.error(profileError)
      return { error: 'Unable to find that user' }
    }
    const appUrl = getAppUrl()
    if (!appUrl) {
      console.error('admin password reset: APP_URL is not configured')
      return {
        error:
          'APP_URL is not configured. Set it in the server environment before sending reset emails.',
      }
    }
    const redirectTo = `${appUrl}/auth/callback?next=${encodeURIComponent('/reset-password')}`
    const { error } = await service.auth.resetPasswordForEmail(profile.email, {
      redirectTo,
    })
    if (error) {
      return { error: adminPasswordResetErrorMessage(error) }
    }
    return { ok: true as const }
  })

export const adminUpdateUserEmailFn = createServerFn({ method: 'POST' })
  .validator((input: unknown) => emailSchema.parse(input))
  .handler(async ({ data }) => {
    const { user, supabase } = await assertCanManageUsersWrite()
    const service = createServiceRoleClient()
    const email = parseEmail(data.email)
    const { error } = await service.auth.admin.updateUserById(data.userId, {
      email,
    })
    if (error) {
      console.error(error)
      return { error: 'Unable to update email' }
    }
    await recordUserAudit(supabase, user.id, 'user.email', data.userId)
    return { ok: true as const }
  })

export const deleteUserAdminFn = createServerFn({ method: 'POST' })
  .validator((input: unknown) => userIdSchema.parse(input))
  .handler(async ({ data }) => {
    const { user, supabase } = await assertCanManageUsersWrite()
    if (data.userId === user.id) {
      return { error: 'You cannot delete your own account' }
    }

    const service = createServiceRoleClient()
    const { data: roleRows } = await service
      .from('user_roles')
      .select('role_code')
      .eq('user_id', data.userId)
    if ((roleRows ?? []).some((r) => r.role_code === 'admin')) {
      const adminCount = await countAdmins(service)
      if (adminCount <= 1) {
        return { error: 'Keep at least one admin' }
      }
    }

    const { error } = await service.auth.admin.deleteUser(data.userId)
    if (error) {
      console.error(error)
      return { error: 'Unable to delete user' }
    }
    await recordUserAudit(supabase, user.id, 'user.delete', data.userId)
    return { ok: true as const }
  })
