import '@tanstack/react-start/server-only'

import { createClient } from '#/lib/supabase/server'

export type AuthRedirectSettings = {
  signInAdmin: string
  signInUser: string
  signUp: string
  passwordReset: string
  signOut: string
}

const DEFAULTS: AuthRedirectSettings = {
  signInAdmin: '/admin',
  signInUser: '/',
  signUp: '/',
  passwordReset: '/account',
  signOut: '/login',
}

async function fetchAuthRedirectRow() {
  const supabase = createClient()
  const { data, error } = await supabase.rpc('get_site_auth_redirects')
  if (error) {
    console.error('loadAuthRedirectSettings rpc', error)
    return null
  }
  const row = Array.isArray(data) ? data[0] : data
  return row ?? null
}

export async function loadAuthRedirectSettings(): Promise<AuthRedirectSettings> {
  try {
    const data = await fetchAuthRedirectRow()

    if (!data) {
      return DEFAULTS
    }

    return {
      signInAdmin:
        data.redirect_after_sign_in_admin?.trim() || DEFAULTS.signInAdmin,
      signInUser:
        data.redirect_after_sign_in_user?.trim() || DEFAULTS.signInUser,
      signUp: data.redirect_after_sign_up?.trim() || DEFAULTS.signUp,
      passwordReset:
        data.redirect_after_password_reset?.trim() || DEFAULTS.passwordReset,
      signOut: data.redirect_after_sign_out?.trim() || DEFAULTS.signOut,
    }
  } catch (error) {
    console.error(error)
    return DEFAULTS
  }
}
