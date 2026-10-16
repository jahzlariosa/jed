import '@tanstack/react-start/server-only'

import { createHmac, timingSafeEqual } from 'node:crypto'

export const UPLOAD_TICKET_TTL_MS = 15 * 60 * 1000
export const MEDIA_UPLOAD_TICKET_SECRET_MIN_LENGTH = 32

export type UploadTicketClaims = {
  v: 1
  userId: string
  storagePath: string
  mimeType: string
  byteSize: number
  exp: number
}

export function uploadTicketSecretConfigured(): boolean {
  const secret = process.env.MEDIA_UPLOAD_TICKET_SECRET?.trim()
  return Boolean(
    secret && secret.length >= MEDIA_UPLOAD_TICKET_SECRET_MIN_LENGTH,
  )
}

function uploadTicketSecret(): string {
  const secret = process.env.MEDIA_UPLOAD_TICKET_SECRET?.trim()
  if (!secret || secret.length < MEDIA_UPLOAD_TICKET_SECRET_MIN_LENGTH) {
    throw new Error('MEDIA_UPLOAD_TICKET_SECRET is not configured')
  }
  return secret
}

function signBody(body: string): string {
  return createHmac('sha256', uploadTicketSecret())
    .update(body)
    .digest('base64url')
}

export function mintUploadTicket(input: {
  userId: string
  storagePath: string
  mimeType: string
  byteSize: number
  now?: number
}): string {
  const claims: UploadTicketClaims = {
    v: 1,
    userId: input.userId,
    storagePath: input.storagePath,
    mimeType: input.mimeType,
    byteSize: input.byteSize,
    exp: (input.now ?? Date.now()) + UPLOAD_TICKET_TTL_MS,
  }
  const body = Buffer.from(JSON.stringify(claims), 'utf8').toString('base64url')
  return `${body}.${signBody(body)}`
}

export function verifyUploadTicket(
  ticket: string,
  userId: string,
  now = Date.now(),
): UploadTicketClaims | null {
  const dot = ticket.indexOf('.')
  if (dot <= 0) {
    return null
  }
  const body = ticket.slice(0, dot)
  const signature = ticket.slice(dot + 1)
  const expected = signBody(body)
  if (
    signature.length !== expected.length ||
    !timingSafeEqual(Buffer.from(signature), Buffer.from(expected))
  ) {
    return null
  }
  let claims: UploadTicketClaims
  try {
    claims = JSON.parse(
      Buffer.from(body, 'base64url').toString('utf8'),
    ) as UploadTicketClaims
  } catch {
    return null
  }
  if (
    claims.v !== 1 ||
    claims.userId !== userId ||
    claims.exp < now ||
    !claims.storagePath ||
    !claims.mimeType ||
    !Number.isFinite(claims.byteSize)
  ) {
    return null
  }
  return claims
}
