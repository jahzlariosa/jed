const ALLOWED_IMAGE_MIME = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
  'image/avif',
])

export const ADMIN_IMAGE_MAX_BYTES = 8_000_000

function isAllowedImageMime(mime: string) {
  return ALLOWED_IMAGE_MIME.has(mime)
}

export type AdminMediaUploadPrepareResult =
  | {
      ok: true
      storagePath: string
      signedUrl: string
      token: string
      mimeType: string
      byteSize: number
    }
  | { ok: false; error: string }

export type AdminMediaUploadRegisterResult =
  | { ok: true; id: string }
  | { ok: false; error: string }

export function validateAdminImageFile(file: File): string | null {
  if (!file.type.startsWith('image/')) {
    return 'Choose an image file (JPEG, PNG, WebP, GIF, or AVIF).'
  }
  if (!isAllowedImageMime(file.type)) {
    return 'This image type is not supported.'
  }
  if (file.size < 1 || file.size > ADMIN_IMAGE_MAX_BYTES) {
    return 'Image must be 8 MB or smaller.'
  }
  return null
}

export async function putFileToSignedUpload(input: {
  signedUrl: string
  token: string
  mimeType: string
  file: File
}): Promise<string | null> {
  const uploadResponse = await fetch(input.signedUrl, {
    method: 'PUT',
    headers: {
      'Content-Type': input.mimeType,
      Authorization: `Bearer ${input.token}`,
    },
    body: input.file,
  })
  if (!uploadResponse.ok) {
    return 'Image upload failed. Try again.'
  }
  return null
}
