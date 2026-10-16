import { describe, expect, it } from 'vitest'

import {
  buildUsersMembersRouteSearch,
  parseUsersDirectoryQuery,
  usersDirectoryLoaderDeps,
  usersDirectoryPageCount,
  usersDirectoryRowRange,
} from './users-directory-query'

describe('parseUsersDirectoryQuery', () => {
  it('defaults page size to 25', () => {
    expect(parseUsersDirectoryQuery({ page: 1 }).pageSize).toBe(25)
  })

  it('accepts allowed page sizes', () => {
    expect(parseUsersDirectoryQuery({ pageSize: 50 }).pageSize).toBe(50)
  })

  it('rejects invalid page sizes', () => {
    expect(parseUsersDirectoryQuery({ pageSize: 15 }).pageSize).toBe(25)
  })

  it('parses filters and dates', () => {
    expect(
      parseUsersDirectoryQuery({
        q: 'ada',
        role: 'editor',
        status: 'active',
        mfa: 'enabled',
        createdFrom: '2026-01-01',
        createdTo: '2026-02-01',
        page: 2,
        pageSize: 10,
      }),
    ).toEqual({
      q: 'ada',
      role: 'editor',
      page: 2,
      pageSize: 10,
      status: 'active',
      mfa: 'enabled',
      createdFrom: '2026-01-01',
      createdTo: '2026-02-01',
    })
  })

  it('drops invalid status and mfa', () => {
    const parsed = parseUsersDirectoryQuery({
      status: 'deleted',
      mfa: 'maybe',
    })
    expect(parsed.status).toBeUndefined()
    expect(parsed.mfa).toBeUndefined()
  })
})

describe('usersDirectoryLoaderDeps', () => {
  it('includes role in loader deps so directory refetches on filter change', () => {
    expect(
      usersDirectoryLoaderDeps({
        tab: 'members',
        page: 1,
        pageSize: 25,
        q: undefined,
        role: 'editor',
      }),
    ).toMatchObject({ role: 'editor', page: 1, pageSize: 25 })
  })
})

describe('buildUsersMembersRouteSearch', () => {
  const base = {
    tab: 'members',
    page: 2,
    pageSize: 25 as const,
    role: 'admin' as string | undefined,
    q: 'ada' as string | undefined,
  }

  it('clears role when patch sets role to undefined', () => {
    const next = buildUsersMembersRouteSearch(base, {
      role: undefined,
      page: 1,
    })
    expect(next.role).toBeUndefined()
    expect(next.page).toBe(1)
    expect(next.tab).toBe('members')
  })

  it('sets role from patch', () => {
    const next = buildUsersMembersRouteSearch(
      { tab: 'members', page: 1, pageSize: 25, q: undefined, role: undefined },
      { role: 'editor' },
    )
    expect(next.role).toBe('editor')
  })
})

describe('usersDirectoryPageCount', () => {
  it('computes page count from total and page size', () => {
    expect(usersDirectoryPageCount(0, 25)).toBe(1)
    expect(usersDirectoryPageCount(26, 25)).toBe(2)
  })
})

describe('usersDirectoryRowRange', () => {
  it('returns inclusive row range for the current page', () => {
    expect(usersDirectoryRowRange(2, 25, 60)).toEqual({ from: 26, to: 50 })
    expect(usersDirectoryRowRange(1, 25, 0)).toEqual({ from: 0, to: 0 })
  })
})
