import '@tanstack/react-start/server-only'

import { getRequest } from '@tanstack/react-start/server'

type Bucket = { count: number; resetAt: number }

const buckets = new Map<string, Bucket>()

const MAX_BUCKETS = 10_000

function clientKey(action: string): string {
  const request = getRequest()
  const forwarded = request.headers.get('x-forwarded-for')
  const ip = forwarded?.split(',')[0]?.trim() || 'unknown'
  return `${action}:${ip}`
}

export function assertRateLimit(
  action: string,
  limit: number,
  windowMs: number,
): void {
  const key = clientKey(action)
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
    throw new Error('RATE_LIMITED')
  }
}

export const RATE_LIMIT_MESSAGE =
  'Too many attempts. Please wait a few minutes and try again.'
