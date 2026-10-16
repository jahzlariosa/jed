import { safeInternalPath } from './path'

/**
 * Path the login page assigns with `location.replace` after password or MFA
 * sign-in. The server already resolved it; this rejects anything that is not
 * a same-origin path before it touches the address bar.
 */
export function signInDocumentHref(href: string | undefined): string | null {
  if (!href) {
    return null
  }
  return safeInternalPath(href, null)
}
