import { createServerFn } from '@tanstack/react-start'
import { getRequest } from '@tanstack/react-start/server'

import { markPrivateNoStore } from '#/auth/session.server'
import {
  CONTACT_EMAIL_PATTERN,
  CONTACT_GENERIC_ERROR,
  CONTACT_RATE_LIMIT_ERROR,
  hashContactIp,
  resolveContactIp,
  resolveContactIpHashSecret,
  stripControlChars,
  resolveContactResendConfig,
  submitContactMessage,
} from '#/lib/cms/contact-submit.server'
import { loadPublicMarketing } from '#/lib/cms/public-marketing.server'
import { assertRateLimit } from '#/lib/rate-limit.server'
import { createServiceRoleClient } from '#/lib/supabase/service-role.server'

const MAX_NAME = 120
const MAX_EMAIL = 255
const MAX_MESSAGE = 4000

export function parseContactInput(input: unknown) {
  if (typeof input !== 'object' || input === null) {
    throw new Error('Unable to send message')
  }
  const raw = input as Record<string, unknown>
  const email = String(raw.email ?? '')
    .trim()
    .toLowerCase()
    .slice(0, MAX_EMAIL)
  return {
    name: stripControlChars(String(raw.name ?? '')).slice(0, MAX_NAME),
    email: CONTACT_EMAIL_PATTERN.test(email) ? email : '',
    message: String(raw.message ?? '')
      .trim()
      .slice(0, MAX_MESSAGE),
    company: String(raw.company ?? '')
      .trim()
      .slice(0, 200),
  }
}

export const submitContactMessageFn = createServerFn({ method: 'POST' })
  .validator(parseContactInput)
  .handler(async ({ data }) => {
    markPrivateNoStore()
    try {
      assertRateLimit('contact:submit', 8, 15 * 60 * 1000)
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
