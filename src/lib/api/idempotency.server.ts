import '@tanstack/react-start/server-only'

import { setResponseStatus } from '@tanstack/react-start/server'

import type { Json } from '#/lib/supabase/database.types'
import { createServiceRoleClient } from '#/lib/supabase/service-role.server'

import { hashIdempotencyKey } from './token-hash'

const IDEMPOTENCY_TTL_MS = 24 * 60 * 60 * 1000

export type IdempotencyRecord = {
  statusCode: number
  responseBody: unknown
}

export function parseIdempotencyKeyHeader(request: Request): string | null {
  const raw = request.headers.get('idempotency-key')?.trim()
  if (!raw || raw.length > 128) {
    return null
  }
  return raw
}

export async function loadIdempotencyRecord(
  tokenId: string,
  key: string,
): Promise<IdempotencyRecord | null> {
  const keyHash = hashIdempotencyKey(key)
  const service = createServiceRoleClient()
  const { data, error } = await service
    .from('api_idempotency')
    .select('status_code, response_body, expires_at')
    .eq('token_id', tokenId)
    .eq('key_hash', keyHash)
    .maybeSingle()
  if (error) {
    console.error(error)
    return null
  }
  if (!data) {
    return null
  }
  if (new Date(data.expires_at).getTime() < Date.now()) {
    return null
  }
  return {
    statusCode: data.status_code,
    responseBody: data.response_body,
  }
}

export async function storeIdempotencyRecord(
  tokenId: string,
  key: string,
  statusCode: number,
  responseBody: unknown,
): Promise<void> {
  const keyHash = hashIdempotencyKey(key)
  const expiresAt = new Date(Date.now() + IDEMPOTENCY_TTL_MS).toISOString()
  const service = createServiceRoleClient()
  const { error } = await service.from('api_idempotency').insert({
    token_id: tokenId,
    key_hash: keyHash,
    status_code: statusCode,
    response_body: responseBody as Json,
    expires_at: expiresAt,
  })
  if (error) {
    console.error(error)
  }
}

export function requireIdempotencyKey(request: Request): string {
  const key = parseIdempotencyKeyHeader(request)
  if (!key) {
    setResponseStatus(400)
    throw new Error('Idempotency-Key header is required')
  }
  return key
}

export function resolveWriteIdempotencyKey(
  request: Request,
  _tokenId: string,
  options?: {
    explicitKey?: string | null
  },
): string {
  const header = parseIdempotencyKeyHeader(request)
  if (header) {
    return header
  }
  const explicit = options?.explicitKey?.trim()
  if (explicit && explicit.length > 0 && explicit.length <= 128) {
    return explicit
  }
  setResponseStatus(400)
  throw new Error('Idempotency-Key header is required')
}
