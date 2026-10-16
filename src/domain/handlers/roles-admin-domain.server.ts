import '@tanstack/react-start/server-only'

import { setResponseStatus } from '@tanstack/react-start/server'
import type { z } from 'zod'

import { canManageRolesCatalog } from '#/auth/roles-admin-logic'
import {
  createRoleCatalogEntry,
  createRolesAdminServiceClient,
  deleteRoleCatalogEntry,
  loadRolesCatalog,
  updateRoleCatalogEntry,
} from '#/auth/roles-admin-service.server'
import { FORBIDDEN_MESSAGE } from '#/auth/errors'
import { assertDomainAdmin } from '#/domain/helpers/admin-domain.server'
import type {
  createRoleBodySchema,
  deleteRoleBodySchema,
  updateRoleBodySchema,
} from '#/domain/api-schemas'
import type { DomainContext } from '#/domain/types'

function assertRolesManage(ctx: DomainContext): void {
  assertDomainAdmin(ctx)
  if (!ctx.access || !canManageRolesCatalog(ctx.access.permissions)) {
    setResponseStatus(403)
    throw new Error(FORBIDDEN_MESSAGE)
  }
}

export async function listRolesDomain(ctx: DomainContext) {
  assertDomainAdmin(ctx)
  const service = createRolesAdminServiceClient()
  const catalog = await loadRolesCatalog(ctx.supabase, service)
  return {
    canManageRoles: ctx.access
      ? canManageRolesCatalog(ctx.access.permissions)
      : false,
    ...catalog,
  }
}

export async function createRoleDomain(
  ctx: DomainContext,
  input: z.infer<typeof createRoleBodySchema>,
) {
  assertRolesManage(ctx)
  if (!ctx.user) {
    setResponseStatus(401)
    throw new Error('Unauthorized')
  }
  const result = await createRoleCatalogEntry(
    ctx.supabase,
    ctx.user.id,
    ctx.access?.permissions ?? [],
    {
      code: input.code,
      name: input.name,
      description: input.description ?? '',
      permissionCodes: input.permissionCodes,
    },
  )
  if ('error' in result) {
    throw new Error(result.error)
  }
  return result
}

export async function updateRoleDomain(
  ctx: DomainContext,
  code: string,
  input: z.infer<typeof updateRoleBodySchema>,
) {
  assertRolesManage(ctx)
  if (!ctx.user) {
    setResponseStatus(401)
    throw new Error('Unauthorized')
  }
  const result = await updateRoleCatalogEntry(
    ctx.supabase,
    ctx.user.id,
    ctx.access?.permissions ?? [],
    {
      code,
      name: input.name,
      description: input.description ?? '',
      permissionCodes: input.permissionCodes,
    },
  )
  if ('error' in result) {
    throw new Error(result.error)
  }
  return result
}

export async function deleteRoleDomain(
  ctx: DomainContext,
  code: string,
  input: z.infer<typeof deleteRoleBodySchema>,
) {
  assertRolesManage(ctx)
  if (!ctx.user) {
    setResponseStatus(401)
    throw new Error('Unauthorized')
  }
  const service = createRolesAdminServiceClient()
  const result = await deleteRoleCatalogEntry(
    ctx.supabase,
    service,
    ctx.user.id,
    ctx.access?.permissions ?? [],
    {
      code,
      reassignToRoleCode: input.reassignToRoleCode,
    },
  )
  if ('needsReassign' in result && result.needsReassign) {
    throw new Error(result.error)
  }
  if ('error' in result) {
    throw new Error(result.error)
  }
  return result
}
