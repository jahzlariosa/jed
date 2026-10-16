import { describe, expect, it, vi } from 'vitest'

import {
  CONTACT_GENERIC_ERROR,
  CONTACT_IP_SECRET_MISSING,
  CONTACT_UNKNOWN_IP,
  CONTACT_LIMIT_PER_HOUR,
  CONTACT_RATE_LIMIT_ERROR,
  hashContactIp,
  resolveContactIp,
  resolveContactIpHashSecret,
  resolveContactResendConfig,
  submitContactMessage,
  type ContactSubmitContext,
} from '#/lib/cms/contact-submit.server'
import {
  CONTACT_EMAIL_PATTERN,
  stripControlChars,
} from '#/lib/cms/contact-input'

const INPUT = {
  name: 'Ana',
  email: 'ana@example.com',
  message: 'Hello there',
  company: '',
}

function fakeSupabase({
  count = 0,
  countError = null,
  insertError = null,
}: {
  count?: number
  countError?: { code: string } | null
  insertError?: { code: string } | null
} = {}) {
  const insert = vi.fn().mockResolvedValue({ error: insertError })
  const gte = vi.fn().mockResolvedValue({ count, error: countError })
  const eq = vi.fn().mockReturnValue({ gte })
  const select = vi.fn().mockReturnValue({ eq })
  const from = vi.fn().mockReturnValue({ select, insert })
  return { client: { from }, from, insert, select, eq }
}

function ctx(
  supabase: ReturnType<typeof fakeSupabase>,
  extra: Partial<ContactSubmitContext> = {},
): ContactSubmitContext {
  return {
    supabase: supabase.client as unknown as ContactSubmitContext['supabase'],
    ipHash: 'hash-1',
    userAgent: 'test-agent',
    contactEmail: null,
    resend: null,
    ...extra,
  }
}

describe('submitContactMessage', () => {
  it('saves the message to contact_messages without needing a contact email', async () => {
    const db = fakeSupabase()
    const result = await submitContactMessage(INPUT, ctx(db))
    expect(result).toEqual({ ok: true, emailed: false })
    expect(db.from).toHaveBeenCalledWith('contact_messages')
    expect(db.insert).toHaveBeenCalledWith({
      name: 'Ana',
      email: 'ana@example.com',
      message: 'Hello there',
      ip_hash: 'hash-1',
      user_agent: 'test-agent',
    })
  })

  it('drops spam trap submissions without saving', async () => {
    const db = fakeSupabase()
    const result = await submitContactMessage(
      { ...INPUT, company: 'Acme' },
      ctx(db),
    )
    expect(result).toEqual({ ok: true, emailed: false })
    expect(db.insert).not.toHaveBeenCalled()
  })

  it('rejects missing fields', async () => {
    const db = fakeSupabase()
    const result = await submitContactMessage({ ...INPUT, email: '' }, ctx(db))
    expect(result).toEqual({ error: 'Please fill in all fields.' })
    expect(db.insert).not.toHaveBeenCalled()
  })

  it('limits each hashed IP per hour', async () => {
    const db = fakeSupabase({ count: CONTACT_LIMIT_PER_HOUR })
    const result = await submitContactMessage(INPUT, ctx(db))
    expect(result).toEqual({ error: CONTACT_RATE_LIMIT_ERROR })
    expect(db.eq).toHaveBeenCalledWith('ip_hash', 'hash-1')
    expect(db.insert).not.toHaveBeenCalled()
  })

  it('returns a generic error when the insert fails', async () => {
    const db = fakeSupabase({ insertError: { code: '23514' } })
    const result = await submitContactMessage(INPUT, ctx(db))
    expect(result).toEqual({ error: CONTACT_GENERIC_ERROR })
  })

  it('emails the site contact with reply-to when Resend is configured', async () => {
    const db = fakeSupabase()
    const fetchImpl = vi.fn().mockResolvedValue({ ok: true, status: 200 })
    const result = await submitContactMessage(
      INPUT,
      ctx(db, {
        contactEmail: 'owner@example.com',
        resend: { apiKey: 'test-key', from: 'site@example.com' },
        fetchImpl: fetchImpl as unknown as typeof fetch,
      }),
    )
    expect(result).toEqual({ ok: true, emailed: true })
    const [url, init] = fetchImpl.mock.calls[0]
    expect(url).toBe('https://api.resend.com/emails')
    const body = JSON.parse(String(init.body))
    expect(body.to).toEqual(['owner@example.com'])
    expect(body.reply_to).toBe('ana@example.com')
  })

  it('still succeeds when the email step fails', async () => {
    const db = fakeSupabase()
    const fetchImpl = vi.fn().mockResolvedValue({ ok: false, status: 500 })
    const result = await submitContactMessage(
      INPUT,
      ctx(db, {
        contactEmail: 'owner@example.com',
        resend: { apiKey: 'test-key', from: 'site@example.com' },
        fetchImpl: fetchImpl as unknown as typeof fetch,
      }),
    )
    expect(result).toEqual({ ok: true, emailed: false })
  })
})

