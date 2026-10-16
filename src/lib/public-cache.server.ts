import '@tanstack/react-start/server-only'

const TTL_MS = 60_000
const MAX_ENTRIES = 32

type Entry = { at: number; value: unknown }

const store = new Map<string, Entry>()

export function readPublicCache<T>(key: string): T | null {
  const hit = store.get(key)
  if (!hit) {
    return null
  }
  if (Date.now() - hit.at > TTL_MS) {
    store.delete(key)
    return null
  }
  return hit.value as T
}

export function writePublicCache(key: string, value: unknown) {
  if (!store.has(key) && store.size >= MAX_ENTRIES) {
    const oldest = store.keys().next()
    if (!oldest.done) {
      store.delete(oldest.value)
    }
  }
  store.set(key, { at: Date.now(), value })
}

export function clearPublicCache(prefix?: string) {
  if (!prefix) {
    store.clear()
    return
  }
  for (const key of store.keys()) {
    if (key === prefix || key.startsWith(`${prefix}:`)) {
      store.delete(key)
    }
  }
}
