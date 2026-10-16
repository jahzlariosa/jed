const GA4 = /^G-[A-Z0-9]+$/
const GTM = /^GTM-[A-Z0-9]+$/
const VERIFICATION = /^[\w-]+$/
const PLAUSIBLE = /^[\w.-]+$/
const TWITTER = /^@[\w]{1,15}$/

export function sanitizeGa4Id(value: unknown): string | null {
  if (typeof value !== 'string') return null
  const trimmed = value.trim()
  return GA4.test(trimmed) ? trimmed : null
}

export function sanitizeGtmId(value: unknown): string | null {
  if (typeof value !== 'string') return null
  const trimmed = value.trim()
  return GTM.test(trimmed) ? trimmed : null
}

export function sanitizeVerificationCode(value: unknown): string | null {
  if (typeof value !== 'string') return null
  const trimmed = value.trim()
  if (!trimmed) return null
  return VERIFICATION.test(trimmed) ? trimmed : null
}

export function sanitizePlausibleDomain(value: unknown): string | null {
  if (typeof value !== 'string') return null
  const trimmed = value.trim()
  if (!trimmed) return null
  return PLAUSIBLE.test(trimmed) ? trimmed : null
}

export function sanitizeTwitterHandle(value: unknown): string | null {
  if (typeof value !== 'string') return null
  const trimmed = value.trim()
  if (!trimmed) return null
  const withAt = trimmed.startsWith('@') ? trimmed : `@${trimmed}`
  return TWITTER.test(withAt) ? withAt : null
}