describe('contact helpers', () => {
  it('hashes IPs without exposing them', () => {
    const hash = hashContactIp('203.0.113.9', 'secret')
    expect(hash).toMatch(/^[0-9a-f]{64}$/)
    expect(hash).not.toContain('203.0.113.9')
  })

  it('only enables Resend when both env vars are set', () => {
    expect(resolveContactResendConfig({ RESEND_API_KEY: 'k' })).toBeNull()
    expect(
      resolveContactResendConfig({
        RESEND_API_KEY: 'k',
        CONTACT_FROM_EMAIL: 'site@example.com',
      }),
    ).toEqual({ apiKey: 'k', from: 'site@example.com' })
  })
})

describe('contact security helpers', () => {
  it('uses the Vercel forwarded header, then x-real-ip, and ignores x-forwarded-for', () => {
    const headers = (values: Record<string, string>) => new Headers(values)
    expect(
      resolveContactIp(
        headers({
          'x-forwarded-for': '6.6.6.6',
          'x-vercel-forwarded-for': '1.2.3.4',
          'x-real-ip': '5.5.5.5',
        }),
      ),
    ).toBe('1.2.3.4')
    expect(
      resolveContactIp(
        headers({ 'x-forwarded-for': '6.6.6.6', 'x-real-ip': '5.5.5.5' }),
      ),
    ).toBe('5.5.5.5')
    expect(resolveContactIp(headers({ 'x-forwarded-for': '6.6.6.6' }))).toBe(
      CONTACT_UNKNOWN_IP,
    )
  })

  it('still rate limits requests with no IP through the unknown bucket', async () => {
    const db = fakeSupabase({ count: CONTACT_LIMIT_PER_HOUR })
    const ipHash = hashContactIp(CONTACT_UNKNOWN_IP, 'secret')
    const result = await submitContactMessage(INPUT, ctx(db, { ipHash }))
    expect(result).toEqual({ error: CONTACT_RATE_LIMIT_ERROR })
    expect(db.eq).toHaveBeenCalledWith('ip_hash', ipHash)
    expect(db.insert).not.toHaveBeenCalled()
  })

  it('requires CONTACT_IP_HASH_SECRET in production only', () => {
    expect(() =>
      resolveContactIpHashSecret({ NODE_ENV: 'production' }),
    ).toThrow(CONTACT_IP_SECRET_MISSING)
    expect(
      resolveContactIpHashSecret({
        NODE_ENV: 'production',
        CONTACT_IP_HASH_SECRET: 'abc',
      }),
    ).toBe('abc')
    expect(resolveContactIpHashSecret({ NODE_ENV: 'development' })).toBeTruthy()
  })

  it('rejects emails carrying mailto header parameters', () => {
    expect(CONTACT_EMAIL_PATTERN.test('ana@example.com')).toBe(true)
    expect(CONTACT_EMAIL_PATTERN.test('a@b.co?bcc=evil%40x.com')).toBe(false)
    expect(CONTACT_EMAIL_PATTERN.test('a@b.co&cc=evil@x.com')).toBe(false)
  })

  it('strips CR, LF and control characters from the email subject', async () => {
    const db = fakeSupabase()
    const fetchImpl = vi.fn().mockResolvedValue({ ok: true })
    await submitContactMessage(
      { ...INPUT, name: 'Ana\r\nBcc: evil@x.com' },
      ctx(db, {
        contactEmail: 'owner@example.com',
        resend: { apiKey: 'k', from: 'site@example.com' },
        fetchImpl: fetchImpl as unknown as typeof fetch,
      }),
    )
    const body = JSON.parse(fetchImpl.mock.calls[0][1].body)
    expect(body.subject).toBe('New message from Ana Bcc: evil@x.com')
    expect(body.subject).not.toMatch(/[\r\n]/)
    expect(stripControlChars('a\u0000b\tc')).toBe('a b c')
  })
})
