import { parseDirectoryQuery, type DirectoryQuery } from '#/auth/validators'

export const USERS_DIRECTORY_PAGE_SIZES = [10, 25, 50, 100] as const

export type UsersDirectoryPageSize = (typeof USERS_DIRECTORY_PAGE_SIZES)[number]

export type UsersAccountStatus = 'active' | 'banned' | 'unconfirmed'

export type UsersMfaFilter = 'enabled' | 'disabled'

export type UsersDirectoryQuery = DirectoryQuery & {
  pageSize: UsersDirectoryPageSize
  status?: UsersAccountStatus
  mfa?: UsersMfaFilter
  createdFrom?: string
  createdTo?: string
}

const STATUS_VALUES = new Set<UsersAccountStatus>([
  'active',
  'banned',
  'unconfirmed',
])

const MFA_VALUES = new Set<UsersMfaFilter>(['enabled', 'disabled'])

const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/

function parseOptionalDate(value: unknown): string | undefined {
  if (typeof value !== 'string') {
    return undefined
  }
  const trimmed = value.trim()
  if (!trimmed || !DATE_PATTERN.test(trimmed)) {
    return undefined
  }
  const parsed = new Date(`${trimmed}T00:00:00.000Z`)
  if (Number.isNaN(parsed.getTime())) {
    return undefined
  }
  return trimmed
}

function parsePageSize(value: unknown): UsersDirectoryPageSize {
  const raw =
    typeof value === 'number' ? value : Number.parseInt(String(value ?? ''), 10)
  if (USERS_DIRECTORY_PAGE_SIZES.includes(raw as UsersDirectoryPageSize)) {
    return raw as UsersDirectoryPageSize
  }
  return 25
}

/** Shared by `/admin/users` search params and `listUsersAdminFn`. Never throws. */
export function parseUsersDirectoryQuery(input: unknown): UsersDirectoryQuery {
  const base = parseDirectoryQuery(input)
  const data =
    typeof input === 'object' && input !== null
      ? (input as Record<string, unknown>)
      : {}

  const statusRaw = typeof data.status === 'string' ? data.status : undefined
  const status = STATUS_VALUES.has(statusRaw as UsersAccountStatus)
    ? (statusRaw as UsersAccountStatus)
    : undefined

  const mfaRaw = typeof data.mfa === 'string' ? data.mfa : undefined
  const mfa = MFA_VALUES.has(mfaRaw as UsersMfaFilter)
    ? (mfaRaw as UsersMfaFilter)
    : undefined

  return {
    ...base,
    pageSize: parsePageSize(data.pageSize),
    status,
    mfa,
    createdFrom: parseOptionalDate(data.createdFrom),
    createdTo: parseOptionalDate(data.createdTo),
  }
}

export function usersDirectoryPageCount(
  total: number,
  pageSize: number,
): number {
  if (total <= 0) {
    return 1
  }
  return Math.max(1, Math.ceil(total / pageSize))
}

export function usersDirectoryRowRange(
  page: number,
  pageSize: number,
  total: number,
): { from: number; to: number } {
  if (total <= 0) {
    return { from: 0, to: 0 }
  }
  const from = (page - 1) * pageSize + 1
  const to = Math.min(page * pageSize, total)
  return { from, to }
}

/** Loader cache key: directory filters only (excludes tab). */
export function usersDirectoryLoaderDeps(
  search: UsersDirectoryQuery & { tab?: string },
) {
  const query = parseUsersDirectoryQuery(search)
  return {
    q: query.q,
    role: query.role,
    page: query.page,
    pageSize: query.pageSize,
    status: query.status,
    mfa: query.mfa,
    createdFrom: query.createdFrom,
    createdTo: query.createdTo,
  }
}

type UsersMembersSearchPatch = Partial<UsersDirectoryQuery> & {
  tab?: string
}

/** Router search for /admin/users; `in patch` clears filters when set to undefined. */
export function buildUsersMembersRouteSearch(
  current: UsersDirectoryQuery & { tab: string },
  patch: UsersMembersSearchPatch,
): UsersDirectoryQuery & { tab: string } {
  const merged = {
    tab: patch.tab ?? current.tab,
    page: patch.page ?? current.page,
    pageSize: patch.pageSize ?? current.pageSize,
    q: 'q' in patch ? patch.q : current.q,
    role: 'role' in patch ? patch.role : current.role,
    status: 'status' in patch ? patch.status : current.status,
    mfa: 'mfa' in patch ? patch.mfa : current.mfa,
    createdFrom:
      'createdFrom' in patch ? patch.createdFrom : current.createdFrom,
    createdTo: 'createdTo' in patch ? patch.createdTo : current.createdTo,
  }
  const query = parseUsersDirectoryQuery(merged)
  return {
    tab: merged.tab,
    ...query,
  }
}
