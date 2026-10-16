import '@tanstack/react-start/server-only'

import { setResponseHeader } from '@tanstack/react-start/server'

import type { AppShellDto } from '#/auth/app-shell.types'
import {
  getRequestMfaSessionState,
  getRequestMfaSiteSettings,
} from '#/auth/mfa-request.server'
import {
  getAccess,
  getRequestClient,
  markPrivateNoStore,
  requireUser,
} from '#/auth/session.server'
import { appendServerTiming } from '#/lib/server-timing.server'

export async function loadAppShellDto(): Promise<AppShellDto | null> {
  markPrivateNoStore()
  const started = Date.now()
  let user: Awaited<ReturnType<typeof requireUser>>
  try {
    user = await requireUser({ skipMfaCheck: true })
  } catch {
    return null
  }

  const client = getRequestClient()
  const accessStart = Date.now()
  const [access, settings, mfa] = await Promise.all([
    getAccess(user.id),
    getRequestMfaSiteSettings(),
    getRequestMfaSessionState(client),
  ])
  const accessMs = Date.now() - accessStart
  appendServerTiming(
    `app-shell;dur=${Date.now() - started}, app-shell-access;dur=${accessMs}`,
  )
  setResponseHeader('X-App-Shell', '1')
  return {
    user,
    access,
    mfa: {
      settings,
      aal: mfa.aal,
      hasVerifiedFactor: mfa.hasVerifiedFactor,
    },
  }
}
