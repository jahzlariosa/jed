import '@tanstack/react-start/server-only'

import { createClient } from '@supabase/supabase-js'

import type { Database } from '#/lib/supabase/database.types'
import { getServerSupabaseConfig } from '#/lib/supabase/env'

/** RLS-backed reads without reading or writing auth cookies (safe for edge-cacheable SSR). */
export function createSupabaseAnonReadClient() {
  const { url, publishableKey } = getServerSupabaseConfig()
  return createClient<Database>(url, publishableKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  })
}
