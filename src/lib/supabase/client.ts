/// <reference types="vite/client" />
import { createBrowserClient } from '@supabase/ssr'

import type { Database } from './database.types'
import { getBrowserSupabaseConfig } from './env'

export function createClient() {
  const { url, publishableKey } = getBrowserSupabaseConfig()
  return createBrowserClient<Database>(url, publishableKey)
}
