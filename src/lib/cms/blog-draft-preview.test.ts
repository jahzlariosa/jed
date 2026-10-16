import { describe, expect, it } from 'vitest'

import { resolveIncludeDrafts } from '#/lib/cms/blog'

describe('resolveIncludeDrafts', () => {
  it('returns false unless draftPreview is explicitly true', () => {
    expect(
      resolveIncludeDrafts({ canPreviewDrafts: true, draftPreview: undefined }),
    ).toBe(false)
    expect(
      resolveIncludeDrafts({ canPreviewDrafts: true, draftPreview: false }),
    ).toBe(false)
    expect(
      resolveIncludeDrafts({ canPreviewDrafts: false, draftPreview: true }),
    ).toBe(false)
    expect(
      resolveIncludeDrafts({ canPreviewDrafts: true, draftPreview: true }),
    ).toBe(true)
  })
})
