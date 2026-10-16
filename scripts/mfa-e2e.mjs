/**
 * Optional local Supabase MFA smoke test.
 * Requires: supabase start, .env.local with service role, otplib installed.
 *
 * Usage: node scripts/mfa-e2e.mjs
 */
import { createClient } from '@supabase/supabase-js'
import { authenticator } from 'otplib'

const url = process.env.VITE_SUPABASE_URL ?? process.env.SUPABASE_URL
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
const anonKey =
  process.env.VITE_SUPABASE_PUBLISHABLE_KEY ??
  process.env.VITE_SUPABASE_ANON_KEY
const email = process.env.MFA_E2E_EMAIL ?? 'mfa-e2e@example.com'
const password = process.env.MFA_E2E_PASSWORD ?? 'password12345'

if (!url || !serviceKey || !anonKey) {
  console.error(
    'Set VITE_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, and publishable key.',
  )
  process.exit(1)
}

const admin = createClient(url, serviceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
})

async function ensureUser() {
  const { data: listed } = await admin.auth.admin.listUsers({ perPage: 200 })
  const existing = listed?.users?.find((u) => u.email === email)
  if (existing) {
    await admin.auth.admin.updateUserById(existing.id, { password })
    return existing.id
  }
  const { data, error } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  })
  if (error) {
    throw error
  }
  return data.user.id
}

async function main() {
  await ensureUser()
  const client = createClient(url, anonKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  })

  const { error: signInError } = await client.auth.signInWithPassword({
    email,
    password,
  })
  if (signInError) {
    throw signInError
  }

  const { data: enroll, error: enrollError } = await client.auth.mfa.enroll({
    factorType: 'totp',
    friendlyName: 'e2e',
  })
  if (enrollError) {
    throw enrollError
  }

  const secret = enroll.totp?.secret
  if (!secret) {
    throw new Error('No TOTP secret returned')
  }

  const { data: challenge, error: challengeError } =
    await client.auth.mfa.challenge({ factorId: enroll.id })
  if (challengeError) {
    throw challengeError
  }

  const code = authenticator.generate(secret)
  const { error: verifyError } = await client.auth.mfa.verify({
    factorId: enroll.id,
    challengeId: challenge.id,
    code,
  })
  if (verifyError) {
    throw verifyError
  }

  await client.auth.signOut()

  const { error: signIn2Error } = await client.auth.signInWithPassword({
    email,
    password,
  })
  if (signIn2Error) {
    throw signIn2Error
  }

  const { data: factors } = await client.auth.mfa.listFactors()
  const verified = factors?.totp?.find((f) => f.status === 'verified')
  if (!verified) {
    throw new Error('No verified factor after enroll')
  }

  const { data: challenge2, error: challenge2Error } =
    await client.auth.mfa.challenge({ factorId: verified.id })
  if (challenge2Error) {
    throw challenge2Error
  }

  const code2 = authenticator.generate(secret)
  const { error: verify2Error } = await client.auth.mfa.verify({
    factorId: verified.id,
    challengeId: challenge2.id,
    code: code2,
  })
  if (verify2Error) {
    throw verify2Error
  }

  const { data: aal } = await client.auth.mfa.getAuthenticatorAssuranceLevel()
  if (aal?.currentLevel !== 'aal2') {
    throw new Error(`Expected aal2, got ${aal?.currentLevel}`)
  }

  console.log('MFA e2e passed')
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
