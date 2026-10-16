import '@tanstack/react-start/server-only'

import { ipAddress } from '@vercel/functions'
import { getRequest } from '@tanstack/react-start/server'

type Bucket = { count: number; resetAt: number }

const buckets = new Map<string, Bucket>()
const MAX_BUCKETS = 20_000

export function resolveApiClientIp(request?: Request): string {
  const req = request ?? getRequest()
  const trusted = ipAddress(req) ?? req.headers.get('x-real-ip')?.trim()
  return trusted || 'unknown'
}

function touchBucket(key: string, limit: number, windowMs: number): void {
  const now = Date.now()
  let bucket = buckets.get(key)
  if (!bucket || bucket.resetAt <= now) {
    bucket = { count: 0, resetAt: now + windowMs }
    buckets.set(key, bucket)
    if (buckets.size > MAX_BUCKETS) {
      const oldest = buckets.keys().next().value
      if (oldest) {
        buckets.delete(oldest)
      }
    }
  }
  bucket.count += 1
  if (bucket.count > limit) {
    throw new ApiRateLimitError()
  }
}

export class ApiRateLimitError extends Error {
  constructor() {
    super('RATE_LIMITED')
    this.name = 'ApiRateLimitError'
  }
}

export function assertApiRateLimit(input: {
  request?: Request
  tokenId?: string
  action: string
  limit: number
  windowMs: number
}): void {
  const ip = resolveApiClientIp(input.request)
  const parts = [`api:${input.action}`, `ip:${ip}`]
  if (input.tokenId) {
    parts.push(`token:${input.tokenId}`)
  }
  touchBucket(parts.join('|'), input.limit, input.windowMs)
}
