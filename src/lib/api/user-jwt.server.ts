import '@tanstack/react-start/server-only'

import { SignJWT } from 'jose'

import { usesAsymmetricAuthJwks } from '#/auth/jwks-capability.server'
import { getServerSupabaseConfig } from '#/lib/supabase/env'

const JWT_TTL_SECONDS = 5 * 60

export type UserJwtMintCapability =
  | { ok: true }
  | { ok: false; reason: 'missing_secret' | 'asymmetric_only' }

export async function getUserJwtMintCapability(): Promise<UserJwtMintCapability> {
  const secret = process.env.SUPABASE_JWT_SECRET?.trim()
  if (secret) {
    return { ok: true }
  }
  if (await usesAsymmetricAuthJwks()) {
    return { ok: false, reason: 'asymmetric_only' }
  }
  return { ok: false, reason: 'missing_secret' }
}

export async function mintUserAccessJwt(userId: string): Promise<string> {
  const capability = await getUserJwtMintCapability()
  if (!capability.ok) {
    throw new Error(
      'API token auth is not configured for this Supabase project',
    )
  }
  const secret = process.env.SUPABASE_JWT_SECRET?.trim()
  if (!secret) {
    throw new Error('SUPABASE_JWT_SECRET is not configured')
  }
  const { url } = getServerSupabaseConfig()
  const issuer = `${url.replace(/\/$/, '')}/auth/v1`
  const now = Math.floor(Date.now() / 1000)
  return new SignJWT({
    role: 'authenticated',
    aud: 'authenticated',
  })
    .setProtectedHeader({ alg: 'HS256', typ: 'JWT' })
    .setSubject(userId)
    .setIssuer(issuer)
    .setIssuedAt(now)
    .setExpirationTime(now + JWT_TTL_SECONDS)
    .sign(new TextEncoder().encode(secret))
}
