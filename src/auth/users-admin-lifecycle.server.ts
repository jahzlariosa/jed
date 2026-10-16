import '@tanstack/react-start/server-only'

import type { SupabaseClient } from '@supabase/supabase-js'

import { assertPermissionCodesWithinActorGrant } from '#/auth/roles-admin-logic'
import { isPermission, type Permission } from '#/auth/permissions'
import { writeAuditLog } from '#/lib/cms/audit.server'
import type { Database } from '#/lib/supabase/database.types'
import { createServiceRoleClient } from '#/lib/supabase/service-role.server'

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

export async function assertActorMayAssignRoleBeforeUserCreate(
  service: ServiceClient,
  actorPermissions: readonly string[],
  roleCode: string,
): Promise<{ error?: string }> {
  const rolePermissionCodes = await loadRolePermissionCodes(service, roleCode)
  if (!rolePermissionCodes) {
    return { error: 'Role not found' }
  }

  try {
    assertPermissionCodesWithinActorGrant(actorPermissions, rolePermissionCodes)
  } catch {
    return { error: 'You can only assign permissions you already have' }
  }

  return {}
}

export async function rollbackCreatedUserAfterRoleFailure(
  service: ReturnType<typeof createServiceRoleClient>,
  supabase: Pick<SupabaseClient<Database>, 'from'>,
  actorUserId: string,
  targetUserId: string,
  roleCode: string,
  reason: string,
  metadata?: Record<string, unknown>,
): Promise<void> {
  const { error: deleteError } =
    await service.auth.admin.deleteUser(targetUserId)
  if (deleteError) {
    console.error(deleteError)
  }
  await writeAuditLog(supabase as Parameters<typeof writeAuditLog>[0], {
    actorUserId,
    action: 'user.create_failed',
    targetType: 'user',
    targetId: targetUserId,
    metadata: {
      role: roleCode,
      reason,
      ...metadata,
    },
  })
}
