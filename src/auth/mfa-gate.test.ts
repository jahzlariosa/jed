import { describe, expect, it } from 'vitest'

import type { AppShellDto } from '#/auth/app-shell.types'
import { mfaGateRedirectForPath } from '#/auth/mfa-gate'

function shell(overrides: Partial<AppShellDto> = {}): AppShellDto {
  return {
    user: { id: 'u1', email: 'a@b.com' },
    access: { roles: ['admin'], permissions: ['admin.access'] },
    mfa: {
      settings: { mfaEnabled: true, mfaPolicy: 'required_admins' },
      aal: 'aal1',
      hasVerifiedFactor: true,
    },
    ...overrides,
  }
}

describe('mfaGateRedirectForPath', () => {
  it('returns null for admin when MFA is off', () => {
    const payload = shell({
      mfa: {
        settings: { mfaEnabled: false, mfaPolicy: 'optional' },
        aal: 'aal1',
        hasVerifiedFactor: false,
      },
    })
    expect(mfaGateRedirectForPath(payload, '/admin/content')).toBeNull()
  })

  it('sends admins on /admin to challenge when aal1 with verified factor', () => {
    expect(mfaGateRedirectForPath(shell(), '/admin')).toBe('/mfa-challenge')
  })

  it('does not re-hit server paths when shell is cached client-side', () => {
    const payload = shell({
      mfa: {
        settings: { mfaEnabled: true, mfaPolicy: 'optional' },
        aal: 'aal2',
        hasVerifiedFactor: true,
      },
    })
    expect(mfaGateRedirectForPath(payload, '/admin/media')).toBeNull()
    expect(mfaGateRedirectForPath(payload, '/account')).toBeNull()
  })
})
