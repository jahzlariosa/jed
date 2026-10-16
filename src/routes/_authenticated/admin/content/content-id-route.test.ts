import { beforeEach, describe, expect, it, vi } from 'vitest'

const getContentFn = vi.fn()

vi.mock('#/lib/cms/functions', () => ({
  getContentFn: (...args: unknown[]) => getContentFn(...args),
}))

import { Route } from './$contentId'

type ContentLoaderContext = {
  params: { contentId: string }
  deps: Record<string, never>
}

function runLoader(ctx: ContentLoaderContext) {
  const loader = Route.options.loader
  if (typeof loader !== 'function') {
    throw new Error('expected route loader function')
  }
  return loader(ctx as never)
}

describe('/admin/content/$contentId route', () => {
  beforeEach(() => {
    getContentFn.mockClear()
  })

  it('loaderDeps does not depend on search (tab changes)', () => {
    const deps = Route.options.loaderDeps?.({
      search: { tab: 'seo' },
    } as never)
    expect(deps).toEqual({})
    expect(
      Route.options.loaderDeps?.({
        search: { tab: 'content' },
      } as never),
    ).toEqual({})
  })

  it('loader uses params.contentId and is not invoked for tab-only deps', async () => {
    getContentFn.mockResolvedValue({ id: 'entry-1', title: 'Draft' })
    const result = await runLoader({
      params: { contentId: 'entry-1' },
      deps: {},
    })
    expect(getContentFn).toHaveBeenCalledTimes(1)
    expect(getContentFn).toHaveBeenCalledWith({ data: { id: 'entry-1' } })
    expect(result).toEqual({ id: 'entry-1', title: 'Draft' })

    const seoDeps = Route.options.loaderDeps?.({
      search: { tab: 'seo' },
    } as never)
    const contentDeps = Route.options.loaderDeps?.({
      search: { tab: 'content' },
    } as never)
    expect(seoDeps).toEqual(contentDeps)
  })
})
