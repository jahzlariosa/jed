import { describe, expect, it } from 'vitest'

import {
  ADMIN_ROLE_REQUIRED_PERMISSIONS,
  assertAdminRolePermissionsPreserved,
  assertPermissionCodesWithinActorGrant,
  canDeleteRole,
  canEditRolePermissions,
  canManageRolesCatalog,
  parseRolePermissionCodes,
} from '#/auth/roles-admin-logic'
import { PERMISSIONS } from '#/auth/permissions'

describe('roles catalog logic', () => {
  it('gates catalog writes on roles.manage', () => {
    expect(canManageRolesCatalog([PERMISSIONS.adminAccess])).toBe(false)
    expect(
      canManageRolesCatalog([PERMISSIONS.adminAccess, PERMISSIONS.rolesManage]),
    ).toBe(true)
  })

  it('blocks permission edits on system roles', () => {
    expect(canEditRolePermissions({ isSystem: true })).toBe(false)
    expect(canEditRolePermissions({ isSystem: false })).toBe(true)
  })

  it('blocks deleting system roles', () => {
    expect(canDeleteRole({ isSystem: true, memberCount: 0 })).toEqual({
      ok: false,
      reason: 'system',
    })
  })

  it('blocks deleting assigned roles without reassignment', () => {
    expect(canDeleteRole({ isSystem: false, memberCount: 3 })).toEqual({
      ok: false,
      reason: 'assigned',
      memberCount: 3,
    })
    expect(
      canDeleteRole({
        isSystem: false,
        memberCount: 3,
        reassignToRoleCode: 'member',
      }),
    ).toEqual({ ok: true })
  })

  it('blocks reassign targets whose permissions exceed the actor grant', () => {
    expect(() =>
      assertPermissionCodesWithinActorGrant(
        [PERMISSIONS.adminAccess, PERMISSIONS.rolesManage],
        [PERMISSIONS.adminAccess],
      ),
    ).not.toThrow()
    expect(() =>
      assertPermissionCodesWithinActorGrant(
        [PERMISSIONS.contentRead],
        [PERMISSIONS.adminAccess, PERMISSIONS.rolesManage],
      ),
    ).toThrow('You can only assign permissions you already have')
  })

  it('blocks granting permissions the actor does not hold', () => {
    expect(() =>
      assertPermissionCodesWithinActorGrant(
        [PERMISSIONS.contentRead],
        [PERMISSIONS.contentRead],
      ),
    ).not.toThrow()
    expect(() =>
      assertPermissionCodesWithinActorGrant(
        [PERMISSIONS.contentRead],
        [PERMISSIONS.rolesManage],
      ),
    ).toThrow('You can only assign permissions you already have')
  })

  it('parses permission codes and rejects unknown codes', () => {
    expect(parseRolePermissionCodes([PERMISSIONS.contentRead])).toEqual([
      PERMISSIONS.contentRead,
    ])
    expect(() => parseRolePermissionCodes(['not.real'])).toThrow(
      'Choose valid permissions',
    )
  })

  it('guards built-in admin permission sets', () => {
    expect(() =>
      assertAdminRolePermissionsPreserved(
        'admin',
        ADMIN_ROLE_REQUIRED_PERMISSIONS,
      ),
    ).not.toThrow()
    expect(() =>
      assertAdminRolePermissionsPreserved('admin', [PERMISSIONS.adminAccess]),
    ).toThrow('Built-in admin permissions cannot be changed here')
    expect(() =>
      assertAdminRolePermissionsPreserved('editor', [PERMISSIONS.contentRead]),
    ).not.toThrow()
  })
})
