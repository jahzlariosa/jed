import { describe, expect, it } from 'vitest'

import { isSecretApiKey, secretKeyFetch } from './secret-key-fetch'

const secretKey = 'sb_secret_test-value'

describe('isSecretApiKey', () => {
  it('accepts a secret key and rejects a legacy JWT', () => {
    expect(isSecretApiKey(secretKey)).toBe(true)
    expect(isSecretApiKey('eyJhbGciOiJIUzI1NiJ9.payload.sig')).toBe(false)
    expect(isSecretApiKey('sb_publishable_test')).toBe(false)
  })
})

describe('secretKeyFetch', () => {
  it('sends the secret key as apikey and drops it from Authorization', async () => {
    let authorization: string | null = 'unset'
    let apikey: string | null = null
    const wrapped = secretKeyFetch(secretKey, async (_input, init) => {
      const headers = new Headers(init?.headers)
      authorization = headers.get('authorization')
      apikey = headers.get('apikey')
      return new Response('{}', { status: 200 })
    })
    await wrapped('https://example.supabase.co/auth/v1/admin/users', {
      headers: {
        Authorization: `Bearer ${secretKey}`,
        apikey: secretKey,
      },
    })
    expect(apikey).toBe(secretKey)
    expect(authorization).toBeNull()
  })

  it('keeps a different bearer token', async () => {
    const userJwt = 'eyJhbGciOiJIUzI1NiJ9.user.sig'
    let authorization: string | null = null
    const wrapped = secretKeyFetch(secretKey, async (_input, init) => {
      authorization = new Headers(init?.headers).get('authorization')
      return new Response('{}', { status: 200 })
    })
    await wrapped('https://example.supabase.co/rest/v1/profiles', {
      headers: { Authorization: `Bearer ${userJwt}` },
    })
    expect(authorization).toBe(`Bearer ${userJwt}`)
  })
})
