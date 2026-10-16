import type { AppShellDto } from '#/auth/app-shell.types'
import { resolveMfaRouteRedirect } from '#/auth/mfa-policy'

/** Client-safe MFA redirect from a cached app shell payload (no extra server fn). */
export function mfaGateRedirectForPath(
  shell: AppShellDto,
  pathname: string,
): string | null {
  return resolveMfaRouteRedirect({
    settings: shell.mfa.settings,
    access: shell.access,
    pathname,
    aal: shell.mfa.aal,
    hasVerifiedFactor: shell.mfa.hasVerifiedFactor,
  })
}
