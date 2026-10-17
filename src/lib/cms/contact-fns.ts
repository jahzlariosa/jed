import { createServerFn } from '@tanstack/react-start'
import { getRequest } from '@tanstack/react-start/server'

import { markPrivateNoStore } from '#/auth/session.server'
import { parseContactInput } from '#/lib/cms/contact-input'
import {
  CONTACT_GENERIC_ERROR,
  CONTACT_RATE_LIMIT_ERROR,
  hashContactIp,
  resolveContactIp,
  resolveContactIpHashSecret,
  resolveContactResendConfig,
  submitContactMessage,
} from '#/lib/cms/contact-submit.server'
import { loadPublicMarketing } from '#/lib/cms/public-marketing.server'
import { assertRateLimit } from '#/lib/rate-limit.server'
import { createServiceRoleClient } from '#/lib/supabase/service-role.server'

export const submitContactMessageFn = createServerFn({ method: 'POST' })
  .validator(parseContactInput)
  .handler(async ({ data }) => {
    markPrivateNoStore()
    try {
      await assertRateLimit('contact:submit', 8, 15 * 60 * 1000)
    } catch {
      return { error: CONTACT_RATE_LIMIT_ERROR }
    }
    const request = getRequest()
    let secret: string
    try {
      secret = resolveContactIpHashSecret()
    } catch (error) {
      console.error((error as Error).message)
      return { error: CONTACT_GENERIC_ERROR }
    }
    const ip = resolveContactIp(request.headers)
    const marketing = await loadPublicMarketing()
    return submitContactMessage(data, {
      supabase: createServiceRoleClient(),
      ipHash: hashContactIp(ip, secret),
      userAgent: request.headers.get('user-agent'),
      contactEmail: marketing.contactEmail?.includes('@')
        ? marketing.contactEmail.trim()
        : null,
      resend: resolveContactResendConfig(),
    })
  })
