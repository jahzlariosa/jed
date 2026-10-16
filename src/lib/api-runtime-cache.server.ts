import '@tanstack/react-start/server-only'

import { getCache, invalidateByTag } from '@vercel/functions'

export const PUBLIC_CACHE_SCHEMA_VERSION = '1'

const cache = getCache({ namespace: 'amianan-api' })

export type CachedHttpPayload = {
  body: string
  etag: string
  status: number
}

export function buildPublicCacheKey(
  route: string,
  allowlistedQuery: Record<string, string>,
): string {
  const sorted = Object.keys(allowlistedQuery)
    .sort()
    .map((key) => `${key}=${allowlistedQuery[key]}`)
    .join('&')
  return `v1:pub:${route}:${sorted}:${PUBLIC_CACHE_SCHEMA_VERSION}`
}

export function normalizeAllowlistedQuery(
  searchParams: URLSearchParams,
  allowlist: string[],
): Record<string, string> {
  const record: Record<string, string> = {}
  for (const key of allowlist) {
    const value = searchParams.get(key)
    if (value !== null) {
      record[key] = value
    }
  }
  return record
}

const PUBLIC_SEARCH_Q_MAX = 120

export function normalizePublicSearchQuery(
  searchParams: URLSearchParams,
): Record<string, string> | null {
  const rawQ = searchParams.get('q')
  const q = (rawQ ?? '').trim().toLowerCase().slice(0, PUBLIC_SEARCH_Q_MAX)
  if (q.length < 2) {
    return null
  }
  const rawPage = searchParams.get('page')
  let page =
    rawPage === null || rawPage === '' ? 1 : Number.parseInt(rawPage, 10)
  if (!Number.isFinite(page)) {
    page = 1
  }
  page = Math.min(1000, Math.max(1, page))
  return { q, page: String(page) }
}

export async function readRuntimeCache(
  key: string,
): Promise<CachedHttpPayload | null> {
  const hit = await cache.get(key)
  if (!hit || typeof hit !== 'object' || hit === null) {
    return null
  }
  const payload = hit as CachedHttpPayload
  if (
    typeof payload.body !== 'string' ||
    typeof payload.etag !== 'string' ||
    typeof payload.status !== 'number' ||
    payload.status !== 200
  ) {
    return null
  }
  return payload
}

export async function writeRuntimeCache(
  key: string,
  value: CachedHttpPayload,
  tags: string[],
  ttlSeconds: number,
): Promise<void> {
  if (value.status !== 200) {
    return
  }
  await cache.set(key, value, { tags, ttl: ttlSeconds })
}

const CONTENT_CACHE_TAGS = (contentId: string) => [
  `content:${contentId}`,
  'content:list',
  'content',
  'blog',
  'blog:list',
]

/** Runtime cache + CDN tag purge; never throws. */
export async function invalidatePublishedContentCache(
  contentId: string,
): Promise<void> {
  const tags = CONTENT_CACHE_TAGS(contentId)
  try {
    await cache.expireTag(tags)
  } catch (error) {
    console.error('invalidatePublishedContentCache expireTag failed', error)
  }
  try {
    await invalidateByTag(tags)
  } catch (error) {
    console.error(
      'invalidatePublishedContentCache invalidateByTag failed',
      error,
    )
  }
}

export async function expireContentCacheTags(contentId: string): Promise<void> {
  await invalidatePublishedContentCache(contentId)
}
