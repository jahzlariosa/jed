import { describe, expect, it } from 'vitest'

import { resolvePostStatusOnSave } from './post-publish'

const NOW = new Date('2026-06-15T12:00:00.000Z')
const FUTURE = '2026-07-01T09:00:00.000Z'
const PAST = '2026-01-01T09:00:00.000Z'
const EXISTING_PUBLISHED = '2026-03-01T10:00:00.000Z'

describe('resolvePostStatusOnSave', () => {
  it('save_draft keeps draft and does not set published_at', () => {
    const result = resolvePostStatusOnSave({
      publishIntent: 'save_draft',
      status: 'published',
      publishedAt: null,
      now: NOW,
    })
    expect(result).toEqual({ status: 'draft', publishedAt: null })
  })

  it('update keeps draft without publishing', () => {
    const result = resolvePostStatusOnSave({
      publishIntent: 'update',
      status: 'draft',
      publishedAt: null,
      now: NOW,
    })
    expect(result).toEqual({ status: 'draft', publishedAt: null })
  })

  it('update does not republish when intent is update on a draft', () => {
    const result = resolvePostStatusOnSave({
      publishIntent: 'update',
      status: 'draft',
      publishedAt: FUTURE,
      now: NOW,
    })
    expect(result.status).toBe('draft')
  })

  it('update with published status sets published_at only on first publish', () => {
    const first = resolvePostStatusOnSave({
      publishIntent: 'update',
      status: 'published',
      publishedAt: null,
      existingPublishedAt: null,
      now: NOW,
    })
    expect(first.status).toBe('published')
    expect(first.publishedAt).toBe(NOW.toISOString())

    const again = resolvePostStatusOnSave({
      publishIntent: 'update',
      status: 'published',
      publishedAt: null,
      existingPublishedAt: EXISTING_PUBLISHED,
      now: NOW,
    })
    expect(again).toEqual({
      status: 'published',
      publishedAt: EXISTING_PUBLISHED,
    })
  })

  it('publish sets published status and stamps first publish', () => {
    const result = resolvePostStatusOnSave({
      publishIntent: 'publish',
      status: 'draft',
      publishedAt: null,
      now: NOW,
    })
    expect(result).toEqual({
      status: 'published',
      publishedAt: NOW.toISOString(),
    })
  })

  it('publish preserves existing published_at', () => {
    const result = resolvePostStatusOnSave({
      publishIntent: 'publish',
      status: 'published',
      publishedAt: null,
      existingPublishedAt: EXISTING_PUBLISHED,
      now: NOW,
    })
    expect(result).toEqual({
      status: 'published',
      publishedAt: EXISTING_PUBLISHED,
    })
  })

  it('update keeps scheduled when date is in the future', () => {
    const result = resolvePostStatusOnSave({
      publishIntent: 'update',
      status: 'scheduled',
      publishedAt: FUTURE,
      now: NOW,
    })
    expect(result).toEqual({ status: 'scheduled', publishedAt: FUTURE })
  })

  it('publish with scheduled future date stays scheduled', () => {
    const result = resolvePostStatusOnSave({
      publishIntent: 'publish',
      status: 'scheduled',
      publishedAt: FUTURE,
      now: NOW,
    })
    expect(result).toEqual({ status: 'scheduled', publishedAt: FUTURE })
  })

  it('update with scheduled past date publishes', () => {
    const result = resolvePostStatusOnSave({
      publishIntent: 'update',
      status: 'scheduled',
      publishedAt: PAST,
      existingPublishedAt: null,
      now: NOW,
    })
    expect(result.status).toBe('published')
    expect(result.publishedAt).toBe(PAST)
  })

  it('update no longer treats update like publish for arbitrary status', () => {
    const result = resolvePostStatusOnSave({
      publishIntent: 'update',
      status: 'draft',
      publishedAt: null,
      now: NOW,
    })
    expect(result.status).not.toBe('published')
  })
})
