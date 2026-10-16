import { describe, expect, it } from 'vitest'

import { PERMISSIONS } from '#/auth/permissions'
import {
  effectiveMfaPolicy,
  policyRequiresEnrollment,
  resolveMfaRouteRedirect,
  assertMfaPolicyAllowsSave,
} from '#/auth/mfa-policy'

const adminAccess = {
  roles: ['admin'],
  permissions: [PERMISSIONS.adminAccess],
}

const memberAccess = {
  roles: ['member'],
  permissions: [],
}

describe('effectiveMfaPolicy', () => {
  it('returns off when MFA is disabled', () => {
    expect(
      effectiveMfaPolicy({ mfaEnabled: false, mfaPolicy: 'required_all' }),
    ).toBe('off')
  })
})

describe('resolveMfaRouteRedirect', () => {
  it('sends admins without a factor to setup when required_admins', () => {
    expect(
      resolveMfaRouteRedirect({
        settings: { mfaEnabled: true, mfaPolicy: 'required_admins' },
        access: adminAccess,
        pathname: '/admin',
        aal: 'aal1',
        hasVerifiedFactor: false,
      }),
    ).toBe('/mfa-setup')
  })

  it('sends enrolled users at aal1 to challenge on optional policy', () => {
    expect(
      resolveMfaRouteRedirect({
        settings: { mfaEnabled: true, mfaPolicy: 'optional' },
        access: memberAccess,
        pathname: '/account',
        aal: 'aal1',
        hasVerifiedFactor: true,
      }),
    ).toBe('/mfa-challenge')
  })

  it('does not require setup for members when only admins are required', () => {
    expect(
      resolveMfaRouteRedirect({
        settings: { mfaEnabled: true, mfaPolicy: 'required_admins' },
        access: memberAccess,
        pathname: '/account',
        aal: 'aal1',
        hasVerifiedFactor: false,
      }),
    ).toBeNull()
  })

  it('exempts setup and challenge routes', () => {
    expect(
      resolveMfaRouteRedirect({
        settings: { mfaEnabled: true, mfaPolicy: 'required_all' },
        access: memberAccess,
        pathname: '/mfa-setup',
        aal: 'aal1',
        hasVerifiedFactor: false,
      }),
    ).toBeNull()
  })
})

describe('policyRequiresEnrollment', () => {
  it('requires all users when policy is required_all', () => {
    expect(
      policyRequiresEnrollment('required_all', memberAccess, '/account'),
    ).toBe(true)
  })
})

describe('assertMfaPolicyAllowsSave', () => {
  it('blocks strict policies without a verified factor', () => {
    expect(
      assertMfaPolicyAllowsSave({
        nextPolicy: 'required_admins',
        actorHasVerifiedFactor: false,
      }),
    ).toMatch(/authenticator/)
  })

  it('allows optional policy without a factor', () => {
    expect(
      assertMfaPolicyAllowsSave({
        nextPolicy: 'optional',
        actorHasVerifiedFactor: false,
      }),
    ).toBeNull()
  })
})
