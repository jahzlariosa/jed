import { describe, expect, it } from 'vitest'

import {
  ensureUniqueContentSlug,
  SLUG_UNIQUENESS_MAX_SUFFIX_ATTEMPTS,
} from '#/lib/cms/slug-uniqueness.server'

describe('slug uniqueness allocation', () => {
  it('caps suffix probes before failing', async () => {
    const taken = new Set<string>(['my-post'])
    for (let i = 2; i <= SLUG_UNIQUENESS_MAX_SUFFIX_ATTEMPTS + 1; i += 1) {
      taken.add(`my-post-${i}`)
    }
    let lookups = 0
    const supabase = {
      from: () => ({
        select: () => ({
          eq: (_col: string, slug: string) => ({
            limit: () => ({
              maybeSingle: async () => {
                lookups += 1
                return {
                  data: taken.has(slug) ? { id: 'other' } : null,
                  error: null,
                }
              },
            }),
          }),
        }),
      }),
    }

    await expect(
      ensureUniqueContentSlug(
        supabase as unknown as Parameters<typeof ensureUniqueContentSlug>[0],
        'my-post',
      ),
    ).rejects.toThrow('Unable to allocate a unique slug')

    expect(lookups).toBe(1 + SLUG_UNIQUENESS_MAX_SUFFIX_ATTEMPTS)
  })
})
