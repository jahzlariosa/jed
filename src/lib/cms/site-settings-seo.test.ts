import { describe, expect, it } from 'vitest'

import { parseSiteSeoSaveInput } from '#/lib/cms/site-settings-seo'

describe('parseSiteSeoSaveInput', () => {
  it('accepts valid GA4 and GTM IDs', () => {
    const parsed = parseSiteSeoSaveInput({
      ga4MeasurementId: 'G-ABCDEF12',
      gtmContainerId: 'GTM-ABC1234',
      allowSearchIndexing: true,
      sitemapIncludeBlog: true,
      sitemapIncludePages: true,
      sitemapIncludeDocs: true,
      vercelAnalyticsEnabled: false,
      orgSchemaType: 'Organization',
    })
    expect(parsed.ga4MeasurementId).toBe('G-ABCDEF12')
    expect(parsed.gtmContainerId).toBe('GTM-ABC1234')
  })

  it('rejects invalid verification tokens', () => {
    expect(() =>
      parseSiteSeoSaveInput({
        googleSiteVerification: 'bad token',
        allowSearchIndexing: true,
        sitemapIncludeBlog: true,
        sitemapIncludePages: true,
        sitemapIncludeDocs: true,
        vercelAnalyticsEnabled: false,
        orgSchemaType: 'Organization',
      }),
    ).toThrow()
  })
})
