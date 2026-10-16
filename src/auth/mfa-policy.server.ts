import '@tanstack/react-start/server-only'

import { createClient } from '#/lib/supabase/server'

import {
  type MfaAalLevel,
  type MfaSiteSettings,
  parseMfaPolicy,
} from './mfa-policy'

const DEFAULTS: MfaSiteSettings = {
  mfaEnabled: true,
  mfaPolicy: 'optional',
}

export async function loadMfaSiteSettings(
  supabase: ReturnType<typeof createClient> = createClient(),
): Promise<MfaSiteSettings> {
  const { data, error } = await supabase.rpc('get_site_mfa_settings')
  if (error) {
    console.error('loadMfaSiteSettings rpc', error)
    return DEFAULTS
  }
  const row = Array.isArray(data) ? data[0] : data
  if (!row) {
    return DEFAULTS
  }
  return {
    mfaEnabled: row.mfa_enabled !== false,
    mfaPolicy: parseMfaPolicy(row.mfa_policy),
  }
}

export type MfaSessionState = {
  aal: MfaAalLevel | null
  hasVerifiedFactor: boolean
  verifiedFactorId: string | null
  pendingFactorIds: string[]
}

export async function readMfaSessionState(
  supabase: ReturnType<typeof createClient>,
): Promise<MfaSessionState> {
  const [
    { data: aalData, error: aalError },
    { data: factors, error: factorsError },
  ] = await Promise.all([
    supabase.auth.mfa.getAuthenticatorAssuranceLevel(),
    supabase.auth.mfa.listFactors(),
  ])

  if (aalError) {
    console.error(aalError)
  }
  if (factorsError) {
    console.error(factorsError)
  }

  const verified = (factors?.totp ?? []).filter((f) => f.status === 'verified')
  const pending = (factors?.totp ?? []).filter((f) => f.status !== 'verified')

  const current = aalData?.currentLevel
  const aal: MfaAalLevel | null =
    current === 'aal2' ? 'aal2' : current === 'aal1' ? 'aal1' : null

  return {
    aal,
    hasVerifiedFactor: verified.length > 0,
    verifiedFactorId: verified[0]?.id ?? null,
    pendingFactorIds: pending.map((f) => f.id),
  }
}

export async function cleanupPendingMfaFactors(
  supabase: ReturnType<typeof createClient>,
  pendingIds: string[],
) {
  for (const factorId of pendingIds) {
    const { error } = await supabase.auth.mfa.unenroll({ factorId })
    if (error) {
      console.error('cleanup pending mfa factor', factorId, error)
    }
  }
}
