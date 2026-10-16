const FALLBACK_PATH = '/account'
const MAX_PATH_LENGTH = 512
// biome-ignore lint/suspicious/noControlCharactersInRegex: intentionally rejects control characters in redirect paths
const CONTROL_CHARS = /[\u0000-\u001F\u007F]/

const APP_ORIGIN = 'https://app.local'

function decodePath(path: string) {
  let current = path

  for (let i = 0; i < 5; i += 1) {
    try {
      const next = decodeURIComponent(current)
      if (next === current) {
        return current
      }
      current = next
    } catch {
      return null
    }
  }

  return current
}

function hasTraversal(pathname: string): boolean {
  const segments = pathname.split('/')
  return segments.some((segment) => segment === '..' || segment === '.')
}

/**
 * Same-origin relative path only. Returns null when invalid (callers choose fallback).
 */
export function safeInternalPath(
  path: string | undefined,
  fallback: string | null = FALLBACK_PATH,
): string | null {
  if (!path || path.length > MAX_PATH_LENGTH) {
    return fallback
  }

  const trimmed = path.trim()
  const decoded = decodePath(trimmed)
  if (!decoded || CONTROL_CHARS.test(decoded)) {
    return fallback
  }

  if (
    decoded.includes('/../') ||
    decoded.includes('/..') ||
    decoded.startsWith('../') ||
    decoded.includes('\\')
  ) {
    return fallback
  }

  let url: URL
  try {
    url = new URL(decoded, APP_ORIGIN)
  } catch {
    return fallback
  }

  if (url.origin !== APP_ORIGIN) {
    return fallback
  }

  const pathname = url.pathname
  if (!pathname.startsWith('/') || pathname.startsWith('//')) {
    return fallback
  }

  if (hasTraversal(pathname)) {
    return fallback
  }

  if (decoded.includes('://') || url.search.includes('://')) {
    return fallback
  }

  const result = `${pathname}${url.search}${url.hash}`
  return result.length > MAX_PATH_LENGTH ? fallback : result
}
