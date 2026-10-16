import { describe, expect, it } from 'vitest'

import { parseBlogRouteSearch } from '#/lib/cms/blog'

describe('parseBlogRouteSearch', () => {
  it('does not add page=1 when the URL has no page', () => {
    expect(parseBlogRouteSearch({})).not.toHaveProperty('page')
  })

  it('keeps an explicit page', () => {
    expect(parseBlogRouteSearch({ page: '2' }).page).toBe(2)
  })
})
