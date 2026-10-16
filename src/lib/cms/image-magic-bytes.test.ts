import { describe, expect, it } from 'vitest'

import {
  detectImageFormat,
  mimeMatchesImageBytes,
} from '#/lib/cms/image-magic-bytes.server'

const PNG_HEADER = Uint8Array.from([
  0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00,
])

describe('detectImageFormat', () => {
  it('detects PNG magic bytes', () => {
    expect(detectImageFormat(PNG_HEADER)).toBe('png')
  })

  it('detects JPEG magic bytes', () => {
    expect(detectImageFormat(Uint8Array.from([0xff, 0xd8, 0xff, 0x00]))).toBe(
      'jpeg',
    )
  })

  it('detects WEBP RIFF header', () => {
    const bytes = new Uint8Array(12)
    bytes.set([0x52, 0x49, 0x46, 0x46], 0)
    bytes.set([0x57, 0x45, 0x42, 0x50], 8)
    expect(detectImageFormat(bytes)).toBe('webp')
  })
})

describe('mimeMatchesImageBytes', () => {
  it('accepts matching PNG bytes', () => {
    expect(mimeMatchesImageBytes('image/png', PNG_HEADER)).toBe(true)
  })

  it('rejects PNG bytes with a JPEG mime type', () => {
    expect(mimeMatchesImageBytes('image/jpeg', PNG_HEADER)).toBe(false)
  })
})
