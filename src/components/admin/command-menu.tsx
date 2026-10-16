import { useNavigate } from '@tanstack/react-router'
import { useServerFn } from '@tanstack/react-start'
import {
  FileText,
  Gear,
  Plus,
  Upload,
  Users,
  type Icon,
} from '@phosphor-icons/react'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'

import { ADMIN_NAV } from '#/components/admin/admin-nav'
import type { Permission } from '#/auth'
import { PERMISSIONS } from '#/auth'
import { searchAdminCommandFn } from '#/lib/cms/functions'
import {
  ADMIN_EDITOR_TAB_SEARCH,
  ADMIN_SETTINGS_TAB_SEARCH,
  ADMIN_USERS_TAB_SEARCH,
} from '#/lib/admin/admin-tab-defaults'
import { phosphorIcon } from '#/lib/icon'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'

type ContentHit = { id: string; title: string; status: string }
type UserHit = {
  userId: string
  email: string | null
  displayName: string | null
}

type CommandRow =
  | {
      id: string
      kind: 'nav'
      label: string
      icon: Icon
      to: string
    }
  | {
      id: string
      kind: 'action'
      label: string
      icon: Icon
      run: () => void
    }
  | {
      id: string
      kind: 'content'
      label: string
      contentId: string
      status: string
    }
  | {
      id: string
      kind: 'user'
      label: string
      email: string | null
      userId: string
    }

function useDebouncedValue(value: string, delayMs: number) {
  const [debounced, setDebounced] = useState(value)
  useEffect(() => {
    const id = window.setTimeout(() => setDebounced(value), delayMs)
    return () => window.clearTimeout(id)
  }, [value, delayMs])
  return debounced
}

