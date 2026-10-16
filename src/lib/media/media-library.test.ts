import { describe, expect, it } from 'vitest'

import {
  buildMediaDetailRows,
  formatMediaByteSize,
  formatMediaDimensions,
  isImageMediaMime,
  isMediaGridActivateKey,
  mediaLibraryThumbnailLabel,
} from './media-library'

describe('formatMediaByteSize', () => {
  it('formats bytes and kilobytes', () => {
    expect(formatMediaByteSize(512)).toBe('512 B')
    expect(formatMediaByteSize(2048)).toBe('2.0 KB')
  })
})

describe('formatMediaDimensions', () => {
  it('shows dimensions for images', () => {
    expect(
      formatMediaDimensions({ width: 1200, height: 800 }, 'image/jpeg'),
    ).toBe('1200 × 800')
  })

  it('shows dash for non-images', () => {
    expect(formatMediaDimensions(null, 'application/pdf')).toBe('—')
  })
})

describe('buildMediaDetailRows', () => {
  const item = {
    id: 'id',
    filename: 'hero.jpg',
    mime_type: 'image/jpeg',
    byte_size: 1024,
    alt_text: null,
    storage_path: 'hero.jpg',
    created_at: '2026-01-15T12:00:00.000Z',
  }

  it('includes core metadata', () => {
    const rows = buildMediaDetailRows(item, { width: 100, height: 50 })
    expect(rows.map((row) => row.label)).toEqual([
      'Filename',
      'Type',
      'Size',
      'Dimensions',
      'Uploaded',
    ])
    expect(rows.find((row) => row.id === 'filename')?.value).toBe('hero.jpg')
    expect(rows.find((row) => row.id === 'dimensions')?.value).toBe('100 × 50')
  })
})

describe('media library a11y helpers', () => {
  it('labels thumbnails for screen readers', () => {
    expect(mediaLibraryThumbnailLabel('cover.png')).toBe(
      'Open details for cover.png',
    )
  })

  it('recognizes keyboard activation keys', () => {
    expect(isMediaGridActivateKey('Enter')).toBe(true)
    expect(isMediaGridActivateKey(' ')).toBe(true)
    expect(isMediaGridActivateKey('Escape')).toBe(false)
  })

  it('detects image mime types', () => {
    expect(isImageMediaMime('image/webp')).toBe(true)
    expect(isImageMediaMime('application/pdf')).toBe(false)
  })
})
