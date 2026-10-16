import { beforeEach, describe, expect, it, vi } from 'vitest'

import { PERMISSIONS } from '#/auth/permissions'

const mfaSiteSettings = vi.fn()
const mfaSessionState = vi.fn()
const requirePermissionMock = vi.fn()

vi.mock('@tanstack/react-start/server', () => ({
  setResponseStatus: vi.fn(),
  setResponseHeader: vi.fn(),
  getRequest: () => new Request('https://example.com/admin'),
}))

vi.mock('#/auth/mfa-request.server', () => ({
  getRequestMfaSiteSettings: () => mfaSiteSettings(),
  getRequestMfaSessionState: () => mfaSessionState(),
}))

vi.mock('#/auth/session.server', () => ({
  requirePermission: (...args: unknown[]) => requirePermissionMock(...args),
  getRequestClient: () => ({}),
  markPrivateNoStore: vi.fn(),
}))

import { setResponseStatus } from '@tanstack/react-start/server'

import {
  permissionsRequireAdminMfaScope,
  requireCmsAccess,
  requireCmsWrite,
} from '#/auth/admin-access.server'
import { assertAdminMfaForPermissions } from '#/auth/permission-mfa.server'

const adminUser = { id: 'admin-1', email: 'admin@example.com' }
const adminAccess = {
  roles: ['admin'],
  permissions: [PERMISSIONS.contentWrite, PERMISSIONS.contentRead],
}

describe('permissionsRequireAdminMfaScope', () => {
  it('includes content.write (saveContentFn)', () => {
    expect(permissionsRequireAdminMfaScope([PERMISSIONS.contentWrite])).toBe(
      true,
    )
  })

  it('includes content.read (listContentFn)', () => {
    expect(permissionsRequireAdminMfaScope([PERMISSIONS.contentRead])).toBe(
      true,
    )
  })
})

describe('requireCmsAccess / requireCmsWrite', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    requirePermissionMock.mockResolvedValue({
      user: adminUser,
      access: adminAccess,
    })
  })

  it('listContentFn uses requirePermission without fresh', async () => {
    await requireCmsAccess(PERMISSIONS.contentRead)
    expect(requirePermissionMock).toHaveBeenCalledWith(PERMISSIONS.contentRead)
  })

  it('saveContentFn uses requirePermission with fresh', async () => {
    await requireCmsWrite(PERMISSIONS.contentWrite)
    expect(requirePermissionMock).toHaveBeenCalledWith(
      { fresh: true },
      PERMISSIONS.contentWrite,
    )
  })
})

describe('requirePermission MFA enforcement (via assertAdminMfaForPermissions)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mfaSiteSettings.mockResolvedValue({
      mfaEnabled: true,
      mfaPolicy: 'required_admins',
    })
    mfaSessionState.mockResolvedValue({
      aal: 'aal1',
      hasVerifiedFactor: true,
      verifiedFactorId: 'factor-1',
      pendingFactorIds: [],
    })
  })

  it('saveContentFn path: content.write returns 403 for AAL1 under required_admins', async () => {
    await expect(
      assertAdminMfaForPermissions({
        user: adminUser,
        access: adminAccess,
        needed: [PERMISSIONS.contentWrite],
        skipMfa: false,
      }),
    ).rejects.toThrow(/multi-factor/)
    expect(setResponseStatus).toHaveBeenCalledWith(403)
  })

  it('listContentFn path: content.read returns 403 for AAL1 under required_admins', async () => {
    await expect(
      assertAdminMfaForPermissions({
        user: adminUser,
        access: adminAccess,
        needed: [PERMISSIONS.contentRead],
        skipMfa: false,
      }),
    ).rejects.toThrow(/multi-factor/)
    expect(setResponseStatus).toHaveBeenCalledWith(403)
  })
})
