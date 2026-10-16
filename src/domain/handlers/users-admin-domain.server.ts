import '@tanstack/react-start/server-only'

import { setResponseStatus } from '@tanstack/react-start/server'
import type { z } from 'zod'

import { fetchUsersDirectory } from '#/auth/users-directory.server'
import { parseUsersDirectoryQuery } from '#/auth/users-directory-query'
import { parseEmail, parseRoleCode } from '#/auth/validators'
import {
  adminSetUserRoleViaService,
  assertActorCanAssignUserRole,
  assignUserRoleOnCreate,
  DEFAULT_USER_ROLE_CODE,
} from '#/auth/users-admin'
import {
  assertActorMayAssignRoleBeforeUserCreate,
  rollbackCreatedUserAfterRoleFailure,
} from '#/auth/users-admin-lifecycle.server'
import { FORBIDDEN_MESSAGE } from '#/auth/errors'
import { PERMISSIONS } from '#/auth/permissions'
import { assertDomainAdmin } from '#/domain/helpers/admin-domain.server'
import type {
  inviteUserBodySchema,
  updateUserBodySchema,
} from '#/domain/api-schemas'
import type { DomainContext } from '#/domain/types'
import { writeAuditLog } from '#/lib/cms/audit.server'
import { createServiceRoleClient } from '#/lib/supabase/service-role.server'

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

async function recordUserAudit(
  ctx: DomainContext,
  action: string,
  targetId: string,
  metadata?: Record<string, unknown>,
) {
  if (!ctx.user) {
    return
  }
  await writeAuditLog(ctx.supabase, {
    actorUserId: ctx.user.id,
    action,
    targetType: 'user',
    targetId,
    metadata,
  })
}

export async function listUsersDomain(
  ctx: DomainContext,
  query: ReturnType<typeof parseUsersDirectoryQuery>,
) {
  assertDomainAdmin(ctx)
  if (!ctx.user) {
    throw new Error('Unauthorized')
  }
  const directory = await fetchUsersDirectory(query)
  return {
    viewerId: ctx.user.id,
    ...directory,
  }
}

export async function inviteUserDomain(
  ctx: DomainContext,
  input: z.infer<typeof inviteUserBodySchema>,
) {
  assertDomainAdmin(ctx)
  if (!ctx.user) {
    throw new Error('Unauthorized')
  }
  const roleCode = parseRoleCode(input.roleCode)
  if (
    roleCode !== DEFAULT_USER_ROLE_CODE &&
    !ctx.access?.permissions.includes(PERMISSIONS.rolesManage)
  ) {
    setResponseStatus(403)
    throw new Error(FORBIDDEN_MESSAGE)
  }

  const service = createServiceRoleClient()
  const email = parseEmail(input.email)

  const rolePrecheck = await assertActorMayAssignRoleBeforeUserCreate(
    service,
    ctx.access?.permissions ?? [],
    roleCode,
  )
  if (rolePrecheck.error) {
    setResponseStatus(400)
    throw new Error(rolePrecheck.error)
  }

  const { data: invited, error } = await service.auth.admin.inviteUserByEmail(
    email,
    {
      data: { invited_by: ctx.user.id },
    },
  )
  if (error || !invited.user) {
    console.error(error)
    throw new Error('Unable to send invite')
  }
  const roleResult = await assignUserRoleOnCreate(
    service,
    ctx.user.id,
    ctx.access?.permissions ?? [],
    invited.user.id,
    roleCode,
  )
  if (roleResult.error) {
    await rollbackCreatedUserAfterRoleFailure(
      service,
      ctx.supabase,
      ctx.user.id,
      invited.user.id,
      roleCode,
      roleResult.error,
      { invite: true },
    )
    setResponseStatus(400)
    throw new Error(roleResult.error)
  }
  if (input.displayName?.trim()) {
    await service
      .from('profiles')
      .update({ display_name: input.displayName.trim() })
      .eq('user_id', invited.user.id)
  }
  await recordUserAudit(ctx, 'user.create', invited.user.id, {
    role: roleCode,
    invite: true,
  })
  return { ok: true as const, userId: invited.user.id }
}

export async function updateUserDomain(
  ctx: DomainContext,
  userId: string,
  input: z.infer<typeof updateUserBodySchema>,
) {
  assertDomainAdmin(ctx)
  if (!ctx.user) {
    throw new Error('Unauthorized')
  }
  const service = createServiceRoleClient()

  if (input.displayName !== undefined) {
    const { error } = await service
      .from('profiles')
      .update({ display_name: input.displayName })
      .eq('user_id', userId)
    if (error) {
      console.error(error)
      throw new Error('Unable to update profile')
    }
    await recordUserAudit(ctx, 'user.update', userId)
  }

  if (input.roleCode) {
    if (!ctx.access?.permissions.includes(PERMISSIONS.rolesManage)) {
      setResponseStatus(403)
      throw new Error(FORBIDDEN_MESSAGE)
    }

    const roleCode = parseRoleCode(input.roleCode)
    const precheck = await assertActorCanAssignUserRole(
      service,
      ctx.access.permissions,
      ctx.user.id,
      userId,
      roleCode,
    )
    if (precheck.error) {
      setResponseStatus(400)
      throw new Error(precheck.error)
    }

    const { error } = await adminSetUserRoleViaService(
      service,
      ctx.user.id,
      userId,
      roleCode,
    )
    if (error) {
      console.error(error)
      const message = error.message.includes('no admin access holders')
        ? 'Keep at least one admin'
        : 'Unable to update role'
      setResponseStatus(400)
      throw new Error(message)
    }
    await recordUserAudit(ctx, 'user.role', userId, { role: roleCode })
  }

  return { ok: true as const }
}

export async function deactivateUserDomain(ctx: DomainContext, userId: string) {
  assertDomainAdmin(ctx)
  if (!ctx.user) {
    throw new Error('Unauthorized')
  }
  if (userId === ctx.user.id) {
    setResponseStatus(400)
    throw new Error('You cannot deactivate your own account')
  }

  const service = createServiceRoleClient()
  const { data: roleRows } = await service
    .from('user_roles')
    .select('role_code')
    .eq('user_id', userId)
  if ((roleRows ?? []).some((r) => r.role_code === 'admin')) {
    const adminCount = await countAdmins(service)
    if (adminCount <= 1) {
      setResponseStatus(400)
      throw new Error('Keep at least one admin')
    }
  }

  const { error } = await service.auth.admin.updateUserById(userId, {
    ban_duration: '876000h',
  })
  if (error) {
    console.error(error)
    throw new Error('Unable to deactivate user')
  }
  await recordUserAudit(ctx, 'user.deactivate', userId)
  return { ok: true as const }
}
