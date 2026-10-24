import { describe, expect, it } from 'vitest'

import {
  DEFAULT_BRAND_HEX,
  DEFAULT_PUBLIC_SITE_NAME,
  resolvePublicBrandHex,
  resolvePublicSiteName,
} from '#/lib/cms/brand-defaults'

describe('resolvePublicSiteName', () => {
  it('maps legacy and empty names to the starter default', () => {
    expect(resolvePublicSiteName(null)).toBe(DEFAULT_PUBLIC_SITE_NAME)
    expect(resolvePublicSiteName('')).toBe(DEFAULT_PUBLIC_SITE_NAME)
    expect(resolvePublicSiteName('Site name')).toBe(DEFAULT_PUBLIC_SITE_NAME)
    expect(resolvePublicSiteName('Jed')).toBe(DEFAULT_PUBLIC_SITE_NAME)
    expect(resolvePublicSiteName('Acme Studio')).toBe('Acme Studio')
  })
})

describe('resolvePublicBrandHex', () => {
  it('maps legacy indigo and empty hex to ink default', () => {
    expect(resolvePublicBrandHex(null)).toBe(DEFAULT_BRAND_HEX)
    expect(resolvePublicBrandHex('#4F46E5')).toBe(DEFAULT_BRAND_HEX)
    expect(resolvePublicBrandHex('#4f46e5')).toBe(DEFAULT_BRAND_HEX)
    expect(resolvePublicBrandHex('4F46E5')).toBe(DEFAULT_BRAND_HEX)
    expect(resolvePublicBrandHex('#1F5E4B')).toBe('#1F5E4B')
  })
})
