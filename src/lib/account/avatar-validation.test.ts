import { describe, expect, it } from 'vitest'

import {
  AVATAR_INLINE_ERROR,
  AVATAR_MAX_BYTES,
  validateAvatarBytes,
  validateAvatarFile,
} from './avatar-validation'

describe('validateAvatarBytes', () => {
  it('accepts small webp magic', () => {
    const webp = new Uint8Array([
      0x52, 0x49, 0x46, 0x46, 0x00, 0x00, 0x00, 0x00, 0x57, 0x45, 0x42, 0x50,
    ])
    expect(validateAvatarBytes(webp)).toEqual({ ok: true, mime: 'image/webp' })
  })

  it('rejects oversize buffers', () => {
    const big = new Uint8Array(AVATAR_MAX_BYTES + 1)
    big[0] = 0xff
    big[1] = 0xd8
    big[2] = 0xff
    expect(validateAvatarBytes(big)).toEqual({
      ok: false,
      message: AVATAR_INLINE_ERROR,
    })
  })

  it('rejects unknown magic', () => {
    expect(validateAvatarBytes(new Uint8Array([1, 2, 3]))).toEqual({
      ok: false,
      message: AVATAR_INLINE_ERROR,
    })
  })
})

describe('validateAvatarFile', () => {
  it('rejects disallowed mime', () => {
    const file = new File(['x'], 'x.gif', { type: 'image/gif' })
    expect(validateAvatarFile(file).ok).toBe(false)
  })
})
