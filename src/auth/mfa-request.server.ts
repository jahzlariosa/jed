import '@tanstack/react-start/server-only'

import { getRequest } from '@tanstack/react-start/server'

import {
  loadMfaSiteSettings,
  readMfaSessionState,
  type MfaSessionState,
} from '#/auth/mfa-policy.server'
import type { MfaSiteSettings } from '#/auth/mfa-policy'
import type { RequestSupabase } from '#/auth/session.server'
import { getRequestClient } from '#/auth/session.server'

const siteSettingsByRequest = new WeakMap<Request, Promise<MfaSiteSettings>>()
const sessionStateByRequest = new WeakMap<Request, Promise<MfaSessionState>>()

export function getRequestMfaSiteSettings(): Promise<MfaSiteSettings> {
  const request = getRequest()
  let pending = siteSettingsByRequest.get(request)
  if (!pending) {
    pending = loadMfaSiteSettings(getRequestClient())
    siteSettingsByRequest.set(request, pending)
  }
  return pending
}

export function getRequestMfaSessionState(
  client?: RequestSupabase,
): Promise<MfaSessionState> {
  const request = getRequest()
  let pending = sessionStateByRequest.get(request)
  if (!pending) {
    const supabase = client ?? getRequestClient()
    pending = readMfaSessionState(supabase)
    sessionStateByRequest.set(request, pending)
  }
  return pending
}
