import { safeInternalPath } from './path'

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export function parseEmail(value: unknown) {
  if (typeof value !== 'string') {
    throw new Error('Enter a valid email address')
  }

  const email = value.trim().toLowerCase()
  if (email.length > 255 || !EMAIL_PATTERN.test(email)) {
    throw new Error('Enter a valid email address')
  }

  return email
}

export function parsePassword(value: unknown) {
  if (typeof value !== 'string') {
    throw new Error('Enter a password')
  }

  if (value.length < 8 || value.length > 72) {
    throw new Error('Password must be 8 to 72 characters')
  }

  return value
}

export const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
const ROLE_CODE_PATTERN = /^[a-z][a-z0-9_]{0,63}$/

export function parseUserId(value: unknown) {
  if (typeof value !== 'string' || !UUID_PATTERN.test(value)) {
    throw new Error('Invalid user')
  }

  return value
}

export function parseRoleCode(value: unknown) {
  if (typeof value !== 'string' || !ROLE_CODE_PATTERN.test(value)) {
    throw new Error('Invalid role')
  }

  return value
}

export function parseBoolean(value: unknown) {
  if (typeof value !== 'boolean') {
    throw new Error('Invalid value')
  }

  return value
}

/** HTML checkbox: present means remember; absent means session cookie. */
export function parseRememberMe(value: unknown) {
  if (value === false || value === 'false' || value === '0') {
    return false
  }
  if (value === true || value === 'true' || value === 'on' || value === '1') {
    return true
  }
  return false
}

export function parseOptionalRedirect(value: unknown) {
  if (value === undefined || value === null || value === '') {
    return undefined
  }

  if (typeof value !== 'string') {
    throw new Error('Invalid redirect')
  }

  const path = safeInternalPath(value, null)
  return path ?? undefined
}

export const DIRECTORY_PAGE_SIZE = 25
export const DIRECTORY_QUERY_MAX = 64
const DIRECTORY_MAX_PAGE = 1000

export type DirectoryQuery = {
  q: string | undefined
  role: string | undefined
  page: number
}

/** Shared by the route `validateSearch` and the server fn validator. Never throws. */
export function parseDirectoryQuery(input: unknown): DirectoryQuery {
  const data =
    typeof input === 'object' && input !== null
      ? (input as Record<string, unknown>)
      : {}

  const q =
    typeof data.q === 'string'
      ? data.q.trim().slice(0, DIRECTORY_QUERY_MAX) || undefined
      : undefined
  const role =
    typeof data.role === 'string' && ROLE_CODE_PATTERN.test(data.role)
      ? data.role
      : undefined
  const rawPage = typeof data.page === 'number' ? data.page : Number(data.page)
  const page =
    Number.isInteger(rawPage) && rawPage >= 1 && rawPage <= DIRECTORY_MAX_PAGE
      ? rawPage
      : 1

  return { q, role, page }
}

/** Escape LIKE wildcards so user input is matched literally by `ilike`. */
export function escapeLike(value: string) {
  return value.replace(/[\\%_]/g, (char) => `\\${char}`)
}

/** Quote a PostgREST filter value so commas and operators cannot inject extra clauses. */
export function quotePostgrestFilterValue(value: string): string {
  return `"${value.replace(/\\/g, '\\\\').replace(/"/g, '\\"')}"`
}
