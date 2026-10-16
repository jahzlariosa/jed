import { isAdmin } from '#/auth/admin'
import type { AccessDto } from '#/auth/permissions'

export const MFA_POLICIES = [
  'off',
  'optional',
  'required_admins',
  'required_all',
] as const

export type MfaPolicy = (typeof MFA_POLICIES)[number]

export type MfaSiteSettings = {
  mfaEnabled: boolean
  mfaPolicy: MfaPolicy
}

export const MFA_SETUP_PATH = '/mfa-setup'
export const MFA_CHALLENGE_PATH = '/mfa-challenge'

export const MFA_EXEMPT_PATHS = new Set([MFA_SETUP_PATH, MFA_CHALLENGE_PATH])

export function parseMfaPolicy(value: unknown): MfaPolicy {
  if (typeof value === 'string' && MFA_POLICIES.includes(value as MfaPolicy)) {
    return value as MfaPolicy
  }
  return 'optional'
}

export function effectiveMfaPolicy(settings: MfaSiteSettings): MfaPolicy {
  if (!settings.mfaEnabled) {
    return 'off'
  }
  return settings.mfaPolicy
}

export function isAdminPath(pathname: string) {
  return pathname === '/admin' || pathname.startsWith('/admin/')
}

export function policyRequiresEnrollment(
  policy: MfaPolicy,
  access: AccessDto,
  pathname: string,
): boolean {
  if (policy === 'required_all') {
    return true
  }
  if (policy === 'required_admins' && isAdmin(access)) {
    return isAdminPath(pathname) || pathname.startsWith('/admin-panel')
  }
  return false
}

export function policyRequiresAal2ForPath(
  policy: MfaPolicy,
  access: AccessDto,
  pathname: string,
): boolean {
  if (policy === 'off') {
    return false
  }
  if (policy === 'required_all') {
    return true
  }
  if (policy === 'required_admins') {
    return isAdmin(access) && isAdminPath(pathname)
  }
  return false
}

export type MfaAalLevel = 'aal1' | 'aal2'

export function resolveMfaRouteRedirect(input: {
  settings: MfaSiteSettings
  access: AccessDto
  pathname: string
  aal: MfaAalLevel | null
  hasVerifiedFactor: boolean
}): typeof MFA_SETUP_PATH | typeof MFA_CHALLENGE_PATH | null {
  if (MFA_EXEMPT_PATHS.has(input.pathname)) {
    return null
  }

  const policy = effectiveMfaPolicy(input.settings)
  if (policy === 'off') {
    return null
  }

  const enrollmentRequired = policyRequiresEnrollment(
    policy,
    input.access,
    input.pathname,
  )
  if (enrollmentRequired && !input.hasVerifiedFactor) {
    return MFA_SETUP_PATH
  }

  const needsChallenge =
    input.hasVerifiedFactor &&
    input.aal === 'aal1' &&
    (policy === 'optional' ||
      policyRequiresAal2ForPath(policy, input.access, input.pathname) ||
      enrollmentRequired)

  if (needsChallenge) {
    return MFA_CHALLENGE_PATH
  }

  return null
}

export function assertMfaPolicyAllowsSave(input: {
  nextPolicy: MfaPolicy
  actorHasVerifiedFactor: boolean
}): string | null {
  if (
    (input.nextPolicy === 'required_admins' ||
      input.nextPolicy === 'required_all') &&
    !input.actorHasVerifiedFactor
  ) {
    return 'Set up your own authenticator before requiring MFA for others.'
  }
  return null
}
