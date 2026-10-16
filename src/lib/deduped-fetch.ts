import { clearAdminPageCache } from '#/lib/admin-page-cache'

/**
 * Share one in-flight promise between concurrent callers with the same key.
 * Server-safe: on the server every call runs fresh.
 */
const inflight = new Map<string, Promise<unknown>>()

export function dedupedFetch<T>(
  key: string,
  load: () => Promise<T>,
): Promise<T> {
  if (typeof window === 'undefined') {
    return load()
  }
  const hit = inflight.get(key)
  if (hit) {
    return hit as Promise<T>
  }
  const pending = load()
  inflight.set(key, pending)
  const cleanup = () => {
    if (inflight.get(key) === pending) {
      inflight.delete(key)
    }
  }
  pending.then(cleanup, cleanup)
  return pending
}

type CacheEntry = {
  at: number
  promise: Promise<unknown>
}

const CACHE_LIMIT = 20
const ttlCache = new Map<string, CacheEntry>()

/** Client TTL cache for `beforeLoad` session/shell data. */
export function cachedFetch<T>(
  key: string,
  ttlMs: number,
  load: () => Promise<T>,
): Promise<T> {
  if (typeof window === 'undefined') {
    return load()
  }
  const hit = ttlCache.get(key)
  if (hit && Date.now() - hit.at < ttlMs) {
    return hit.promise as Promise<T>
  }
  if (ttlCache.size >= CACHE_LIMIT) {
    const now = Date.now()
    for (const [storedKey, entry] of ttlCache) {
      if (now - entry.at >= ttlMs) {
        ttlCache.delete(storedKey)
      }
    }
    if (ttlCache.size >= CACHE_LIMIT) {
      ttlCache.clear()
    }
  }
  const promise = dedupedFetch(key, load)
  ttlCache.set(key, { at: Date.now(), promise })
  promise.then(
    () => {},
    () => {
      if (ttlCache.get(key)?.promise === promise) {
        ttlCache.delete(key)
      }
    },
  )
  return promise
}

export function clearFetchCache(prefix?: string) {
  if (typeof window === 'undefined') {
    return
  }
  if (!prefix) {
    ttlCache.clear()
    clearAdminPageCache()
    return
  }
  for (const key of ttlCache.keys()) {
    if (key === prefix || key.startsWith(`${prefix}:`)) {
      ttlCache.delete(key)
    }
  }
  clearAdminPageCache(prefix)
}
