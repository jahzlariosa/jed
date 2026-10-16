import '@tanstack/react-start/server-only'

import { resolveAuthRedirect, signedInLandingPath } from './redirect'
import { getAccess, getCurrentUser } from './session.server'
import { parseOptionalRedirect } from './validators'

/** Signed-in landing path; honors `?redirect=` when safe. */
export async function resolveSignedInRedirect(
  redirectTo: string | undefined,
): Promise<string | null> {
  const user = await getCurrentUser()
  if (!user) {
    return null
  }
  const access = await getAccess(user.id)
  const fallback = await signedInLandingPath(access)
  const parsed = parseOptionalRedirect(redirectTo)
  return resolveAuthRedirect(parsed, fallback)
}
