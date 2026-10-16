import { describe, expect, it } from 'vitest'

import { buildEntrySeoPreview } from '#/lib/seo/entry-meta-preview'

describe('buildEntrySeoPreview', () => {
  it('uses publicHead title template when SEO title is empty', () => {
    const preview = buildEntrySeoPreview({
      pageLabel: 'Spring update',
      path: '/blog/spring-update',
      siteUrl: 'https://example.com',
      seoContext: { siteName: 'JED', titleTemplate: '{title} · {site}' },
    })
    expect(preview.serp.title).toBe('Spring update · JED')
    expect(preview.social.title).toBe('Spring update · JED')
    expect(preview.serp.url).toBe('https://example.com/blog/spring-update')
  })

  it('respects custom SEO title and noindex robots', () => {
    const preview = buildEntrySeoPreview({
      pageLabel: 'Ignored',
      seoTitle: 'Custom title',
      metaDescription: 'Short summary',
      path: '/about',
      siteUrl: 'https://example.com',
      noindex: true,
      seoContext: { siteName: 'JED' },
    })
    expect(preview.serp.title).toBe('Custom title')
    expect(preview.robots).toBe('noindex, nofollow')
    expect(preview.serp.description).toBe('')
  })
})
