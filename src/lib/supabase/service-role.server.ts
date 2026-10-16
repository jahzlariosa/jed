import '@tanstack/react-start/server-only'

import { createClient as createSupabaseClient } from '@supabase/supabase-js'

import type { Database } from './database.types'
import { getServerSupabaseConfig } from './env'

export function createServiceRoleClient() {
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!key?.trim()) {
    throw new Error('SUPABASE_SERVICE_ROLE_KEY is not configured')
  }
  const { url } = getServerSupabaseConfig()
  return createSupabaseClient<Database>(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  })
}
