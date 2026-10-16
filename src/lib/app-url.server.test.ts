import { describe, expect, it } from 'vitest'

import {
  companionSiteOrigin,
  getTrustedAppOrigins,
  resolveAppUrl,
} from './app-url'

describe('resolveAppUrl', () => {
  it('accepts a production https origin', () => {
    expect(
      resolveAppUrl({
        NODE_ENV: 'production',
        APP_URL: 'https://example.com',
      }),
    ).toBe('https://example.com')
  })
})

describe('companionSiteOrigin', () => {
  it('maps apex to www and back', () => {
    expect(companionSiteOrigin('https://example.com')).toBe(
      'https://www.example.com',
    )
    expect(companionSiteOrigin('https://www.example.com')).toBe(
      'https://example.com',
    )
  })

  it('skips vercel preview hosts', () => {
    expect(companionSiteOrigin('https://my-app-abc.vercel.app')).toBeUndefined()
  })
})

describe('getTrustedAppOrigins', () => {
  it('includes apex and www for a custom domain', () => {
    expect(
      getTrustedAppOrigins({
        NODE_ENV: 'production',
        APP_URL: 'https://example.com',
      }),
    ).toEqual(['https://example.com', 'https://www.example.com'])
  })
})
