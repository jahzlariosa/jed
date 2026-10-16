import '@tanstack/react-start/server-only'

import { createHmac } from 'node:crypto'

import type { SupabaseClient } from '@supabase/supabase-js'

import type { Database } from '#/lib/supabase/database.types'

export const CONTACT_LIMIT_PER_HOUR = 5
export const CONTACT_RATE_LIMIT_ERROR =
  'Too many messages. Please wait a few minutes and try again.'
export const CONTACT_GENERIC_ERROR = 'Something went wrong. Please try again.'

export type ContactInput = {
  name: string
  email: string
  message: string
  company: string
}

export type ContactResendConfig = {
  apiKey: string
  from: string
}

export type ContactSubmitContext = {
  supabase: SupabaseClient<Database>
  ipHash: string
  userAgent: string | null
  contactEmail: string | null
  resend: ContactResendConfig | null
  fetchImpl?: typeof fetch
  now?: Date
}

export type ContactSubmitResult =
  | { ok: true; emailed: boolean }
  | { error: string }

export const CONTACT_EMAIL_PATTERN =
  /^[A-Za-z0-9._+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/
export const CONTACT_UNKNOWN_IP = 'unknown'
export const CONTACT_IP_SECRET_MISSING =
  'CONTACT_IP_HASH_SECRET is not set. Add it to the server environment.'
const DEV_CONTACT_IP_SECRET = 'dev-only-contact-ip-hash-secret'

type HeaderSource = { get(name: string): string | null }

/** Client IP from platform headers only. The raw x-forwarded-for chain is caller controlled. */
export function resolveContactIp(headers: HeaderSource): string {
  const vercel = headers.get('x-vercel-forwarded-for')?.split(',')[0]?.trim()
  if (vercel) {
    return vercel
  }
  const real = headers.get('x-real-ip')?.trim()
  if (real) {
    return real
  }
  return CONTACT_UNKNOWN_IP
}

export function resolveContactIpHashSecret(
  env: Record<string, string | undefined> = process.env,
): string {
  const secret = env.CONTACT_IP_HASH_SECRET?.trim()
  if (secret) {
    return secret
  }
  if (env.NODE_ENV === 'production') {
    throw new Error(CONTACT_IP_SECRET_MISSING)
  }
  return DEV_CONTACT_IP_SECRET
}

/** Removes CR, LF and other control characters so text is safe in email headers. */
export function stripControlChars(value: string): string {
  return (
    value
      // biome-ignore lint/suspicious/noControlCharactersInRegex: matching control characters is the point
      .replace(/[\u0000-\u001F\u007F]+/g, ' ')
      .replace(/\s{2,}/g, ' ')
      .trim()
  )
}

export function hashContactIp(ip: string, secret: string): string {
  return createHmac('sha256', secret).update(ip).digest('hex')
}

export function resolveContactResendConfig(
  env: Record<string, string | undefined> = process.env,
): ContactResendConfig | null {
  const apiKey = env.RESEND_API_KEY?.trim()
  const from = env.CONTACT_FROM_EMAIL?.trim()
  if (!apiKey || !from) {
    return null
  }
  return { apiKey, from }
}

export async function submitContactMessage(
  input: ContactInput,
  ctx: ContactSubmitContext,
): Promise<ContactSubmitResult> {
  if (input.company.length > 0) {
    return { ok: true, emailed: false }
  }
  if (!input.name || !input.message || !input.email) {
    return { error: 'Please fill in all fields.' }
  }

  {
    const since = new Date(
      (ctx.now ?? new Date()).getTime() - 60 * 60 * 1000,
    ).toISOString()
    const { count, error } = await ctx.supabase
      .from('contact_messages')
      .select('id', { count: 'exact', head: true })
      .eq('ip_hash', ctx.ipHash)
      .gte('created_at', since)
    if (error) {
      console.error('contact rate check failed', { code: error.code })
      return { error: CONTACT_GENERIC_ERROR }
    }
    if ((count ?? 0) >= CONTACT_LIMIT_PER_HOUR) {
      return { error: CONTACT_RATE_LIMIT_ERROR }
    }
  }

  const { error: insertError } = await ctx.supabase
    .from('contact_messages')
    .insert({
      name: input.name,
      email: input.email,
      message: input.message,
      ip_hash: ctx.ipHash,
      user_agent: ctx.userAgent?.slice(0, 500) ?? null,
    })
  if (insertError) {
    console.error('contact insert failed', { code: insertError.code })
    return { error: CONTACT_GENERIC_ERROR }
  }

  let emailed = false
  if (ctx.resend && ctx.contactEmail) {
    emailed = await sendContactEmail(input, ctx.contactEmail, ctx.resend, ctx)
  }
  return { ok: true, emailed }
}

async function sendContactEmail(
  input: ContactInput,
  to: string,
  resend: ContactResendConfig,
  ctx: ContactSubmitContext,
): Promise<boolean> {
  const doFetch = ctx.fetchImpl ?? fetch
  try {
    const response = await doFetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${resend.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: resend.from,
        to: [to],
        reply_to: input.email,
        subject: `New message from ${stripControlChars(input.name)}`,
        text: `Name: ${stripControlChars(input.name)}\nEmail: ${input.email}\n\n${input.message}`,
      }),
    })
    if (!response.ok) {
      console.error('contact email failed', { status: response.status })
      return false
    }
    return true
  } catch {
    console.error('contact email failed', { status: 'network' })
    return false
  }
}
