import { createServerFn } from '@tanstack/react-start'
import { setResponseStatus } from '@tanstack/react-start/server'

import { createClient } from '#/lib/supabase/server'
import { effectiveMfaPolicy } from '#/auth/mfa-policy'
import { totpIssuerFromSiteName } from '#/auth/mfa-issuer'
import { loadAuthBranding } from '#/lib/cms/public-marketing.server'

import { resolvePostSignInHref } from './redirect'
import { loadAuthRedirectSettings } from '#/lib/cms/auth-redirect-settings.server'
import {
  cleanupPendingMfaFactors,
  loadMfaSiteSettings as loadSettings,
  readMfaSessionState,
} from './mfa-policy.server'
import {
  clearRequestAuth,
  getAccessWithClient,
  markPrivateNoStore,
  requireUser,
} from './session.server'
import { parseOptionalRedirect } from './validators'

const CODE_PATTERN = /^\d{6}$/

function parseTotpCode(value: unknown) {
  const code = typeof value === 'string' ? value.trim() : ''
  if (!CODE_PATTERN.test(code)) {
    throw new Error('Enter a 6-digit code')
  }
  return code
}

export const getMfaAccountSettingsFn = createServerFn({
  method: 'GET',
}).handler(async () => {
  markPrivateNoStore()
  await requireUser({ skipMfaCheck: true })
  const settings = await loadSettings()
  const policy = effectiveMfaPolicy(settings)
  return {
    mfaEnabled: settings.mfaEnabled,
    showEnrollmentUi: settings.mfaEnabled && policy !== 'off',
  }
})

export const getMfaGateRedirectFn = createServerFn({ method: 'GET' })
  .validator((input: unknown) => {
    if (typeof input !== 'object' || input === null) {
      return { pathname: '/' }
    }
    const raw = input as Record<string, unknown>
    const pathname =
      typeof raw.pathname === 'string' ? raw.pathname.slice(0, 512) : '/'
    return { pathname }
  })
  .handler(async ({ data }) => {
    markPrivateNoStore()
    const { loadAppShellDto } = await import('#/auth/app-shell.server')
    const { mfaGateRedirectForPath } = await import('#/auth/mfa-gate')
    const shell = await loadAppShellDto()
    if (!shell) {
      setResponseStatus(401)
      throw new Error('Unauthorized')
    }
    const redirectTo = mfaGateRedirectForPath(shell, data.pathname)
    return { redirectTo }
  })

export const listMfaFactorsFn = createServerFn({ method: 'GET' }).handler(
  async () => {
    markPrivateNoStore()
    await requireUser({ skipMfaCheck: true })
    const settings = await loadSettings()
    if (!settings.mfaEnabled || effectiveMfaPolicy(settings) === 'off') {
      return { verified: [], pending: [], enrollmentAllowed: false }
    }
    const supabase = createClient()
    const state = await readMfaSessionState(supabase)
    if (state.pendingFactorIds.length > 0) {
      await cleanupPendingMfaFactors(supabase, state.pendingFactorIds)
    }
    const { data, error } = await supabase.auth.mfa.listFactors()
    if (error) {
      console.error(error)
      throw new Error('Unable to load authenticator status')
    }
    const verified = (data.totp ?? []).filter((f) => f.status === 'verified')
    const pending = (data.totp ?? []).filter((f) => f.status !== 'verified')
    return {
      enrollmentAllowed: true,
      verified: verified.map((f) => ({
        id: f.id,
        friendlyName: f.friendly_name ?? 'Authenticator app',
        createdAt: typeof f.created_at === 'string' ? f.created_at : null,
      })),
      pending: pending.map((f) => ({
        id: f.id,
        friendlyName: f.friendly_name,
      })),
    }
  },
)

export const enrollMfaTotpFn = createServerFn({ method: 'POST' }).handler(
  async () => {
    markPrivateNoStore()
    await requireUser({ skipMfaCheck: true })
    const settings = await loadSettings()
    if (!settings.mfaEnabled || effectiveMfaPolicy(settings) === 'off') {
      return { error: 'Authenticator setup is not available right now.' }
    }
    const supabase = createClient()
    const state = await readMfaSessionState(supabase)
    if (state.pendingFactorIds.length > 0) {
      await cleanupPendingMfaFactors(supabase, state.pendingFactorIds)
    }
    const branding = await loadAuthBranding()
    const { data, error } = await supabase.auth.mfa.enroll({
      factorType: 'totp',
      friendlyName: 'Authenticator app',
      issuer: totpIssuerFromSiteName(branding.siteName),
    })
    if (error) {
      console.error(error)
      return { error: 'Unable to start authenticator setup' }
    }
    return {
      factorId: data.id,
      qrCode: data.totp?.qr_code ?? '',
      secret: data.totp?.secret ?? '',
    }
  },
)

