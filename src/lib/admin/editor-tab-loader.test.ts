import { describe, expect, it } from 'vitest'

import { Route as ContentRoute } from '#/routes/_authenticated/admin/content/$contentId'
import { Route as PostRoute } from '#/routes/_authenticated/admin/posts/$postId'

describe('admin editor routes tab search', () => {
  it('content editor loaderDeps ignore tab search', () => {
    const contentTab = ContentRoute.options.loaderDeps?.({
      search: { tab: 'content' },
    } as never)
    const seoTab = ContentRoute.options.loaderDeps?.({
      search: { tab: 'seo' },
    } as never)
    expect(contentTab).toEqual({})
    expect(seoTab).toEqual(contentTab)
  })

  it('post editor loaderDeps ignore tab search', () => {
    const contentTab = PostRoute.options.loaderDeps?.({
      search: { tab: 'content' },
    } as never)
    const settingsTab = PostRoute.options.loaderDeps?.({
      search: { tab: 'settings' },
    } as never)
    expect(contentTab).toEqual({})
    expect(settingsTab).toEqual(contentTab)
  })
})
