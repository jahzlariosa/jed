import { describe, expect, it } from 'vitest'

import {
  auditDirectoryPageCount,
  parseAuditDirectoryQuery,
  resolveAuditQueryBounds,
  resolveAuditRangeFromPreset,
} from './audit-directory-query'

describe('parseAuditDirectoryQuery', () => {
  it('defaults page size to 25', () => {
    expect(parseAuditDirectoryQuery({ page: 1 }).pageSize).toBe(25)
  })

  it('parses filters and pagination', () => {
    const actorId = 'a1b2c3d4-e5f6-4789-a012-3456789abcde'
    expect(
      parseAuditDirectoryQuery({
        q: 'user',
        page: 2,
        pageSize: 50,
        action: 'user.role',
        actorId,
        targetType: 'user',
        preset: '7d',
      }),
    ).toEqual({
      q: 'user',
      role: undefined,
      page: 2,
      pageSize: 50,
      action: 'user.role',
      actorId,
      targetType: 'user',
      from: undefined,
      to: undefined,
      preset: '7d',
    })
  })

  it('drops invalid tokens and uuids', () => {
    const parsed = parseAuditDirectoryQuery({
      action: '!!!',
      actorId: 'not-a-uuid',
      targetType: '',
      preset: '99d',
    })
    expect(parsed.action).toBeUndefined()
    expect(parsed.actorId).toBeUndefined()
    expect(parsed.preset).toBeUndefined()
  })

  it('accepts utc iso bounds', () => {
    const from = '2026-01-01T00:00:00.000Z'
    const to = '2026-02-01T00:00:00.000Z'
    const parsed = parseAuditDirectoryQuery({ from, to })
    expect(parsed.from).toBe(from)
    expect(parsed.to).toBe(to)
  })
})

describe('auditDirectoryPageCount', () => {
  it('computes page count', () => {
    expect(auditDirectoryPageCount(0, 25)).toBe(1)
    expect(auditDirectoryPageCount(26, 25)).toBe(2)
  })
})

describe('resolveAuditRangeFromPreset', () => {
  it('returns a one-hour window ending at now', () => {
    const now = new Date('2026-06-15T12:00:00.000Z')
    const range = resolveAuditRangeFromPreset('1h', now)
    expect(range.to).toBe(now.toISOString())
    expect(range.from).toBe('2026-06-15T11:00:00.000Z')
  })
})

describe('resolveAuditQueryBounds', () => {
  it('prefers preset over explicit from/to', () => {
    const now = new Date('2026-06-15T12:00:00.000Z')
    const bounds = resolveAuditQueryBounds(
      {
        q: undefined,
        role: undefined,
        page: 1,
        pageSize: 25,
        action: undefined,
        actorId: undefined,
        targetType: undefined,
        from: '2020-01-01T00:00:00.000Z',
        to: '2020-02-01T00:00:00.000Z',
        preset: '24h',
      },
      now,
    )
    expect(bounds.to).toBe(now.toISOString())
    expect(bounds.from).toBe('2026-06-14T12:00:00.000Z')
  })
})
