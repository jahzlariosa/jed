const SECRET_KEY_PREFIX = 'sb_secret_'

/** True for Supabase secret API keys. These are not JWTs. */
export function isSecretApiKey(value: string): boolean {
  return value.startsWith(SECRET_KEY_PREFIX)
}

function authorizationCarriesKey(
  authorization: string,
  secretKey: string,
): boolean {
  if (authorization === secretKey) return true
  const match = /^Bearer\s+(\S+)\s*$/i.exec(authorization)
  return match?.[1] === secretKey
}

/**
 * Fetch wrapper for a server-side secret key.
 * `@supabase/supabase-js` 2.118.0 still copies the key into `Authorization`.
 * Secret keys are not JWTs, so that copy is removed and the key is sent as `apikey` only.
 */
export function secretKeyFetch(
  secretKey: string,
  baseFetch: typeof fetch = fetch,
): typeof fetch {
  return (input, init) => {
    const headers = new Headers(init?.headers)
    headers.set('apikey', secretKey)
    const authorization = headers.get('authorization')
    if (authorization && authorizationCarriesKey(authorization, secretKey)) {
      headers.delete('authorization')
    }
    return baseFetch(input, { ...init, headers })
  }
}
