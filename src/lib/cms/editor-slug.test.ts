import { describe, expect, it } from 'vitest'

import {
  nextAvailableEditorSlug,
  shouldEnableSlugTitleSyncOnLoad,
  slugifyEditorTitle,
} from '#/lib/cms/editor-slug'

describe('slugifyEditorTitle', () => {
  it('lowercases, hyphenates, and transliterates', () => {
    expect(slugifyEditorTitle('  Hello World  ')).toBe('hello-world')
    expect(slugifyEditorTitle('Café résumé')).toBe('cafe-resume')
    expect(slugifyEditorTitle('Über')).toBe('uber')
  })

  it('trims to max length', () => {
    expect(slugifyEditorTitle('a'.repeat(200)).length).toBe(120)
  })
})

describe('shouldEnableSlugTitleSyncOnLoad', () => {
  it('disables sync for published entries', () => {
    expect(shouldEnableSlugTitleSyncOnLoad(true, 'Hello', 'hello')).toBe(false)
  })

  it('enables sync when slug matches title slug', () => {
    expect(
      shouldEnableSlugTitleSyncOnLoad(false, 'Hello World', 'hello-world'),
    ).toBe(true)
  })

  it('disables sync when slug was customized', () => {
    expect(
      shouldEnableSlugTitleSyncOnLoad(false, 'Hello World', 'custom-slug'),
    ).toBe(false)
  })
})

describe('nextAvailableEditorSlug', () => {
  it('returns base when free', () => {
    expect(nextAvailableEditorSlug('hello', () => false)).toBe('hello')
  })

  it('appends numeric suffixes when taken', () => {
    const taken = new Set(['hello', 'hello-2'])
    expect(nextAvailableEditorSlug('hello', (slug) => taken.has(slug))).toBe(
      'hello-3',
    )
  })
})
