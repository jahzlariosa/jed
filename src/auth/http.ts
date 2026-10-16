import { NOINDEX_HEADERS } from '#/lib/seo'

export const AUTH_PAGE_HEADERS = {
  'Cache-Control': 'private, no-store',
  ...NOINDEX_HEADERS,
} as const

/** Login, signup, and password recovery — never preload or cache in the router. */
export const AUTH_PAGE_CACHE = {
  staleTime: 0,
  gcTime: 0,
  preload: false,
} as const

/** Signed-in app shell: HTTP stays private; router may reuse session for in-app navigations. */
export const PRIVATE_ROUTE_HEADERS = {
  'Cache-Control': 'private, no-store',
  ...NOINDEX_HEADERS,
} as const

export const PRIVATE_ROUTE_CACHE = {
  staleTime: 60_000,
  gcTime: 300_000,
} as const

/** Admin routes: reuse loaders across sidebar navigation; invalidate after writes. */
export const ADMIN_ROUTE_CACHE = {
  staleTime: 60_000,
  gcTime: 300_000,
  preloadStaleTime: 60_000,
} as const

/** Admin list screens: stale-while-revalidate via router loader cache. */
export const ADMIN_LIST_ROUTE_CACHE = {
  staleTime: 60_000,
  gcTime: 300_000,
  preloadStaleTime: 60_000,
} as const