export function AdminCommandMenu({
  open,
  onOpenChange,
  permissions,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  permissions: Permission[]
}) {
  const navigate = useNavigate()
  const searchContent = useServerFn(searchAdminCommandFn)
  const [query, setQuery] = useState('')
  const [contentHits, setContentHits] = useState<ContentHit[]>([])
  const [userHits, setUserHits] = useState<UserHit[]>([])
  const [contentPending, setContentPending] = useState(false)
  const [searchMessage, setSearchMessage] = useState<string | null>(null)
  const [activeIndex, setActiveIndex] = useState(0)
  const mountedRef = useRef(true)
  const debouncedQuery = useDebouncedValue(query, 200)

  const canContent = permissions.includes(PERMISSIONS.contentRead)
  const canMedia = permissions.includes(PERMISSIONS.mediaRead)
  const canSettings = permissions.includes(PERMISSIONS.settingsRead)

  const quickActions = useMemo((): CommandRow[] => {
    const rows: CommandRow[] = []
    if (canContent) {
      rows.push({
        id: 'action-new-post',
        kind: 'action',
        label: 'New post',
        icon: Plus,
        run: () => {
          void navigate({
            to: '/admin/posts/$postId',
            params: { postId: 'new' },
            search: ADMIN_EDITOR_TAB_SEARCH,
          })
        },
      })
      rows.push({
        id: 'action-new-page',
        kind: 'action',
        label: 'New page',
        icon: FileText,
        run: () => {
          void navigate({
            to: '/admin/content/$contentId',
            params: { contentId: 'new' },
            search: ADMIN_EDITOR_TAB_SEARCH,
          })
        },
      })
    }
    if (canMedia) {
      rows.push({
        id: 'action-upload',
        kind: 'action',
        label: 'Upload media',
        icon: Upload,
        run: () => {
          void navigate({ to: '/admin/media' })
        },
      })
    }
    if (canSettings) {
      rows.push({
        id: 'action-settings',
        kind: 'action',
        label: 'Open settings',
        icon: Gear,
        run: () => {
          void navigate({
            to: '/admin/settings',
            search: ADMIN_SETTINGS_TAB_SEARCH,
          })
        },
      })
    }
    return rows
  }, [canContent, canMedia, canSettings, navigate])

  const navItems = useMemo(
    () =>
      ADMIN_NAV.filter((item) => permissions.includes(item.permission)).filter(
        (item) => item.label.toLowerCase().includes(query.trim().toLowerCase()),
      ),
    [permissions, query],
  )

  const rows = useMemo((): CommandRow[] => {
    const trimmed = query.trim()
    const list: CommandRow[] = []
    if (trimmed.length === 0) {
      list.push(...quickActions)
    }
    for (const item of navItems) {
      list.push({
        id: `nav-${item.to}`,
        kind: 'nav',
        label: item.label,
        icon: item.icon,
        to: item.to,
      })
    }
    if (trimmed.length >= 2) {
      for (const row of userHits) {
        list.push({
          id: `user-${row.userId}`,
          kind: 'user',
          label: row.displayName ?? row.email ?? row.userId.slice(0, 8),
          email: row.email,
          userId: row.userId,
        })
      }
      for (const row of contentHits) {
        list.push({
          id: `content-${row.id}`,
          kind: 'content',
          label: row.title,
          contentId: row.id,
          status: row.status,
        })
      }
    }
    return list
  }, [contentHits, navItems, query, quickActions, userHits])

  useEffect(() => {
    mountedRef.current = true
    return () => {
      mountedRef.current = false
    }
  }, [])

  useEffect(() => {
    if (!open) {
      setQuery('')
      setContentHits([])
      setUserHits([])
      setContentPending(false)
      setSearchMessage(null)
      setActiveIndex(0)
    }
  }, [open])

  useEffect(() => {
    if (!open) {
      return
    }
    const trimmed = debouncedQuery.trim()
    if (trimmed.length < 2) {
      setContentHits([])
      setUserHits([])
      setContentPending(false)
      setSearchMessage(null)
      return
    }

    let cancelled = false
    setContentPending(true)
    setSearchMessage(null)
    void searchContent({ data: { q: trimmed } })
      .then((result) => {
        if (!cancelled && mountedRef.current) {
          setContentHits(result.content)
          setUserHits(result.users)
          setSearchMessage(result.message)
          setContentPending(false)
        }
      })
      .catch(() => {
        if (!cancelled && mountedRef.current) {
          setContentHits([])
          setUserHits([])
          setSearchMessage(null)
          setContentPending(false)
        }
      })

    return () => {
      cancelled = true
    }
  }, [debouncedQuery, open, searchContent])

  const activate = useCallback(
    (row: CommandRow) => {
      switch (row.kind) {
        case 'nav':
          void navigate({ to: row.to })
          break
        case 'action':
          row.run()
          break
        case 'content':
          void navigate({
            to: '/admin/content/$contentId',
            params: { contentId: row.contentId },
            search: ADMIN_EDITOR_TAB_SEARCH,
          })
          break
        case 'user':
          void navigate({
            to: '/admin/users',
            search: {
              ...ADMIN_USERS_TAB_SEARCH,
              q: row.email ?? row.label,
            },
          })
          break
        default:
          break
      }
      onOpenChange(false)
    },
    [navigate, onOpenChange],
  )

  useEffect(() => {
    if (!open) {
      return
    }
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        event.preventDefault()
        onOpenChange(false)
        return
      }
      if (rows.length === 0) {
        return
      }
      if (event.key === 'ArrowDown') {
        event.preventDefault()
        setActiveIndex((current) => (current + 1) % rows.length)
      }
      if (event.key === 'ArrowUp') {
        event.preventDefault()
        setActiveIndex((current) => (current - 1 + rows.length) % rows.length)
      }
      if (event.key === 'Enter') {
        event.preventDefault()
        const row = rows[activeIndex]
        if (row) {
          activate(row)
        }
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [activate, activeIndex, onOpenChange, open, rows])

  if (!open) {
    return null
  }

  const trimmed = query.trim()
  const showContent = trimmed.length >= 2
  const empty = rows.length === 0 && !contentPending && showContent

  return (
    <div className="admin-cmd-scrim">
      <button
        type="button"
        className="admin-cmd-scrim-hit"
        aria-label="Close command menu"
        onClick={() => onOpenChange(false)}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Command palette"
        className="admin-cmd-dialog"
      >
        <div className="admin-cmd-input">
          <Input
            autoFocus
            value={query}
            onChange={(event) => {
              setQuery(event.target.value)
              setActiveIndex(0)
            }}
            placeholder="Search pages, content, and users"
            aria-label="Command palette search"
            className="border-0 shadow-none focus-visible:ring-0"
          />
        </div>
        <div className="admin-cmd-results">
          {contentPending ? (
            <p className="px-3 py-4 text-center text-sm text-muted-foreground">
              Searching…
            </p>
          ) : null}
          {searchMessage ? (
            <p
              className="px-3 py-4 text-center text-sm text-muted-foreground"
              role="status"
            >
              {searchMessage}
            </p>
          ) : null}
          {rows.length > 0 ? (
            <ul>
              {rows.map((row, index) => {
                const active = index === activeIndex
                if (row.kind === 'nav' || row.kind === 'action') {
                  const Icon = row.icon
                  return (
                    <li key={row.id}>
                      <button
                        type="button"
                        className={cn('admin-cmd-hit', active && 'active')}
                        onMouseEnter={() => setActiveIndex(index)}
                        onClick={() => activate(row)}
                      >
                        <Icon
                          {...phosphorIcon}
                          className="size-4 shrink-0 text-current"
                          aria-hidden
                        />
                        <span className="truncate">{row.label}</span>
                        {row.kind === 'action' ? (
                          <span className="admin-cmd-kbd">Action</span>
                        ) : null}
                      </button>
                    </li>
                  )
                }
                if (row.kind === 'user') {
                  return (
                    <li key={row.id}>
                      <button
                        type="button"
                        className={cn('admin-cmd-hit', active && 'active')}
                        onMouseEnter={() => setActiveIndex(index)}
                        onClick={() => activate(row)}
                      >
                        <Users
                          {...phosphorIcon}
                          className="size-4 shrink-0 text-current"
                          aria-hidden
                        />
                        <span className="truncate">{row.label}</span>
                        {row.email ? (
                          <span className="admin-cmd-kbd truncate">
                            {row.email}
                          </span>
                        ) : null}
                      </button>
                    </li>
                  )
                }
                return (
                  <li key={row.id}>
                    <button
                      type="button"
                      className={cn('admin-cmd-hit', active && 'active')}
                      onMouseEnter={() => setActiveIndex(index)}
                      onClick={() => activate(row)}
                    >
                      <FileText
                        {...phosphorIcon}
                        className="size-4 shrink-0 text-current"
                        aria-hidden
                      />
                      <span className="truncate">{row.label}</span>
                      <span className="admin-cmd-kbd capitalize">
                        {row.status}
                      </span>
                    </button>
                  </li>
                )
              })}
            </ul>
          ) : null}
          {empty ? (
            <p className="px-3 py-6 text-center text-sm text-muted-foreground">
              No matches
            </p>
          ) : null}
          {!showContent && rows.length === 0 && !contentPending ? (
            <p className="px-3 py-6 text-center text-sm text-muted-foreground">
              Type to search or pick a quick action
            </p>
          ) : null}
        </div>
        <div className="admin-cmd-foot">
          <span>Esc close</span>
          <span>↑↓ move</span>
          <span>Enter run</span>
        </div>
      </div>
    </div>
  )
}
