import '@tanstack/react-start/server-only'

import type { SupabaseClient } from '@supabase/supabase-js'

import {
  assertPermissionCodesWithinActorGrant,
  canDeleteRole,
  canEditRolePermissions,
  parseRolePermissionCodes,
  type RoleCatalogRow,
} from '#/auth/roles-admin-logic'
import { isPermission, type Permission } from '#/auth/permissions'
import { parseRoleCode } from '#/auth/validators'
import { writeAuditLog } from '#/lib/cms/audit.server'
import type { Database } from '#/lib/supabase/database.types'
import { createServiceRoleClient } from '#/lib/supabase/service-role.server'

type Db = SupabaseClient<Database>

function parseRoleName(value: unknown): string {
  const name = String(value ?? '').trim()
  if (name.length < 1 || name.length > 120) {
    throw new Error('Enter a role name')
  }
  return name
}

function parseRoleDescription(value: unknown): string {
  return String(value ?? '')
    .trim()
    .slice(0, 500)
}

export async function loadRolesCatalog(
  supabase: Db,
  service: Db,
): Promise<{
  roles: RoleCatalogRow[]
  permissions: Array<{ code: Permission; description: string }>
}> {
  const [rolesResult, permissionsResult, assignmentsResult] = await Promise.all(
    [
      supabase
        .from('roles')
        .select(
          'code, name, description, is_system, role_permissions(permission_code)',
        )
        .order('name'),
      supabase.from('permissions').select('code, description').order('code'),
      service.from('user_roles').select('role_code'),
    ],
  )

  if (rolesResult.error) {
    console.error(rolesResult.error)
    throw new Error('Unable to load roles')
  }
  if (permissionsResult.error) {
    console.error(permissionsResult.error)
    throw new Error('Unable to load permissions')
  }
  if (assignmentsResult.error) {
    console.error(assignmentsResult.error)
    throw new Error('Unable to load role assignments')
  }

  const memberCounts = new Map<string, number>()
  for (const row of assignmentsResult.data ?? []) {
    memberCounts.set(row.role_code, (memberCounts.get(row.role_code) ?? 0) + 1)
  }

  const roles: RoleCatalogRow[] = (rolesResult.data ?? []).map((row) => {
    const permissionCodes = (row.role_permissions ?? [])
      .map((entry) => entry.permission_code)
      .filter((code): code is Permission => isPermission(code))
    return {
      code: row.code,
      name: row.name,
      description: row.description,
      isSystem: row.is_system,
      permissionCodes,
      memberCount: memberCounts.get(row.code) ?? 0,
    }
  })

  const permissions = (permissionsResult.data ?? [])
    .map((row) => ({
      code: row.code,
      description: row.description,
    }))
    .filter((row): row is { code: Permission; description: string } =>
      isPermission(row.code),
    )

  return { roles, permissions }
}

export async function createRoleCatalogEntry(
  supabase: Db,
  actorUserId: string,
  actorPermissions: readonly string[],
  input: {
    code: string
    name: string
    description: string
    permissionCodes: readonly string[]
  },
): Promise<{ ok: true } | { error: string }> {
  const code = parseRoleCode(input.code)
  const name = parseRoleName(input.name)
  const description = parseRoleDescription(input.description)
  const permissionCodes = parseRolePermissionCodes(input.permissionCodes)
  try {
    assertPermissionCodesWithinActorGrant(actorPermissions, permissionCodes)
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : 'Forbidden',
    }
  }

  const { error: insertError } = await supabase.from('roles').insert({
    code,
    name,
    description,
    is_system: false,
  })
  if (insertError) {
    console.error(insertError)
    if (insertError.code === '23505') {
      return { error: 'That role code is already in use' }
    }
    return { error: 'Unable to create role' }
  }

  if (permissionCodes.length > 0) {
    const { error: permError } = await supabase.from('role_permissions').insert(
      permissionCodes.map((permissionCode) => ({
        role_code: code,
        permission_code: permissionCode,
      })),
    )
    if (permError) {
      console.error(permError)
      await supabase.from('roles').delete().eq('code', code)
      return { error: 'Unable to save role permissions' }
    }
  }

  await writeAuditLog(supabase, {
    actorUserId,
    action: 'role.create',
    targetType: 'role',
    targetId: code,
    metadata: { permissionCodes },
  })

  return { ok: true }
}

