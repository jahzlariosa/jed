import '@tanstack/react-start/server-only'

import { getServerSupabaseConfig } from '#/lib/supabase/env'

type JwksKey = { kty?: string; alg?: string }

let asymmetricJwks: boolean | null = null
let probePromise: Promise<boolean> | null = null

async function probeJwks(): Promise<boolean> {
  let base: string
  try {
    base = getServerSupabaseConfig().url
  } catch {
    return false
  }
  try {
    const response = await fetch(`${base}/auth/v1/.well-known/jwks.json`, {
      headers: { Accept: 'application/json' },
    })
    if (!response.ok) {
      return false
    }
    const json = (await response.json()) as { keys?: JwksKey[] }
    const keys = json.keys ?? []
    return keys.some(
      (key) =>
        key.kty === 'RSA' ||
        key.kty === 'EC' ||
        (typeof key.alg === 'string' &&
          (key.alg.startsWith('ES') || key.alg.startsWith('RS'))),
    )
  } catch (error) {
    console.error(error)
    return false
  }
}

/** True when the project publishes asymmetric signing keys (local JWT verify via getClaims). */
export async function usesAsymmetricAuthJwks(): Promise<boolean> {
  if (asymmetricJwks !== null) {
    return asymmetricJwks
  }
  probePromise ??= probeJwks().then((value) => {
    asymmetricJwks = value
    return value
  })
  return probePromise
}
