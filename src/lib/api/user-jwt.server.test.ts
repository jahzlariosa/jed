import { describe, expect, it, vi } from 'vitest'

import { getUserJwtMintCapability } from './user-jwt.server'

vi.mock('#/auth/jwks-capability.server', () => ({
  usesAsymmetricAuthJwks: vi.fn(async () => false),
}))

describe('getUserJwtMintCapability', () => {
  it('requires secret when JWKS is absent', async () => {
    const prev = process.env.SUPABASE_JWT_SECRET
    delete process.env.SUPABASE_JWT_SECRET
    await expect(getUserJwtMintCapability()).resolves.toEqual({
      ok: false,
      reason: 'missing_secret',
    })
    process.env.SUPABASE_JWT_SECRET = prev
  })

  it('allows mint when secret is set', async () => {
    process.env.SUPABASE_JWT_SECRET = 'test-jwt-secret-for-unit-test'
    await expect(getUserJwtMintCapability()).resolves.toEqual({ ok: true })
  })
})
