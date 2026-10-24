import { describe, expect, it } from 'vitest'

import { assertNonEmptyMetaDescription } from '#/lib/seo/descriptions'
import { marketingRouteHead } from '#/lib/seo/marketing-head'
import { MARKETING_ROUTE_SEO } from '#/lib/seo/marketing-routes'
import { publicHead } from '#/lib/seo'

function descriptionFromHead(head: ReturnType<typeof publicHead>): string {
  const entry = head.meta.find(
    (item) => 'name' in item && item.name === 'description',
  )
  if (entry && 'content' in entry && typeof entry.content === 'string') {
    return entry.content
  }
  return ''
}

describe('marketing route SEO', () => {
  it('uses non-empty titles and descriptions for primary marketing routes', () => {
    for (const path of Object.keys(MARKETING_ROUTE_SEO) as Array<
      keyof typeof MARKETING_ROUTE_SEO
    >) {
      const route = MARKETING_ROUTE_SEO[path]
      expect(route.title.trim()).not.toBe('')
      expect(route.description.trim()).not.toBe('')
      const head = marketingRouteHead(path, [], {
        siteUrl: 'https://jed-starter.vercel.app',
      })
      const description = descriptionFromHead(head)
      expect(description).toBe(route.description)
      assertNonEmptyMetaDescription(description)
    }
  })

  it('falls back to the site default when a page omits description', () => {
    const head = publicHead({
      pageLabel: 'About',
      path: '/about',
      siteUrl: 'https://jed-starter.vercel.app',
      siteDefaultDescription: 'Site-wide default description.',
    })
    expect(descriptionFromHead(head)).toBe('Site-wide default description.')
  })

  it('uses the built-in default when page and site descriptions are empty', () => {
    const head = publicHead({
      pageLabel: 'About',
      path: '/about',
      siteUrl: 'https://jed-starter.vercel.app',
    })
    const description = descriptionFromHead(head)
    expect(description?.trim()).not.toBe('')
  })
})
