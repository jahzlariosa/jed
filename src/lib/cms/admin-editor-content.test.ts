import { describe, expect, it } from 'vitest'

import {
  adminEditorPublicPath,
  contentEntryEditorKind,
} from './admin-editor-content'
import { resolveAdminEditorOpenPath } from './admin-preview'

describe('contentEntryEditorKind', () => {
  it('treats page entries as page editor kind', () => {
    expect(contentEntryEditorKind('page')).toBe('page')
  })

  it('treats non-page entries as post editor kind for preview paths', () => {
    expect(contentEntryEditorKind('post')).toBe('post')
    expect(contentEntryEditorKind('article')).toBe('post')
  })
})

describe('adminEditorPublicPath', () => {
  it('matches live open paths for pages and posts', () => {
    expect(adminEditorPublicPath('page', 'about')).toBe('/about')
    expect(resolveAdminEditorOpenPath('page', 'about', true)).toBe('/about')
    expect(adminEditorPublicPath('post', 'hello')).toBe('/blog/hello')
    expect(resolveAdminEditorOpenPath('post', 'hello', true)).toBe(
      '/blog/hello',
    )
  })

  it('uses placeholders when slug is empty', () => {
    expect(adminEditorPublicPath('page', '')).toBe('/page-slug')
    expect(adminEditorPublicPath('post', '  ')).toBe('/blog/post-slug')
  })
})
