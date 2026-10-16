import { describe, expect, it, vi } from 'vitest'

import { normalizeEditorTab } from './use-synced-editor-tab'

describe('normalizeEditorTab', () => {
  const tabs = ['content', 'seo', 'settings'] as const

  it('keeps a valid tab from the URL', () => {
    expect(normalizeEditorTab('seo', tabs, 'content')).toBe('seo')
  })

  it('falls back when the URL tab is invalid', () => {
    expect(normalizeEditorTab('unknown', tabs, 'content')).toBe('content')
  })
})

describe('editor tab URL sync', () => {
  it('calls onUrlTabChange without requiring a loader refresh', () => {
    const onUrlTabChange = vi.fn()
    const next = normalizeEditorTab(
      'settings',
      ['content', 'seo', 'settings'],
      'content',
    )
    onUrlTabChange(next)
    expect(onUrlTabChange).toHaveBeenCalledWith('settings')
  })
})