export async function updateRoleCatalogEntry(
  supabase: Db,
  actorUserId: string,
  actorPermissions: readonly string[],
  input: {
    code: string
    name: string
    description: string
    permissionCodes: readonly string[]
  },
): Promise<{ ok: true } | { error: string }> {
  const code = parseRoleCode(input.code)
  const name = parseRoleName(input.name)
  const description = parseRoleDescription(input.description)
  const permissionCodes = parseRolePermissionCodes(input.permissionCodes)
  try {
    assertPermissionCodesWithinActorGrant(actorPermissions, permissionCodes)
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : 'Forbidden',
    }
  }

  const { data: existing, error: readError } = await supabase
    .from('roles')
    .select('code, is_system')
    .eq('code', code)
    .maybeSingle()
  if (readError) {
    console.error(readError)
    return { error: 'Unable to load role' }
  }
  if (!existing) {
    return { error: 'Role not found' }
  }
  if (!canEditRolePermissions({ isSystem: existing.is_system })) {
    return { error: 'Built-in roles cannot be edited' }
  }

  const service = createServiceRoleClient()
  const { error: rpcError } = await service.rpc('admin_update_role_catalog', {
    p_actor_user_id: actorUserId,
    p_code: code,
    p_name: name,
    p_description: description,
    p_permission_codes: permissionCodes,
  })
  if (rpcError) {
    console.error(rpcError)
    if (rpcError.message.includes('forbidden permissions')) {
      return { error: 'You can only assign permissions you already have' }
    }
    if (rpcError.message.includes('no admin access holders')) {
      return { error: 'At least one person must keep admin access' }
    }
    return { error: 'Unable to update role' }
  }

  await writeAuditLog(supabase, {
    actorUserId,
    action: 'role.update',
    targetType: 'role',
    targetId: code,
    metadata: { permissionCodes },
  })

  return { ok: true }
}

async function loadRolePermissionCodesForReassign(
  supabase: Db,
  roleCode: string,
): Promise<
  | { ok: true; permissionCodes: Permission[] }
  | { ok: false; reason: 'not_found' }
> {
  const { data, error } = await supabase
    .from('roles')
    .select('code, role_permissions(permission_code)')
    .eq('code', roleCode)
    .maybeSingle()
  if (error) {
    console.error(error)
    throw new Error('Unable to load role')
  }
  if (!data) {
    return { ok: false, reason: 'not_found' }
  }
  const permissionCodes = (data.role_permissions ?? [])
    .map((entry) => entry.permission_code)
    .filter((code): code is Permission => isPermission(code))
  return { ok: true, permissionCodes }
}

export async function deleteRoleCatalogEntry(
  supabase: Db,
  service: Db,
  actorUserId: string,
  actorPermissions: readonly string[],
  input: { code: string; reassignToRoleCode?: string | null },
): Promise<
  | { ok: true }
  | { error: string }
  | { error: string; memberCount: number; needsReassign: true }
> {
  const code = parseRoleCode(input.code)
  const reassignToRoleCode = input.reassignToRoleCode
    ? parseRoleCode(input.reassignToRoleCode)
    : null

  const { data: existing, error: readError } = await supabase
    .from('roles')
    .select('code, is_system')
    .eq('code', code)
    .maybeSingle()
  if (readError) {
    console.error(readError)
    return { error: 'Unable to load role' }
  }
  if (!existing) {
    return { error: 'Role not found' }
  }

  const { count, error: countError } = await service
    .from('user_roles')
    .select('user_id', { count: 'exact', head: true })
    .eq('role_code', code)
  if (countError) {
    console.error(countError)
    return { error: 'Unable to count members' }
  }
  const memberCount = count ?? 0

  if (reassignToRoleCode) {
    try {
      const target = await loadRolePermissionCodesForReassign(
        supabase,
        reassignToRoleCode,
      )
      if (!target.ok) {
        return { error: 'Reassignment role not found' }
      }
      assertPermissionCodesWithinActorGrant(
        actorPermissions,
        target.permissionCodes,
      )
    } catch (error) {
      return {
        error:
          error instanceof Error
            ? error.message
            : 'You cannot reassign members to that role',
      }
    }
  }

  const deleteCheck = canDeleteRole({
    isSystem: existing.is_system,
    memberCount,
    reassignToRoleCode,
  })
  if (!deleteCheck.ok) {
    if (deleteCheck.reason === 'system') {
      return { error: 'Built-in roles cannot be deleted' }
    }
    return {
      error: `${deleteCheck.memberCount} members still use this role. Choose a role to move them to.`,
      memberCount: deleteCheck.memberCount,
      needsReassign: true,
    }
  }

  const { error: rpcError } = await service.rpc('admin_delete_role_catalog', {
    p_actor_user_id: actorUserId,
    p_code: code,
    p_reassign_to_role_code: reassignToRoleCode,
  })
  if (rpcError) {
    console.error(rpcError)
    if (rpcError.message.includes('role has members')) {
      return {
        error: `${memberCount} members still use this role. Choose a role to move them to.`,
        memberCount,
        needsReassign: true,
      }
    }
    if (rpcError.message.includes('forbidden reassign target')) {
      return { error: 'You cannot reassign members to that role' }
    }
    if (rpcError.message.includes('no admin access holders')) {
      return { error: 'At least one person must keep admin access' }
    }
    return { error: 'Unable to delete role' }
  }

  await writeAuditLog(supabase, {
    actorUserId,
    action: 'role.delete',
    targetType: 'role',
    targetId: code,
    metadata: reassignToRoleCode
      ? { reassignToRoleCode, memberCount }
      : { memberCount },
  })

  return { ok: true }
}

export function createRolesAdminServiceClient(): Db {
  return createServiceRoleClient()
}
