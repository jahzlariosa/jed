import { afterEach, describe, expect, it } from 'vitest'

import { createServiceRoleClient } from './service-role.server'

const secretKey = 'sb_secret_test-value'

function restore(name: string, value: string | undefined) {
  if (value === undefined) delete process.env[name]
  else process.env[name] = value
}

describe('createServiceRoleClient', () => {
  const previous = {
    secret: process.env.SUPABASE_SECRET_KEY,
    url: process.env.VITE_SUPABASE_URL,
    publishable: process.env.VITE_SUPABASE_PUBLISHABLE_KEY,
    legacy: process.env.SUPABASE_SERVICE_ROLE_KEY,
  }

  afterEach(() => {
    restore('SUPABASE_SECRET_KEY', previous.secret)
    restore('VITE_SUPABASE_URL', previous.url)
    restore('VITE_SUPABASE_PUBLISHABLE_KEY', previous.publishable)
    restore('SUPABASE_SERVICE_ROLE_KEY', previous.legacy)
  })

  it('fails closed without echoing a legacy JWT or the old env var', () => {
    const legacyJwt = 'eyJhbGciOiJIUzI1NiJ9.payload.signature'
    process.env.SUPABASE_SECRET_KEY = legacyJwt
    process.env.SUPABASE_SERVICE_ROLE_KEY = secretKey
    expect(() => createServiceRoleClient()).toThrow(
      'SUPABASE_SECRET_KEY is not configured',
    )
    try {
      createServiceRoleClient()
    } catch (error) {
      const message = error instanceof Error ? error.message : ''
      expect(message).not.toContain(legacyJwt)
      expect(message).not.toContain(secretKey)
    }
  })

  it('sends the secret key as apikey only', async () => {
    process.env.SUPABASE_SECRET_KEY = secretKey
    process.env.VITE_SUPABASE_URL = 'https://example.supabase.co'
    process.env.VITE_SUPABASE_PUBLISHABLE_KEY = 'sb_publishable_test'
    const seen: Array<{ authorization: string | null; apikey: string | null }> =
      []
    const original = globalThis.fetch
    globalThis.fetch = (async (_input, init) => {
      const headers = new Headers(init?.headers)
      seen.push({
        authorization: headers.get('authorization'),
        apikey: headers.get('apikey'),
      })
      return new Response('[]', {
        status: 200,
        headers: { 'content-type': 'application/json' },
      })
    }) as typeof fetch
    try {
      const client = createServiceRoleClient()
      await client.from('site_settings').select('id').limit(1)
    } finally {
      globalThis.fetch = original
    }
    expect(seen.length).toBeGreaterThan(0)
    for (const call of seen) {
      expect(call.apikey).toBe(secretKey)
      expect(call.authorization).toBeNull()
    }
  })
})
