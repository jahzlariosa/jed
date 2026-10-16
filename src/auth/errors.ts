import { redirect } from '@tanstack/react-router'

/**
 * Fixed messages thrown by `requireUser` / `requirePermission`. They survive the server-fn
 * serializer (only `message` crosses the wire), so the client matches on them.
 */
export const UNAUTHORIZED_MESSAGE = 'Unauthorized'
export const FORBIDDEN_MESSAGE = 'Forbidden'

export type AuthFailure = 'unauthorized' | 'forbidden'

export function classifyAuthFailure(error: unknown): AuthFailure | null {
  if (!(error instanceof Error)) {
    return null
  }
  if (error.message === UNAUTHORIZED_MESSAGE) {
    return 'unauthorized'
  }
  if (error.message === FORBIDDEN_MESSAGE) {
    return 'forbidden'
  }
  return null
}

/**
 * Route loaders run during SSR, where a thrown error always renders as HTTP 500. Map auth
 * failures to redirects instead: signed out -> /login, signed in without permission -> /account.
 * This is UX only; every server fn still enforces the check itself.
 */
export async function withAuthRedirects<T>(
  run: () => Promise<T>,
  returnTo?: string,
): Promise<T> {
  try {
    return await run()
  } catch (error) {
    const failure = classifyAuthFailure(error)
    if (failure === 'unauthorized') {
      throw redirect({ to: '/login', search: { redirect: returnTo } })
    }
    if (failure === 'forbidden') {
      throw redirect({ to: '/account' })
    }
    throw error
  }
}
