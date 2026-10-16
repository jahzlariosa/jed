import { describe, expect, it } from 'vitest'

import {
  contactInitials,
  contactRelativeTime,
  parseContactInboxQuery,
  parseContactStatusUpdate,
} from '#/lib/admin/contact-inbox-query'

const ID = '3f1c2a4e-1b2c-4d5e-8f90-123456789abc'

describe('parseContactInboxQuery', () => {
  it('defaults to the inbox tab, page 1 and 25 per page', () => {
    expect(parseContactInboxQuery({})).toEqual({
      q: undefined,
      status: 'inbox',
      id: undefined,
      page: 1,
      pageSize: 25,
    })
  })

  it('keeps known tabs and a valid selected id', () => {
    const query = parseContactInboxQuery({ status: 'unread', id: ID })
    expect(query.status).toBe('unread')
    expect(query.id).toBe(ID)
    expect(parseContactInboxQuery({ status: 'spam', id: 'x' })).toMatchObject({
      status: 'inbox',
      id: undefined,
    })
  })
})

describe('parseContactStatusUpdate', () => {
  it('requires a uuid and a known status', () => {
    expect(() =>
      parseContactStatusUpdate({ id: 'x', status: 'read' }),
    ).toThrow()
    expect(() =>
      parseContactStatusUpdate({ id: ID, status: 'deleted' }),
    ).toThrow()
    expect(parseContactStatusUpdate({ id: ID, status: 'read' })).toEqual({
      id: ID,
      status: 'read',
    })
  })
})

describe('inbox display helpers', () => {
  it('builds initials from the first two words', () => {
    expect(contactInitials('ana maria cruz')).toBe('AM')
    expect(contactInitials('  ')).toBe('?')
  })

  it('formats recent times relatively', () => {
    const now = new Date('2026-10-16T10:00:00Z')
    expect(contactRelativeTime('2026-10-16T09:59:30Z', now)).toBe('just now')
    expect(contactRelativeTime('2026-10-16T09:00:00Z', now)).toBe('1 hour ago')
  })
})
