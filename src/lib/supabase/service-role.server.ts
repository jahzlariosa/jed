import '@tanstack/react-start/server-only'

import { createClient as createSupabaseClient } from '@supabase/supabase-js'

import type { Database } from './database.types'
import { getServerSupabaseConfig } from './env'
import { isSecretApiKey, secretKeyFetch } from './secret-key-fetch'

const MISSING_SECRET_KEY = 'SUPABASE_SECRET_KEY is not configured'

/**
 * Privileged Supabase client. The secret key authenticates as the
 * Postgres `service_role` role and bypasses RLS. Callers must already
 * have checked the session user's permission.
 */
export function createServiceRoleClient() {
  const key = process.env.SUPABASE_SECRET_KEY?.trim() ?? ''
  if (!isSecretApiKey(key)) {
    throw new Error(MISSING_SECRET_KEY)
  }
  const { url } = getServerSupabaseConfig()
  return createSupabaseClient<Database>(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: { fetch: secretKeyFetch(key) },
  })
}
