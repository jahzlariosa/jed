import { describe, expect, it, vi } from 'vitest'

import {
  adminSetUserRoleViaService,
  assertActorCanAssignUserRole,
  assignUserRoleOnCreate,
  DEFAULT_USER_ROLE_CODE,
} from '#/auth/users-admin'
import { assertActorMayAssignRoleBeforeUserCreate } from '#/auth/users-admin-lifecycle.server'
import { PERMISSIONS } from '#/auth/permissions'

describe('adminSetUserRoleViaService', () => {
  it('calls admin_set_user_role on the service client', async () => {
    const rpc = vi.fn().mockResolvedValue({ error: null })
    const service = { rpc } as never

    await adminSetUserRoleViaService(
      service,
      '22222222-2222-4222-8222-222222222222',
      '11111111-1111-4111-8111-111111111111',
      'member',
    )

    expect(rpc).toHaveBeenCalledOnce()
    expect(rpc).toHaveBeenCalledWith('admin_set_user_role', {
      p_actor_user_id: '22222222-2222-4222-8222-222222222222',
      p_target_user_id: '11111111-1111-4111-8111-111111111111',
      p_role_code: 'member',
    })
  })
})

describe('assertActorMayAssignRoleBeforeUserCreate', () => {
  it('rejects roles whose permissions exceed the actor grant', async () => {
    const from = vi.fn().mockImplementation((table: string) => {
      if (table === 'roles') {
        return {
          select: () => ({
            eq: () => ({
              maybeSingle: async () => ({
                data: {
                  code: 'custom',
                  role_permissions: [
                    { permission_code: PERMISSIONS.rolesManage },
                  ],
                },
                error: null,
              }),
            }),
          }),
        }
      }
      throw new Error(`unexpected table ${table}`)
    })
    const service = { from } as never

    const result = await assertActorMayAssignRoleBeforeUserCreate(
      service,
      [PERMISSIONS.adminAccess],
      'custom',
    )
    expect(result.error).toBe(
      'You can only assign permissions you already have',
    )
  })
})

describe('assignUserRoleOnCreate', () => {
  const actorId = '22222222-2222-4222-8222-222222222222'
  const targetId = '11111111-1111-4111-8111-111111111111'

  it('upserts member without roles.manage', async () => {
    const upsert = vi.fn().mockResolvedValue({ error: null })
    const service = {
      from: (table: string) => {
        if (table !== 'user_roles') {
          throw new Error(`unexpected table ${table}`)
        }
        return { upsert }
      },
    } as never

    const result = await assignUserRoleOnCreate(
      service,
      actorId,
      [PERMISSIONS.adminAccess],
      targetId,
      DEFAULT_USER_ROLE_CODE,
    )
    expect(result.error).toBeUndefined()
    expect(upsert).toHaveBeenCalledWith({
      user_id: targetId,
      role_code: DEFAULT_USER_ROLE_CODE,
    })
  })

  it('requires roles.manage for non-default roles', async () => {
    const rpc = vi.fn()
    const service = { from: vi.fn(), rpc } as never

    const result = await assignUserRoleOnCreate(
      service,
      actorId,
      [PERMISSIONS.adminAccess],
      targetId,
      'admin',
    )
    expect(result.error).toBe('Forbidden')
    expect(rpc).not.toHaveBeenCalled()
  })
})

describe('assertActorCanAssignUserRole', () => {
  const actorId = '22222222-2222-4222-8222-222222222222'
  const targetId = '11111111-1111-4111-8111-111111111111'
  const allPerms = Object.values(PERMISSIONS)

  it('refuses self role changes', async () => {
    const service = {} as never
    const result = await assertActorCanAssignUserRole(
      service,
      allPerms,
      actorId,
      actorId,
      'member',
    )
    expect(result.error).toBe('You cannot change your own role')
  })

  it('refuses when the target role exceeds the actor grant', async () => {
    const from = vi.fn().mockImplementation((table: string) => {
      if (table === 'roles') {
        return {
          select: () => ({
            eq: () => ({
              maybeSingle: async () => ({
                data: {
                  code: 'custom',
                  role_permissions: [
                    { permission_code: PERMISSIONS.rolesManage },
                  ],
                },
                error: null,
              }),
            }),
          }),
        }
      }
      throw new Error(`unexpected table ${table}`)
    })
    const service = { from } as never

    const result = await assertActorCanAssignUserRole(
      service,
      [PERMISSIONS.adminAccess],
      actorId,
      targetId,
      'custom',
    )
    expect(result.error).toBe(
      'You can only assign permissions you already have',
    )
  })
})
