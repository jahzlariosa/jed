import { beforeEach, describe, expect, it, vi } from 'vitest'

import { PERMISSIONS } from '#/auth/permissions'

const { testRequest } = vi.hoisted(() => ({
  testRequest: new Request('https://example.com/api/v1/content'),
}))

const mfaSiteSettings = vi.fn()
const mfaSessionState = vi.fn()
const requireUserMock = vi.fn()
const getAccessMock = vi.fn()

vi.mock('@tanstack/react-start/server', async (importOriginal) => {
  const actual =
    await importOriginal<typeof import('@tanstack/react-start/server')>()
  return {
    ...actual,
    setResponseStatus: vi.fn(),
    setResponseHeader: vi.fn(),
    getRequest: () => testRequest,
    getCookies: vi.fn(() => ({})),
  }
})

vi.mock('#/auth/mfa-request.server', () => ({
  getRequestMfaSiteSettings: () => mfaSiteSettings(),
  getRequestMfaSessionState: () => mfaSessionState(),
}))

vi.mock('#/auth/session.server', async (importOriginal) => {
  const mod = await importOriginal<typeof import('#/auth/session.server')>()
  return {
    ...mod,
    requireUser: (...args: unknown[]) => requireUserMock(...args),
    getAccess: (...args: unknown[]) => getAccessMock(...args),
  }
})

import { setResponseStatus } from '@tanstack/react-start/server'

import { requirePermission } from '#/auth/require-permission.server'
import {
  clearRequestAuth,
  installBearerRequestAuth,
} from '#/auth/session.server'

const adminUser = { id: 'admin-1', email: 'admin@example.com' }
const adminAccess = {
  roles: ['admin'],
  permissions: [PERMISSIONS.contentWrite, PERMISSIONS.contentRead],
}

describe('requirePermission bearer fresh writes', () => {
  beforeEach(() => {
    clearRequestAuth()
    vi.clearAllMocks()
    requireUserMock.mockResolvedValue(adminUser)
    getAccessMock.mockResolvedValue(adminAccess)
    mfaSiteSettings.mockResolvedValue({
      mfaEnabled: false,
      mfaPolicy: 'off',
    })
    mfaSessionState.mockResolvedValue({
      aal: 'aal1',
      hasVerifiedFactor: false,
      verifiedFactorId: null,
      pendingFactorIds: [],
    })
  })

  it('skips auth.getUser when bearerTokenId is set', async () => {
    const getUser = vi.fn()
    const client = {
      auth: { getUser },
    } as unknown as import('#/auth/session.server').RequestSupabase

    installBearerRequestAuth({
      client,
      user: adminUser,
      tokenId: 'token-1',
      tokenScopes: [PERMISSIONS.contentWrite],
      access: adminAccess,
    })

    await requirePermission({ fresh: true }, PERMISSIONS.contentWrite)

    expect(getUser).not.toHaveBeenCalled()
  })
})

describe('requirePermission admin MFA (real)', () => {
  beforeEach(() => {
    clearRequestAuth()
    vi.clearAllMocks()
    requireUserMock.mockResolvedValue(adminUser)
    getAccessMock.mockResolvedValue(adminAccess)
    mfaSiteSettings.mockResolvedValue({
      mfaEnabled: true,
      mfaPolicy: 'required_admins',
    })
  })

  it('rejects AAL1 and allows AAL2 for admin-surface permission', async () => {
    mfaSessionState.mockResolvedValue({
      aal: 'aal1',
      hasVerifiedFactor: true,
      verifiedFactorId: 'factor-1',
      pendingFactorIds: [],
    })

    await expect(requirePermission(PERMISSIONS.contentWrite)).rejects.toThrow(
      /multi-factor/,
    )
    expect(setResponseStatus).toHaveBeenCalledWith(403)

    vi.clearAllMocks()
    requireUserMock.mockResolvedValue(adminUser)
    getAccessMock.mockResolvedValue(adminAccess)
    mfaSiteSettings.mockResolvedValue({
      mfaEnabled: true,
      mfaPolicy: 'required_admins',
    })
    mfaSessionState.mockResolvedValue({
      aal: 'aal2',
      hasVerifiedFactor: true,
      verifiedFactorId: 'factor-1',
      pendingFactorIds: [],
    })

    await expect(requirePermission(PERMISSIONS.contentWrite)).resolves.toEqual({
      user: adminUser,
      access: adminAccess,
    })
  })
})
