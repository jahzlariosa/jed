import { describe, expect, it } from 'vitest'

import {
  adminEditorOpenLabel,
  adminEditorOpenedToast,
  adminEditorViewLiveLabel,
  isAdminEditorLiveViewStatus,
  planAdminPendingPreview,
  planAdminPreview,
  resolveAdminEditorOpenPath,
  resolveAdminEditorToolbarActions,
} from './admin-preview'

describe('planAdminPreview', () => {
  it('requires slug for new drafts', () => {
    expect(
      planAdminPreview({
        isNew: true,
        savedStatus: 'draft',
        savedSlug: '',
        currentSlug: '',
        currentStatus: 'draft',
        isDirty: false,
      }),
    ).toEqual({ kind: 'error', message: 'Add a slug before previewing.' })
  })

  it('opens saved live content when dirty', () => {
    const plan = planAdminPreview({
      isNew: false,
      savedStatus: 'published',
      savedSlug: 'hello',
      currentSlug: 'hello',
      currentStatus: 'published',
      isDirty: true,
    })
    expect(plan).toMatchObject({ kind: 'open', previewSlug: 'hello' })
  })
})

describe('admin editor live view', () => {
  it('labels preview vs view from publish status', () => {
    expect(isAdminEditorLiveViewStatus('published')).toBe(true)
    expect(isAdminEditorLiveViewStatus('draft')).toBe(false)
    expect(isAdminEditorLiveViewStatus('scheduled')).toBe(false)
    expect(adminEditorOpenLabel('post', 'published')).toBe('View post')
    expect(adminEditorOpenLabel('page', 'published')).toBe('View page')
    expect(adminEditorOpenLabel('post', 'draft')).toBe('Preview')
  })

  it('resolves live and draft preview paths', () => {
    expect(resolveAdminEditorOpenPath('post', 'hello', true)).toBe(
      '/blog/hello',
    )
    expect(resolveAdminEditorOpenPath('post', 'hello', false)).toBe(
      '/blog/hello?draftPreview=true',
    )
    expect(resolveAdminEditorOpenPath('page', 'about', true)).toBe('/about')
    expect(resolveAdminEditorOpenPath('page', 'about', false)).toBe(
      '/about?draftPreview=true',
    )
  })

  it('picks toast copy for live vs preview', () => {
    expect(adminEditorOpenedToast('page', true)).toContain('live page')
    expect(adminEditorOpenedToast('post', true)).toContain('live post')
    expect(adminEditorOpenedToast('post', false)).toContain('Preview')
  })
})

describe('resolveAdminEditorToolbarActions', () => {
  it('shows only view when published and clean', () => {
    expect(
      resolveAdminEditorToolbarActions({
        kind: 'post',
        savedStatus: 'published',
        isDirty: false,
        isNew: false,
      }),
    ).toEqual({
      showPreview: false,
      showViewLive: true,
      viewLiveLabel: adminEditorViewLiveLabel('post'),
    })
  })

  it('shows preview and view when published with pending edits', () => {
    expect(
      resolveAdminEditorToolbarActions({
        kind: 'page',
        savedStatus: 'published',
        isDirty: true,
        isNew: false,
      }),
    ).toEqual({
      showPreview: true,
      showViewLive: true,
      viewLiveLabel: adminEditorViewLiveLabel('page'),
    })
  })

  it('shows only preview for drafts', () => {
    expect(
      resolveAdminEditorToolbarActions({
        kind: 'post',
        savedStatus: 'draft',
        isDirty: true,
        isNew: false,
      }),
    ).toEqual({
      showPreview: true,
      showViewLive: false,
      viewLiveLabel: '',
    })
  })
})

describe('planAdminPendingPreview', () => {
  it('saves before preview when live on site and dirty', () => {
    expect(
      planAdminPendingPreview({
        isNew: false,
        savedStatus: 'published',
        savedSlug: 'hello',
        currentSlug: 'hello',
        currentStatus: 'published',
        isDirty: true,
      }),
    ).toEqual({
      kind: 'save_then_open',
      previewSlug: 'hello',
      saveStatus: 'published',
    })
  })
})
