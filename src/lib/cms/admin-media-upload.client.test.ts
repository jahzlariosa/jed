import { describe, expect, it } from 'vitest'

import {
  ADMIN_IMAGE_MAX_BYTES,
  validateAdminImageFile,
} from './admin-media-upload.client'

describe('validateAdminImageFile', () => {
  it('rejects non-image files', () => {
    const file = new File(['x'], 'doc.txt', { type: 'text/plain' })
    expect(validateAdminImageFile(file)).toMatch(/image file/)
  })

  it('rejects oversized images', () => {
    const file = new File(
      [new Uint8Array(ADMIN_IMAGE_MAX_BYTES + 1)],
      'big.png',
      {
        type: 'image/png',
      },
    )
    expect(validateAdminImageFile(file)).toMatch(/8 MB/)
  })

  it('accepts allowed image types', () => {
    const file = new File([new Uint8Array(8)], 'photo.webp', {
      type: 'image/webp',
    })
    expect(validateAdminImageFile(file)).toBeNull()
  })
})
