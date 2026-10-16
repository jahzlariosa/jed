import { describe, expect, it } from 'vitest'

import { notFoundHead, publicHead } from '#/lib/seo'

describe('notFoundHead', () => {
  it('returns noindex title without canonical or og:url', () => {
    const head = notFoundHead()
    expect(head.meta).toEqual([
      { title: 'Page not found · JED' },
      { name: 'robots', content: 'noindex, nofollow' },
    ])
    expect(head.links).toEqual([])
    const text = JSON.stringify(head)
    expect(text).not.toContain('canonical')
    expect(text).not.toContain('og:url')
  })
})

describe('publicHead with missing page data', () => {
  it('does not emit canonical when siteUrl is missing', () => {
    const head = publicHead({
      pageLabel: 'Post',
      path: '/blog/missing',
      siteUrl: undefined,
    })
    expect(head.links).toEqual([])
    const ogUrl = head.meta.find(
      (entry) => 'property' in entry && entry.property === 'og:url',
    )
    expect(ogUrl).toBeUndefined()
  })
})
