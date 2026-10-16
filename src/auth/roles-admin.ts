import { createServerFn } from '@tanstack/react-start'
import { z } from 'zod'

import { requireAdminRead, requireAdminWrite } from '#/auth/admin-access.server'
import { canManageRolesCatalog } from '#/auth/roles-admin-logic'
import {
  createRoleCatalogEntry,
  deleteRoleCatalogEntry,
  loadRolesCatalog,
  createRolesAdminServiceClient,
  updateRoleCatalogEntry,
} from '#/auth/roles-admin-service.server'
import { markPrivateNoStore } from '#/auth/session.server'
import { setResponseStatus } from '@tanstack/react-start/server'
import { FORBIDDEN_MESSAGE } from '#/auth/errors'

const roleCodeField = z.string().min(1).max(64)
const roleBodySchema = z.object({
  code: roleCodeField,
  name: z.string().min(1).max(120),
  description: z.string().max(500).optional(),
  permissionCodes: z.array(z.string()).max(32),
})

const deleteRoleSchema = z.object({
  code: roleCodeField,
  reassignToRoleCode: roleCodeField.optional(),
})

async function assertRolesCatalogRead() {
  markPrivateNoStore()
  return requireAdminRead()
}

async function assertRolesCatalogWrite() {
  markPrivateNoStore()
  const auth = await requireAdminWrite()
  if (!canManageRolesCatalog(auth.access.permissions)) {
    setResponseStatus(403)
    throw new Error(FORBIDDEN_MESSAGE)
  }
  return auth
}

export const listRolesCatalogAdminFn = createServerFn({
  method: 'GET',
}).handler(async () => {
  const { access, supabase } = await assertRolesCatalogRead()
  const service = createRolesAdminServiceClient()
  const catalog = await loadRolesCatalog(supabase, service)
  return {
    canManageRoles: canManageRolesCatalog(access.permissions),
    ...catalog,
  }
})

export const createRoleAdminFn = createServerFn({ method: 'POST' })
  .validator((input: unknown) => roleBodySchema.parse(input))
  .handler(async ({ data }) => {
    const { user, supabase, access } = await assertRolesCatalogWrite()
    return createRoleCatalogEntry(supabase, user.id, access.permissions, {
      code: data.code,
      name: data.name,
      description: data.description ?? '',
      permissionCodes: data.permissionCodes,
    })
  })

export const updateRoleAdminFn = createServerFn({ method: 'POST' })
  .validator((input: unknown) => roleBodySchema.parse(input))
  .handler(async ({ data }) => {
    const { user, supabase, access } = await assertRolesCatalogWrite()
    return updateRoleCatalogEntry(supabase, user.id, access.permissions, {
      code: data.code,
      name: data.name,
      description: data.description ?? '',
      permissionCodes: data.permissionCodes,
    })
  })

export const deleteRoleAdminFn = createServerFn({ method: 'POST' })
  .validator((input: unknown) => deleteRoleSchema.parse(input))
  .handler(async ({ data }) => {
    const { user, supabase, access } = await assertRolesCatalogWrite()
    const service = createRolesAdminServiceClient()
    return deleteRoleCatalogEntry(
      supabase,
      service,
      user.id,
      access.permissions,
      {
        code: data.code,
        reassignToRoleCode: data.reassignToRoleCode,
      },
    )
  })
