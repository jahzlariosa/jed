import { notFound } from '@tanstack/react-router'
import { describe, expect, it, vi } from 'vitest'

const getAdminPostFn = vi.fn()

vi.mock('#/lib/cms/posts-admin-fns', () => ({
  getAdminPostFn: (...args: unknown[]) => getAdminPostFn(...args),
}))

import { Route } from './$postId'

const sampleUuid = '11111111-1111-4111-8111-111111111111'

type PostLoaderContext = {
  params: { postId: string }
  deps: Record<string, never>
}

function runLoader(ctx: PostLoaderContext) {
  const loader = Route.options.loader
  if (typeof loader !== 'function') {
    throw new Error('expected route loader function')
  }
  return loader(ctx as never)
}

describe('/admin/posts/$postId route', () => {
  it('loaderDeps does not depend on search (tab changes)', () => {
    expect(
      Route.options.loaderDeps?.({ search: { tab: 'settings' } } as never),
    ).toEqual({})
    expect(
      Route.options.loaderDeps?.({ search: { tab: 'content' } } as never),
    ).toEqual({})
  })

  it('loader treats postId new without fetching', async () => {
    const result = await runLoader({
      params: { postId: 'new' },
      deps: {},
    })
    expect(getAdminPostFn).not.toHaveBeenCalled()
    expect(result).toEqual({ row: null, isNew: true })
  })

  it('loader throws notFound for invalid post id', async () => {
    let thrown: unknown
    try {
      await runLoader({
        params: { postId: 'not-a-uuid' },
        deps: {},
      })
    } catch (error) {
      thrown = error
    }
    expect(thrown).toEqual(notFound())
    expect(getAdminPostFn).not.toHaveBeenCalled()
  })

  it('loader fetches post for uuid postId', async () => {
    getAdminPostFn.mockResolvedValue({ id: sampleUuid, title: 'Post' })
    const result = await runLoader({
      params: { postId: sampleUuid },
      deps: {},
    })
    expect(getAdminPostFn).toHaveBeenCalledWith({ data: { id: sampleUuid } })
    expect(result).toEqual({
      row: { id: sampleUuid, title: 'Post' },
      isNew: false,
    })
  })
})
