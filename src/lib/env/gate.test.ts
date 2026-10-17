import { describe, expect, it } from 'vitest'

import { SETUP_CACHE_HEADERS, shouldRedirectToSetup } from './gate'
import { loadSetupStatus } from './setup-check'

describe('shouldRedirectToSetup', () => {
  it('redirects other dev routes when setup is incomplete', () => {
    expect(
      shouldRedirectToSetup({ dev: true, pathname: '/login', ok: false }),
    ).toBe(true)
    expect(
      shouldRedirectToSetup({ dev: true, pathname: '/setup/', ok: false }),
    ).toBe(false)
    expect(shouldRedirectToSetup({ dev: true, pathname: '/', ok: true })).toBe(
      false,
    )
    expect(
      shouldRedirectToSetup({ dev: false, pathname: '/', ok: false }),
    ).toBe(false)
  })
})

describe('SETUP_CACHE_HEADERS', () => {
  it('keeps setup responses private', () => {
    expect(SETUP_CACHE_HEADERS['Cache-Control']).toBe('private, no-store')
  })
})

describe('loadSetupStatus', () => {
  const env = {
    NODE_ENV: 'development',
    VITE_SUPABASE_URL: 'https://abc.supabase.co',
    VITE_SUPABASE_PUBLISHABLE_KEY: 'publishable-secret',
    APP_URL: 'http://localhost:3000',
    SUPABASE_SERVICE_ROLE_KEY: 'service-role-secret',
    SUPABASE_JWT_SECRET: 'jwt-secret',
    MEDIA_UPLOAD_TICKET_SECRET: 'm'.repeat(32),
    CONTACT_IP_HASH_SECRET: 'c'.repeat(32),
  }

  it('stays quiet in production', async () => {
    const status = await loadSetupStatus({
      ...env,
      NODE_ENV: 'production',
      APP_URL: 'https://example.com',
    })
    expect(status).toEqual({ ok: true, items: [] })
  })

  it('reports a rejected key without the key value', async () => {
    const status = await loadSetupStatus(env, async () => ({
      reachable: true,
      keyAccepted: false,
    }))
    expect(status.ok).toBe(false)
    expect(status.items.map((item) => item.name)).toContain(
      'VITE_SUPABASE_PUBLISHABLE_KEY',
    )
    expect(JSON.stringify(status)).not.toContain('publishable-secret')
    expect(JSON.stringify(status)).not.toContain('service-role-secret')
  })
})
