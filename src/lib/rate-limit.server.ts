import '@tanstack/react-start/server-only'

import { getRequest } from '@tanstack/react-start/server'

import { resolveContactIp } from '#/lib/cms/contact-submit.server'
import { createServiceRoleClient } from '#/lib/supabase/service-role.server'

function clientKey(action: string): string {
  const request = getRequest()
  return `${action}:${resolveContactIp(request.headers)}`
}

export async function assertRateLimit(
  action: string,
  limit: number,
  windowMs: number,
): Promise<void> {
  const key = clientKey(action)
  const windowSeconds = Math.max(1, Math.ceil(windowMs / 1000))

  try {
    const supabase = createServiceRoleClient()
    const { data, error } = await supabase.rpc('consume_rate_limit_bucket', {
      p_bucket_key: key,
      p_max_hits: limit,
      p_window_seconds: windowSeconds,
    })

    if (error) {
      console.error(error)
      throw new Error('RATE_LIMITED')
    }

    if (data !== true) {
      throw new Error('RATE_LIMITED')
    }
  } catch (error) {
    if (error instanceof Error && error.message === 'RATE_LIMITED') {
      throw error
    }
    console.error(error)
    throw new Error('RATE_LIMITED')
  }
}

export const RATE_LIMIT_MESSAGE =
  'Too many attempts. Please wait a few minutes and try again.'
