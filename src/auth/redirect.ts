import { canUseAdmin } from '#/lib/cms/access'

import { safeInternalPath } from './path'
import type { AccessDto } from './permissions'
import { loadAuthRedirectSettings } from '#/lib/cms/auth-redirect-settings.server'

export function resolveAuthRedirect(
  value: string | null | undefined,
  fallback: string,
): string {
  const fromQuery = value ? safeInternalPath(value, null) : null
  if (fromQuery) {
    return fromQuery
  }
  return safeInternalPath(fallback, fallback) ?? fallback
}

/**
 * Where a successful sign-in goes when `?redirect` is absent.
 * Only a holder of `admin.access` uses the admin setting. Everyone else uses the
 * member setting, and the legacy `/account` value means `/` so a denied admin
 * visit cannot bounce them onto the account page.
 */
export function landingPathForAccess(
  access: AccessDto,
  settings: { signInAdmin: string; signInUser: string },
): string {
  if (canUseAdmin(access.permissions)) {
    return safeInternalPath(settings.signInAdmin, '/admin') ?? '/admin'
  }
  const memberPath = settings.signInUser.trim()
  if (!memberPath || memberPath === '/account') {
    return '/'
  }
  return safeInternalPath(memberPath, '/') ?? '/'
}

/** Explicit `?redirect` wins. Otherwise the role landing path. Never invents `/account`. */
export function resolvePostSignInHref(
  access: AccessDto,
  redirectTo: string | null | undefined,
  settings: { signInAdmin: string; signInUser: string },
): string {
  const explicit = redirectTo ? safeInternalPath(redirectTo, null) : null
  if (explicit) {
    return explicit
  }
  return landingPathForAccess(access, settings)
}

export async function signedInLandingPath(access: AccessDto): Promise<string> {
  const settings = await loadAuthRedirectSettings()
  return landingPathForAccess(access, settings)
}

/** After password reset; role-based unless settings override the legacy /account default. */
export async function passwordResetLandingPath(
  access: AccessDto,
): Promise<string> {
  const settings = await loadAuthRedirectSettings()
  const roleBased = await signedInLandingPath(access)
  const configured = settings.passwordReset.trim()
  if (!configured || configured === '/account') {
    return roleBased
  }
  return safeInternalPath(configured) ?? roleBased
}
