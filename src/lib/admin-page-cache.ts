export const LAZY_PAGE_STALE_MS = 60_000

const pageCache = new Map<string, { at: number; value: unknown }>()
const cacheListeners = new Map<string, Set<() => void>>()
const PAGE_CACHE_LIMIT = 12

function notifyCacheListeners(key: string) {
  const listeners = cacheListeners.get(key)
  if (!listeners) {
    return
  }
  for (const listener of listeners) {
    listener()
  }
}

function subscribeCache(key: string, listener: () => void) {
  const set = cacheListeners.get(key) ?? new Set()
  set.add(listener)
  cacheListeners.set(key, set)
  return () => {
    set.delete(listener)
    if (set.size === 0) {
      cacheListeners.delete(key)
    }
  }
}

function readCache<T>(key: string): T | null {
  const hit = pageCache.get(key)
  return (hit?.value ?? null) as T | null
}

function writeCache(key: string, value: unknown) {
  if (!pageCache.has(key) && pageCache.size >= PAGE_CACHE_LIMIT) {
    const oldest = pageCache.keys().next()
    if (!oldest.done) {
      pageCache.delete(oldest.value)
    }
  }
  pageCache.set(key, { at: Date.now(), value })
}

function isCacheFresh(key: string): boolean {
  const hit = pageCache.get(key)
  if (!hit) {
    return false
  }
  return Date.now() - hit.at < LAZY_PAGE_STALE_MS
}

const prefetching = new Set<string>()

export function prefetchAdminPageData<T>(key: string, load: () => Promise<T>) {
  if (isCacheFresh(key) || prefetching.has(key)) {
    return
  }
  prefetching.add(key)
  load()
    .then((value) => {
      writeCache(key, value)
      notifyCacheListeners(key)
    })
    .catch(() => undefined)
    .finally(() => {
      prefetching.delete(key)
    })
}

export function invalidateAdminPageCache(prefix: string) {
  for (const key of pageCache.keys()) {
    if (key === prefix || key.startsWith(`${prefix}:`)) {
      pageCache.delete(key)
    }
  }
  notifyCacheListeners(prefix)
}

export function clearAdminPageCache(prefix?: string) {
  if (!prefix) {
    pageCache.clear()
    for (const key of [...cacheListeners.keys()]) {
      notifyCacheListeners(key)
    }
    return
  }
  for (const key of pageCache.keys()) {
    if (key === prefix || key.startsWith(`${prefix}:`)) {
      pageCache.delete(key)
      notifyCacheListeners(key)
    }
  }
}

export const adminPageCacheInternals = {
  readCache,
  writeCache,
  isCacheFresh,
  subscribeCache,
}
