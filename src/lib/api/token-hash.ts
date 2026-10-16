import { createHash, randomBytes } from 'node:crypto'

export const API_TOKEN_PREFIX = 'amn_live_'

export function generateApiTokenSecret(): { token: string; prefix: string } {
  const body = randomBytes(24).toString('base64url')
  const token = `${API_TOKEN_PREFIX}${body}`
  const prefix = `${API_TOKEN_PREFIX}${body.slice(0, 8)}`
  return { token, prefix }
}

export function hashApiToken(token: string): string {
  return createHash('sha256').update(token, 'utf8').digest('hex')
}

export function hashIdempotencyKey(key: string): string {
  return createHash('sha256').update(key, 'utf8').digest('hex')
}

export function isApiTokenFormat(value: string): boolean {
  return value.startsWith(API_TOKEN_PREFIX) && value.length >= 20
}
