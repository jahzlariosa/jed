export type DetectedImageFormat = 'jpeg' | 'png' | 'gif' | 'webp' | 'avif'

function readAscii(bytes: Uint8Array, start: number, length: number): string {
  return Array.from(bytes.slice(start, start + length))
    .map((byte) => String.fromCharCode(byte))
    .join('')
}

export function detectImageFormat(
  bytes: Uint8Array,
): DetectedImageFormat | null {
  if (
    bytes.length >= 3 &&
    bytes[0] === 0xff &&
    bytes[1] === 0xd8 &&
    bytes[2] === 0xff
  ) {
    return 'jpeg'
  }
  if (
    bytes.length >= 8 &&
    bytes[0] === 0x89 &&
    bytes[1] === 0x50 &&
    bytes[2] === 0x4e &&
    bytes[3] === 0x47 &&
    bytes[4] === 0x0d &&
    bytes[5] === 0x0a &&
    bytes[6] === 0x1a &&
    bytes[7] === 0x0a
  ) {
    return 'png'
  }
  if (bytes.length >= 6) {
    const header = readAscii(bytes, 0, 6)
    if (header === 'GIF87a' || header === 'GIF89a') {
      return 'gif'
    }
  }
  if (
    bytes.length >= 12 &&
    readAscii(bytes, 0, 4) === 'RIFF' &&
    readAscii(bytes, 8, 4) === 'WEBP'
  ) {
    return 'webp'
  }
  if (bytes.length >= 12 && readAscii(bytes, 4, 4) === 'ftyp') {
    const brand = readAscii(bytes, 8, 4)
    if (brand === 'avif' || brand === 'avis') {
      return 'avif'
    }
  }
  return null
}

const MIME_TO_FORMAT: Record<string, DetectedImageFormat> = {
  'image/jpeg': 'jpeg',
  'image/png': 'png',
  'image/gif': 'gif',
  'image/webp': 'webp',
  'image/avif': 'avif',
}

export function mimeMatchesImageBytes(
  mimeType: string,
  bytes: Uint8Array,
): boolean {
  const expected = MIME_TO_FORMAT[mimeType]
  if (!expected) {
    return false
  }
  const detected = detectImageFormat(bytes)
  return detected === expected
}
