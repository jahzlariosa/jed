import { describe, expect, it, vi } from 'vitest'

import { invalidateByTag } from '@vercel/functions'

import { invalidatePublishedContentCache } from '#/lib/api-runtime-cache.server'

vi.mock('@vercel/functions', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@vercel/functions')>()
  return {
    ...actual,
    invalidateByTag: vi.fn(async () => undefined),
  }
})

describe('invalidatePublishedContentCache', () => {
  it('calls CDN invalidateByTag with content tags', async () => {
    vi.mocked(invalidateByTag).mockClear()
    await invalidatePublishedContentCache('abc-123')
    expect(invalidateByTag).toHaveBeenCalledWith([
      'content:abc-123',
      'content:list',
      'content',
      'blog',
      'blog:list',
    ])
  })
})
