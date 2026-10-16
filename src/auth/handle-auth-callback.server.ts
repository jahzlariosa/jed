import '@tanstack/react-start/server-only'

import { setResponseHeader } from '@tanstack/react-start/server'

import { createClient } from '#/lib/supabase/server'

import { clearRequestAuth, getAccessWithClient } from './session.server'
import { defaultAuthNext } from './callback-search'
import { resolveAuthRedirect, signedInLandingPath } from './redirect'
import { safeInternalPath } from './path'

function redirectResponse(location: string) {
  return new Response(null, {
    status: 302,
    headers: {
      Location: location,
      'Cache-Control': 'private, no-store',
    },
  })
}

export async function handleAuthCallbackGet(request: Request) {
  setResponseHeader('cache-control', 'private, no-store')
  const url = new URL(request.url)
  const code = url.searchParams.get('code')
  const authError = url.searchParams.get('error')
  const nextRaw = url.searchParams.get('next')
  const type = url.searchParams.get('type')
  const parsedNext = nextRaw ? safeInternalPath(nextRaw, null) : null
  const next =
    parsedNext ??
    defaultAuthNext({
      type,
      next: nextRaw,
    })

  if (authError) {
    console.error(
      'auth callback error',
      authError,
      url.searchParams.get('error_description'),
    )
    if (next === '/reset-password') {
      return redirectResponse('/forgot-password?reason=link_expired')
    }
    return redirectResponse('/login?reason=sign_in_failed')
  }

  if (!code) {
    return redirectResponse('/login')
  }

  const supabase = createClient()
  const { error } = await supabase.auth.exchangeCodeForSession(code)
  if (error) {
    console.error('exchangeCodeForSession failed', error.message)
    if (next === '/reset-password') {
      return redirectResponse('/forgot-password?reason=link_expired')
    }
    return redirectResponse('/login?reason=sign_in_failed')
  }

  clearRequestAuth()

  const { data: userData } = await supabase.auth.getUser()
  const user = userData.user
  let destination = resolveAuthRedirect(nextRaw, next)
  const explicitNext = nextRaw ? safeInternalPath(nextRaw, null) : null
  if (user && (!explicitNext || next === '')) {
    const access = await getAccessWithClient(user.id, supabase)
    destination = await signedInLandingPath(access)
  } else if (user && explicitNext) {
    const access = await getAccessWithClient(user.id, supabase)
    const fallback = await signedInLandingPath(access)
    destination = resolveAuthRedirect(explicitNext, fallback)
  }

  return redirectResponse(destination)
}
