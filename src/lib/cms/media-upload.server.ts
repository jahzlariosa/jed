import '@tanstack/react-start/server-only'

export {
  mintUploadTicket,
  uploadTicketSecretConfigured,
  UPLOAD_TICKET_TTL_MS,
  verifyUploadTicket,
  type UploadTicketClaims,
} from '#/lib/cms/media-upload-ticket.server'

export {
  detectImageFormat,
  mimeMatchesImageBytes,
  type DetectedImageFormat,
} from '#/lib/cms/image-magic-bytes.server'

const ALLOWED_IMAGE_MIME = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
  'image/avif',
])

export function isAllowedImageMime(mime: string) {
  return ALLOWED_IMAGE_MIME.has(mime)
}
