export const SETUP_CACHE_HEADERS = {
  'Cache-Control': 'private, no-store',
  'X-Robots-Tag': 'noindex, nofollow',
} as const

export function shouldRedirectToSetup(input: {
  dev: boolean
  pathname: string
  ok: boolean
}): boolean {
  if (!input.dev || input.ok) return false
  const path =
    input.pathname.length > 1
      ? input.pathname.replace(/\/+$/, '')
      : input.pathname
  return path !== '/setup'
}
