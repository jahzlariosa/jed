import { useEffect, useRef, useState } from 'react'

import {
  adminPageCacheInternals,
  LAZY_PAGE_STALE_MS,
  prefetchAdminPageData,
  invalidateAdminPageCache,
} from '#/lib/admin-page-cache'
import {
  AdminTableError,
  AdminTableLoading,
} from '#/components/admin/admin-table-states'

export type LazyData<T> = {
  data: T | null
  error: string
  retry: () => void
}

export { LAZY_PAGE_STALE_MS, prefetchAdminPageData as prefetchLazyData }
export { invalidateAdminPageCache as invalidateLazyData }

const { readCache, writeCache, isCacheFresh, subscribeCache } =
  adminPageCacheInternals

export function useLazyData<T>(
  load: () => Promise<T>,
  key: string,
): LazyData<T> {
  const [data, setData] = useState<T | null>(() => readCache<T>(key))
  const [error, setError] = useState('')
  const [attempt, setAttempt] = useState(0)
  const loadRef = useRef(load)
  loadRef.current = load

  useEffect(() => {
    return subscribeCache(key, () => {
      const cached = readCache<T>(key)
      if (cached !== null) {
        setData(cached)
      }
    })
  }, [key])

  useEffect(() => {
    void attempt
    let alive = true
    const warm = isCacheFresh(key)
    if (!warm) {
      setData(null)
      setError('')
    }
    loadRef
      .current()
      .then((value) => {
        if (!alive) {
          return
        }
        writeCache(key, value)
        setData(value)
        setError('')
      })
      .catch((cause: unknown) => {
        if (!alive || warm) {
          return
        }
        setError(
          cause instanceof Error && cause.message.length > 0
            ? cause.message
            : 'Unable to load',
        )
      })
    return () => {
      alive = false
    }
  }, [attempt, key])

  return {
    data,
    error,
    retry: () => {
      invalidateAdminPageCache(key)
      setAttempt((current) => current + 1)
    },
  }
}

export function LazyLoading({ label }: { label: string }) {
  return (
    <div>
      <span className="sr-only">{label}</span>
      <AdminTableLoading rows={8} />
    </div>
  )
}

export function LazyLoadError({
  message,
  onRetry,
}: {
  message: string
  onRetry: () => void
}) {
  return (
    <AdminTableError
      message={message.length > 0 ? message : 'Unable to load'}
      onRetry={onRetry}
    />
  )
}
