import '@tanstack/react-start/server-only'
import { getRequest } from '@tanstack/react-start/server'

/** Per-request preference for auth cookie lifetime (session vs persistent). */
const persistSessionByRequest = new WeakMap<Request, boolean>()

const PERSISTENT_MAX_AGE_SEC = 60 * 60 * 24 * 400

export function setAuthSessionPersistence(persist: boolean) {
  persistSessionByRequest.set(getRequest(), persist)
}

export function authCookieOptionsForRequest(): {
  maxAge?: number
  sameSite: 'lax'
  secure: boolean
} {
  const persist = persistSessionByRequest.get(getRequest()) ?? true
  const secure = process.env.NODE_ENV === 'production'
  if (!persist) {
    return { sameSite: 'lax', secure }
  }
  return { maxAge: PERSISTENT_MAX_AGE_SEC, sameSite: 'lax', secure }
}
