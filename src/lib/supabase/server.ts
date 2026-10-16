import '@tanstack/react-start/server-only'
import { createServerClient } from '@supabase/ssr'
import {
  getCookies,
  setCookie,
  setResponseHeader,
} from '@tanstack/react-start/server'

import type { Database } from './database.types'
import { authCookieOptionsForRequest } from './auth-cookie.server'
import { getServerSupabaseConfig } from './env'

export function createClient() {
  const { url, publishableKey } = getServerSupabaseConfig()

  return createServerClient<Database>(url, publishableKey, {
    cookieOptions: authCookieOptionsForRequest(),
    cookies: {
      getAll() {
        return Object.entries(getCookies()).map(([name, value]) => ({
          name,
          value,
        }))
      },
      setAll(cookies, headers) {
        cookies.forEach(({ name, value, options }) => {
          setCookie(name, value, options)
        })

        Object.entries(headers).forEach(([name, value]) => {
          setResponseHeader(name, value)
        })
      },
    },
  })
}

/** Never throws — logs config/client errors so public/auth SSR can degrade safely. */
export function tryCreateClient() {
  try {
    return createClient()
  } catch (error) {
    console.error(error)
    return null
  }
}

/** Alias used by ported CMS modules. */
export const createSupabaseServerClient = createClient
