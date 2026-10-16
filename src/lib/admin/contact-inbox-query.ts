import { parseDirectoryQuery } from '#/auth/validators'
import { USERS_DIRECTORY_PAGE_SIZES } from '#/auth/users-directory-query'

export const CONTACT_INBOX_PAGE_SIZES = USERS_DIRECTORY_PAGE_SIZES

export type ContactInboxPageSize = (typeof CONTACT_INBOX_PAGE_SIZES)[number]

export const CONTACT_MESSAGE_STATUSES = ['new', 'read', 'archived'] as const

export type ContactMessageStatus = (typeof CONTACT_MESSAGE_STATUSES)[number]

export const CONTACT_INBOX_TABS = ['inbox', 'unread', 'archived'] as const

export type ContactInboxTab = (typeof CONTACT_INBOX_TABS)[number]

export type ContactInboxQuery = {
  q: string | undefined
  status: ContactInboxTab
  id: string | undefined
  page: number
  pageSize: ContactInboxPageSize
}

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

export function isContactMessageStatus(
  value: unknown,
): value is ContactMessageStatus {
  return (
    typeof value === 'string' &&
    (CONTACT_MESSAGE_STATUSES as readonly string[]).includes(value)
  )
}

function isInboxTab(value: unknown): value is ContactInboxTab {
  return (
    typeof value === 'string' &&
    (CONTACT_INBOX_TABS as readonly string[]).includes(value)
  )
}

export function parseContactInboxQuery(input: unknown): ContactInboxQuery {
  const base = parseDirectoryQuery(input)
  const data =
    typeof input === 'object' && input !== null
      ? (input as Record<string, unknown>)
      : {}
  const rawSize =
    typeof data.pageSize === 'number'
      ? data.pageSize
      : Number.parseInt(String(data.pageSize ?? ''), 10)
  const pageSize = CONTACT_INBOX_PAGE_SIZES.includes(
    rawSize as ContactInboxPageSize,
  )
    ? (rawSize as ContactInboxPageSize)
    : 25
  const id = typeof data.id === 'string' ? data.id.trim() : ''
  return {
    q: base.q,
    status: isInboxTab(data.status) ? data.status : 'inbox',
    id: UUID_PATTERN.test(id) ? id : undefined,
    page: base.page,
    pageSize,
  }
}

export function parseContactStatusUpdate(input: unknown): {
  id: string
  status: ContactMessageStatus
} {
  const data =
    typeof input === 'object' && input !== null
      ? (input as Record<string, unknown>)
      : {}
  const id = typeof data.id === 'string' ? data.id.trim() : ''
  if (!UUID_PATTERN.test(id)) {
    throw new Error('Invalid message id')
  }
  if (!isContactMessageStatus(data.status)) {
    throw new Error('Invalid status')
  }
  return { id, status: data.status }
}

export function contactInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean)
  const letters = parts.slice(0, 2).map((part) => part.charAt(0).toUpperCase())
  return letters.join('') || '?'
}

export function contactRelativeTime(iso: string, now: Date = new Date()) {
  const diffSec = Math.round((new Date(iso).getTime() - now.getTime()) / 1000)
  const abs = Math.abs(diffSec)
  const rtf = new Intl.RelativeTimeFormat('en', { numeric: 'auto' })
  if (abs < 60) {
    return 'just now'
  }
  if (abs < 3600) {
    return rtf.format(Math.round(diffSec / 60), 'minute')
  }
  if (abs < 86400) {
    return rtf.format(Math.round(diffSec / 3600), 'hour')
  }
  if (abs < 86400 * 7) {
    return rtf.format(Math.round(diffSec / 86400), 'day')
  }
  return new Intl.DateTimeFormat('en', {
    month: 'short',
    day: 'numeric',
  }).format(new Date(iso))
}
