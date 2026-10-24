import { describe, expect, it } from 'vitest'

import { DEFAULT_PUBLIC_SITE_NAME } from '#/lib/cms/brand-defaults'
import { totpIssuerFromSiteName } from './mfa-issuer'

describe('totpIssuerFromSiteName', () => {
  it('uses the trimmed site name', () => {
    expect(totpIssuerFromSiteName('  Jed  ')).toBe('JED')
  })

  it('removes colons so the otpauth label stays intact', () => {
    expect(totpIssuerFromSiteName('Acme: Admin')).toBe('Acme Admin')
    expect(totpIssuerFromSiteName(':::')).toBe(DEFAULT_PUBLIC_SITE_NAME)
  })

  it('caps the length at 64 characters', () => {
    expect(totpIssuerFromSiteName('a'.repeat(100))).toHaveLength(64)
  })

  it('falls back to the default site name when empty', () => {
    expect(totpIssuerFromSiteName('')).toBe(DEFAULT_PUBLIC_SITE_NAME)
    expect(totpIssuerFromSiteName(null)).toBe(DEFAULT_PUBLIC_SITE_NAME)
  })
})
