import '@tanstack/react-start/server-only'

import { setResponseStatus } from '@tanstack/react-start/server'

import type { AccessDto } from '#/auth/permissions'
import type { createClient } from '#/lib/supabase/server'

import {
  getRequestMfaSessionState,
  getRequestMfaSiteSettings,
} from '#/auth/mfa-request.server'
import { effectiveMfaPolicy, resolveMfaRouteRedirect } from './mfa-policy'
import type { MfaSessionState } from './mfa-policy.server'
import type { AppUser } from './user'

export async function getMfaGateRedirect(pathname: string, access: AccessDto) {
  const settings = await getRequestMfaSiteSettings()
  const policy = effectiveMfaPolicy(settings)
  if (policy === 'off') {
    return null
  }

  const mfa = await getRequestMfaSessionState()
  return resolveMfaRouteRedirect({
    settings,
    access,
    pathname,
    aal: mfa.aal,
    hasVerifiedFactor: mfa.hasVerifiedFactor,
  })
}

export async function assertMfaServerAccess(input: {
  user: AppUser
  access: AccessDto
  scope: 'admin' | 'session'
}) {
  const settings = await getRequestMfaSiteSettings()
  const policy = effectiveMfaPolicy(settings)
  if (policy === 'off') {
    return
  }

  const mfa = await getRequestMfaSessionState()

  if (input.scope === 'admin') {
    if (
      (policy === 'required_admins' || policy === 'required_all') &&
      !mfa.hasVerifiedFactor
    ) {
      setResponseStatus(403)
      throw new Error('Set up multi-factor authentication to use admin.')
    }
    if (
      (policy === 'required_admins' || policy === 'required_all') &&
      mfa.aal !== 'aal2'
    ) {
      setResponseStatus(403)
      throw new Error('Complete multi-factor sign-in to use admin.')
    }
    return
  }

  if (policy === 'required_all') {
    if (!mfa.hasVerifiedFactor) {
      setResponseStatus(403)
      throw new Error('Set up multi-factor authentication to continue.')
    }
    if (mfa.aal !== 'aal2') {
      setResponseStatus(403)
      throw new Error('Complete multi-factor sign-in to continue.')
    }
  }

  if (policy === 'optional' && mfa.hasVerifiedFactor && mfa.aal === 'aal1') {
    setResponseStatus(403)
    throw new Error('Complete multi-factor sign-in to continue.')
  }
}

export async function actorHasVerifiedMfaFactor(
  _supabase: ReturnType<typeof createClient>,
) {
  const state = await getRequestMfaSessionState()
  return state.hasVerifiedFactor
}

export type { MfaSessionState }