export const verifyMfaEnrollmentFn = createServerFn({ method: 'POST' })
  .validator((input: unknown) => {
    if (typeof input !== 'object' || input === null) {
      throw new Error('Unable to verify code')
    }
    const raw = input as Record<string, unknown>
    return {
      factorId: String(raw.factorId ?? ''),
      code: parseTotpCode(raw.code),
    }
  })
  .handler(async ({ data }) => {
    markPrivateNoStore()
    await requireUser({ skipMfaCheck: true })
    const supabase = createClient()
    const { data: challenge, error: challengeError } =
      await supabase.auth.mfa.challenge({ factorId: data.factorId })
    if (challengeError) {
      console.error(challengeError)
      return { error: 'Unable to verify code' }
    }
    const { error } = await supabase.auth.mfa.verify({
      factorId: data.factorId,
      challengeId: challenge.id,
      code: data.code,
    })
    if (error) {
      console.error(error)
      return { error: 'That code did not match. Try again.' }
    }
    clearRequestAuth()
    return { ok: true as const }
  })

export const unenrollMfaFactorFn = createServerFn({ method: 'POST' })
  .validator((input: unknown) => {
    if (typeof input !== 'object' || input === null) {
      throw new Error('Unable to remove authenticator')
    }
    const raw = input as Record<string, unknown>
    return { factorId: String(raw.factorId ?? '') }
  })
  .handler(async ({ data }) => {
    markPrivateNoStore()
    await requireUser({ skipMfaCheck: true })
    const supabase = createClient()
    const state = await readMfaSessionState(supabase)
    if (state.aal !== 'aal2') {
      setResponseStatus(403)
      return {
        error: 'Sign in with your authenticator code before removing it.',
      }
    }
    const { error } = await supabase.auth.mfa.unenroll({
      factorId: data.factorId,
    })
    if (error) {
      console.error(error)
      return { error: 'Unable to remove authenticator' }
    }
    clearRequestAuth()
    return { ok: true as const }
  })

export const completeMfaChallengeFn = createServerFn({ method: 'POST' })
  .validator((input: unknown) => {
    if (typeof input !== 'object' || input === null) {
      throw new Error('Unable to verify code')
    }
    const raw = input as Record<string, unknown>
    return {
      factorId: String(raw.factorId ?? ''),
      code: parseTotpCode(raw.code),
      redirectTo: parseOptionalRedirect(raw.redirectTo),
    }
  })
  .handler(async ({ data }) => {
    markPrivateNoStore()
    const startUser = await requireUser({ skipMfaCheck: true })
    const supabase = createClient()
    const { data: challenge, error: challengeError } =
      await supabase.auth.mfa.challenge({ factorId: data.factorId })
    if (challengeError) {
      console.error(challengeError)
      return { error: 'Unable to verify code' }
    }
    const { data: verified, error } = await supabase.auth.mfa.verify({
      factorId: data.factorId,
      challengeId: challenge.id,
      code: data.code,
    })
    if (error) {
      console.error(error)
      return { error: 'That code did not match. Try again.' }
    }
    const authUser = verified.user
    if (!authUser || authUser.id !== startUser.id) {
      clearRequestAuth()
      return { error: 'Unable to verify code' }
    }
    // The aal2 session only exists on this client and in the Set-Cookie
    // response. Request cookies still hold the aal1 session, so re-running the
    // MFA gate here would reject the code that just verified.
    const access = await getAccessWithClient(authUser.id, supabase)
    const settings = await loadAuthRedirectSettings()
    const redirectTo = resolvePostSignInHref(access, data.redirectTo, settings)
    clearRequestAuth()
    return { redirectTo }
  })

export const verifyMfaSignInFn = createServerFn({ method: 'POST' })
  .validator((input: unknown) => {
    if (typeof input !== 'object' || input === null) {
      throw new Error('Unable to verify code')
    }
    const raw = input as Record<string, unknown>
    return {
      factorId: String(raw.factorId ?? ''),
      code: parseTotpCode(raw.code),
      redirectTo: parseOptionalRedirect(raw.redirectTo),
    }
  })
  .handler(async ({ data }) => {
    markPrivateNoStore()
    const supabase = createClient()
    const { data: challenge, error: challengeError } =
      await supabase.auth.mfa.challenge({ factorId: data.factorId })
    if (challengeError) {
      console.error(challengeError)
      return { error: 'Unable to verify code' }
    }
    const { data: verified, error } = await supabase.auth.mfa.verify({
      factorId: data.factorId,
      challengeId: challenge.id,
      code: data.code,
    })
    if (error) {
      console.error(error)
      return { error: 'That code did not match. Try again.' }
    }
    const authUser = verified.user
    if (!authUser) {
      return { error: 'Unable to verify code' }
    }
    const user = { id: authUser.id, email: authUser.email ?? null }
    const access = await getAccessWithClient(user.id, supabase)
    const settings = await loadAuthRedirectSettings()
    const redirectTo = resolvePostSignInHref(access, data.redirectTo, settings)
    clearRequestAuth()
    return { redirectTo }
  })
