import { beforeEach, describe, expect, it, vi } from 'vitest'

import { PERMISSIONS } from '#/auth/permissions'

vi.mock('@tanstack/react-start/server', () => ({
  setResponseStatus: vi.fn(),
  getRequest: () => new Request('https://example.com/admin'),
}))

const mfaSiteSettings = vi.fn()
const mfaSessionState = vi.fn()

vi.mock('#/auth/mfa-request.server', () => ({
  getRequestMfaSiteSettings: () => mfaSiteSettings(),
  getRequestMfaSessionState: () => mfaSessionState(),
}))

import { setResponseStatus } from '@tanstack/react-start/server'

import { assertMfaServerAccess } from '#/auth/mfa-gate.server'

const adminAccess = {
  roles: ['admin'],
  permissions: [PERMISSIONS.contentWrite, PERMISSIONS.adminAccess],
}

describe('assertMfaServerAccess', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('policy off skips AAL2 even when a verified factor exists', async () => {
    mfaSiteSettings.mockResolvedValue({
      mfaEnabled: false,
      mfaPolicy: 'required_all',
    })
    mfaSessionState.mockResolvedValue({
      aal: 'aal1',
      hasVerifiedFactor: true,
      verifiedFactorId: 'factor-1',
      pendingFactorIds: [],
    })

    await expect(
      assertMfaServerAccess({
        user: { id: 'u1', email: 'a@example.com' },
        access: adminAccess,
        scope: 'admin',
      }),
    ).resolves.toBeUndefined()
  })

  it('admin scope rejects AAL1 under required_admins', async () => {
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

    await expect(
      assertMfaServerAccess({
        user: { id: 'u1', email: 'a@example.com' },
        access: adminAccess,
        scope: 'admin',
      }),
    ).rejects.toThrow(/multi-factor/)
    expect(setResponseStatus).toHaveBeenCalledWith(403)
  })
})
