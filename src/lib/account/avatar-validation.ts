export const AVATAR_MAX_BYTES = 2 * 1024 * 1024

export const AVATAR_ALLOWED_MIME = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
])

export const AVATAR_INLINE_ERROR = 'Use JPG, PNG or WebP under 2 MB.'

export function isAllowedAvatarMime(mime: string) {
  return AVATAR_ALLOWED_MIME.has(mime)
}

function readMagic(bytes: Uint8Array) {
  if (bytes.length < 12) {
    return null
  }
  if (bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) {
    return 'image/jpeg'
  }
  if (
    bytes[0] === 0x89 &&
    bytes[1] === 0x50 &&
    bytes[2] === 0x4e &&
    bytes[3] === 0x47
  ) {
    return 'image/png'
  }
  if (
    bytes[0] === 0x52 &&
    bytes[1] === 0x49 &&
    bytes[2] === 0x46 &&
    bytes[3] === 0x46 &&
    bytes[8] === 0x57 &&
    bytes[9] === 0x45 &&
    bytes[10] === 0x42 &&
    bytes[11] === 0x50
  ) {
    return 'image/webp'
  }
  return null
}

export function validateAvatarBytes(bytes: Uint8Array) {
  if (bytes.byteLength > AVATAR_MAX_BYTES) {
    return { ok: false as const, message: AVATAR_INLINE_ERROR }
  }
  const magic = readMagic(bytes)
  if (!magic || !isAllowedAvatarMime(magic)) {
    return { ok: false as const, message: AVATAR_INLINE_ERROR }
  }
  return { ok: true as const, mime: magic }
}

export function validateAvatarFile(file: File) {
  if (!isAllowedAvatarMime(file.type)) {
    return { ok: false as const, message: AVATAR_INLINE_ERROR }
  }
  if (file.size > AVATAR_MAX_BYTES) {
    return { ok: false as const, message: AVATAR_INLINE_ERROR }
  }
  return { ok: true as const }
}
