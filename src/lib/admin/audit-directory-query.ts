import { parseDirectoryQuery } from '#/auth/validators'
import { USERS_DIRECTORY_PAGE_SIZES } from '#/auth/users-directory-query'

import { utcIsoToSiteWallInput } from './audit-timezone'

export const AUDIT_DIRECTORY_PAGE_SIZES = USERS_DIRECTORY_PAGE_SIZES

export type AuditDirectoryPageSize = (typeof AUDIT_DIRECTORY_PAGE_SIZES)[number]

export type AuditRangePreset = '1h' | '24h' | '7d' | '30d'

export type AuditDirectoryQuery = {
  q: string | undefined
  role: string | undefined
  page: number
  pageSize: AuditDirectoryPageSize
  action: string | undefined
  actorId: string | undefined
  targetType: string | undefined
  from: string | undefined
  to: string | undefined
  preset: AuditRangePreset | undefined
}

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

const ACTION_PATTERN = /^[a-z][a-z0-9._-]{0,79}$/i
const TARGET_TYPE_PATTERN = /^[a-z][a-z0-9._-]{0,63}$/i

const PRESET_VALUES = new Set<AuditRangePreset>(['1h', '24h', '7d', '30d'])

function parsePageSize(value: unknown): AuditDirectoryPageSize {
  const raw =
    typeof value === 'number' ? value : Number.parseInt(String(value ?? ''), 10)
  if (AUDIT_DIRECTORY_PAGE_SIZES.includes(raw as AuditDirectoryPageSize)) {
    return raw as AuditDirectoryPageSize
  }
  return 25
}

function parseOptionalUuid(value: unknown): string | undefined {
  if (typeof value !== 'string') {
    return undefined
  }
  const trimmed = value.trim()
  return UUID_PATTERN.test(trimmed) ? trimmed : undefined
}

function parseOptionalToken(
  value: unknown,
  pattern: RegExp,
  maxLen: number,
): string | undefined {
  if (typeof value !== 'string') {
    return undefined
  }
  const trimmed = value.trim().slice(0, maxLen)
  if (!trimmed || !pattern.test(trimmed)) {
    return undefined
  }
  return trimmed
}

function parseOptionalUtcIso(value: unknown): string | undefined {
  if (typeof value !== 'string') {
    return undefined
  }
  const trimmed = value.trim()
  if (!trimmed) {
    return undefined
  }
  const date = new Date(trimmed)
  if (Number.isNaN(date.getTime())) {
    return undefined
  }
  return date.toISOString()
}

export function parseAuditDirectoryQuery(input: unknown): AuditDirectoryQuery {
  const base = parseDirectoryQuery(input)
  const data =
    typeof input === 'object' && input !== null
      ? (input as Record<string, unknown>)
      : {}

  const presetRaw = typeof data.preset === 'string' ? data.preset : undefined
  const preset = PRESET_VALUES.has(presetRaw as AuditRangePreset)
    ? (presetRaw as AuditRangePreset)
    : undefined

  return {
    q: base.q,
    role: base.role,
    page: base.page,
    pageSize: parsePageSize(data.pageSize),
    action: parseOptionalToken(data.action, ACTION_PATTERN, 80),
    actorId: parseOptionalUuid(data.actorId),
    targetType: parseOptionalToken(data.targetType, TARGET_TYPE_PATTERN, 64),
    from: parseOptionalUtcIso(data.from),
    to: parseOptionalUtcIso(data.to),
    preset,
  }
}

export function auditDirectoryPageCount(
  total: number,
  pageSize: number,
): number {
  if (total <= 0) {
    return 1
  }
  return Math.max(1, Math.ceil(total / pageSize))
}

export function resolveAuditRangeFromPreset(
  preset: AuditRangePreset,
  now: Date = new Date(),
): { from: string; to: string } {
  const to = now.toISOString()
  const ms =
    preset === '1h'
      ? 60 * 60 * 1000
      : preset === '24h'
        ? 24 * 60 * 60 * 1000
        : preset === '7d'
          ? 7 * 24 * 60 * 60 * 1000
          : 30 * 24 * 60 * 60 * 1000
  return {
    from: new Date(now.getTime() - ms).toISOString(),
    to,
  }
}

export function resolveAuditQueryBounds(
  query: AuditDirectoryQuery,
  now: Date = new Date(),
): { from?: string; to?: string } {
  if (query.preset) {
    return resolveAuditRangeFromPreset(query.preset, now)
  }
  return {
    from: query.from,
    to: query.to,
  }
}

export function auditWallInputsFromQuery(
  query: AuditDirectoryQuery,
  timeZone: string,
): { fromLocal: string; toLocal: string } {
  return {
    fromLocal: query.from
      ? (utcIsoToSiteWallInput(query.from, timeZone) ?? '')
      : '',
    toLocal: query.to ? (utcIsoToSiteWallInput(query.to, timeZone) ?? '') : '',
  }
}
