import { describe, expect, it } from 'vitest'

import { publicHead } from '#/lib/seo'

describe('publicHead canonical URL', () => {
  it('drops non-https canonical URLs and falls back to the page URL', () => {
    const head = publicHead({
      pageLabel: 'About',
      path: '/about',
      siteUrl: 'https://example.com',
      canonicalUrl: 'javascript:alert(1)',
    })
    const canonical = head.links.find((link) => link.rel === 'canonical')
    expect(canonical?.href).toBe('https://example.com/about')
  })

  it('keeps valid https canonical URLs', () => {
    const head = publicHead({
      pageLabel: 'About',
      path: '/about',
      siteUrl: 'https://example.com',
      canonicalUrl: 'https://other.example/about',
    })
    const canonical = head.links.find((link) => link.rel === 'canonical')
    expect(canonical?.href).toBe('https://other.example/about')
  })
})
