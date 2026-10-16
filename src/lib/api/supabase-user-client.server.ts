import '@tanstack/react-start/server-only'

import { createClient as createSupabaseClient } from '@supabase/supabase-js'

import type { Database } from '#/lib/supabase/database.types'
import { getServerSupabaseConfig } from '#/lib/supabase/env'

import { mintUserAccessJwt } from './user-jwt.server'

export async function createUserScopedSupabaseClient(userId: string) {
  const { url, publishableKey } = getServerSupabaseConfig()
  const accessToken = await mintUserAccessJwt(userId)
  return createSupabaseClient<Database>(url, publishableKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
    global: {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    },
  })
}
