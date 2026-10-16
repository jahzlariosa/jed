import {
  Archive,
  ArrowBendUpLeft,
  CaretDown,
  CaretLeft,
  CaretRight,
  CaretUp,
  Copy,
  EnvelopeOpen,
  EnvelopeSimple,
  MagnifyingGlass,
  Tray,
  X,
} from '@phosphor-icons/react'
import { Link } from '@tanstack/react-router'
import { useServerFn } from '@tanstack/react-start'
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type KeyboardEvent,
  type ReactNode,
  type RefObject,
} from 'react'
import { toast } from 'sonner'

import { FieldHelpPopover } from '#/components/admin/field-help-popover'
import {
  CONTACT_INBOX_PAGE_SIZES,
  contactInitials,
  contactRelativeTime,
  type ContactInboxPageSize,
  type ContactInboxTab,
  type ContactMessageStatus,
} from '#/lib/admin/contact-inbox-query'
import {
  type ContactInboxPage,
  type ContactMessageRow,
  updateContactMessageStatusFn,
} from '#/lib/cms/contact-inbox-fns'
import { phosphorIcon } from '#/lib/icon'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetTitle,
} from '@/components/ui/sheet'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { cn } from '@/lib/utils'

const fullDate = new Intl.DateTimeFormat('en-US', {
  dateStyle: 'medium',
  timeStyle: 'short',
})

const TABS: Array<{ id: ContactInboxTab; label: string }> = [
  { id: 'inbox', label: 'Inbox' },
  { id: 'unread', label: 'Unread' },
  { id: 'archived', label: 'Archived' },
]

const ALERTS_HELP =
  'Every message is saved here. To also get an email for each one, set a contact email in Settings and add RESEND_API_KEY and CONTACT_FROM_EMAIL to the server environment.'

type Counts = ContactInboxPage['counts']

function belongsToTab(status: string, tab: ContactInboxTab) {
  if (tab === 'inbox') {
    return status !== 'archived'
  }
  if (tab === 'unread') {
    return status === 'new'
  }
  return status === 'archived'
}

export function countsAfterStatusChange(
  counts: Counts,
  from: string,
  to: string,
): Counts {
  if (from === to) {
    return counts
  }
  const next = { ...counts }
  const apply = (status: string, delta: number) => {
    if (status !== 'archived') {
      next.inbox += delta
    }
    if (status === 'new') {
      next.unread += delta
    }
    if (status === 'archived') {
      next.archived += delta
    }
  }
  apply(from, -1)
  apply(to, 1)
  return next
}

function useMediaQuery(query: string) {
  const [matches, setMatches] = useState(false)
  useEffect(() => {
    const media = window.matchMedia(query)
    const update = () => setMatches(media.matches)
    update()
    media.addEventListener('change', update)
    return () => media.removeEventListener('change', update)
  }, [query])
  return matches
}

function replyHref(row: ContactMessageRow) {
  return `mailto:${encodeURIComponent(row.email)}?subject=${encodeURIComponent('Re: Your message')}`
}

export function ContactInboxScreen({
  page,
  q,
  tab,
  selectedId,
  onSearchChange,
  onTabChange,
  onSelect,
  onPageChange,
  onPageSizeChange,
  onRefresh,
}: {
  page: ContactInboxPage
  q: string
  tab: ContactInboxTab
  selectedId?: string
  onSearchChange: (q: string) => void
  onTabChange: (tab: ContactInboxTab) => void
  onSelect: (id: string | undefined) => void
  onPageChange: (page: number) => void
  onPageSizeChange: (pageSize: ContactInboxPageSize) => void
  onRefresh: () => void
}) {
  const updateStatus = useServerFn(updateContactMessageStatusFn)
  const isLg = useMediaQuery('(min-width: 1024px)')
  const isMd = useMediaQuery('(min-width: 768px)')
  const [items, setItems] = useState(page.items)
  const [counts, setCounts] = useState(page.counts)
  const [extra, setExtra] = useState<ContactMessageRow | null>(page.selected)
  const rowRefs = useRef<Record<string, HTMLButtonElement | null>>({})
  const lastFocusedId = useRef<string | null>(null)

  useEffect(() => {
    setItems(page.items)
    setCounts(page.counts)
    setExtra(page.selected)
  }, [page])

  const selected =
    (selectedId && items.find((row) => row.id === selectedId)) ||
    (selectedId && extra?.id === selectedId ? extra : null) ||
    null
  const selectedIndex = selected
    ? items.findIndex((row) => row.id === selected.id)
    : -1
  const missing = Boolean(selectedId && !selected && page.selectedMissing)

  const applyLocal = useCallback(
    (row: ContactMessageRow, next: ContactMessageStatus) => {
      setItems((list) =>
        list.map((item) =>
          item.id === row.id ? { ...item, status: next } : item,
        ),
      )
      setExtra((current) =>
        current?.id === row.id ? { ...current, status: next } : current,
      )
      setCounts((current) => countsAfterStatusChange(current, row.status, next))
    },
    [],
  )

  const changeStatus = useCallback(
    async (row: ContactMessageRow, next: ContactMessageStatus) => {
      applyLocal(row, next)
      const result = await updateStatus({ data: { id: row.id, status: next } })
      if (!('ok' in result)) {
        applyLocal({ ...row, status: next }, row.status as ContactMessageStatus)
        toast.error('Could not update the message. Please try again.')
        return false
      }
      return true
    },
    [applyLocal, updateStatus],
  )

  // Mark as read when an unread message is opened.
  const markedRef = useRef<string | null>(null)
  useEffect(() => {
    if (
      selected &&
      selected.status === 'new' &&
      markedRef.current !== selected.id
    ) {
      markedRef.current = selected.id
      void changeStatus(selected, 'read')
    }
  }, [selected, changeStatus])

  function nextSelectionAfterLeaving(row: ContactMessageRow) {
    const index = items.findIndex((item) => item.id === row.id)
    const remaining = items.filter((item) => item.id !== row.id)
    return remaining[Math.min(Math.max(index, 0), remaining.length - 1)]?.id
  }

  async function runAction(row: ContactMessageRow, next: ContactMessageStatus) {
    const previous = row.status as ContactMessageStatus
    const leaves = !belongsToTab(next, tab)
    const nextId = leaves ? nextSelectionAfterLeaving(row) : row.id
    const ok = await changeStatus(row, next)
    if (!ok) {
      return
    }
    if (leaves) {
      if (isLg) {
        onSelect(nextId)
      } else {
        onSelect(undefined)
      }
    }
    const undo = {
      label: 'Undo',
      onClick: () => {
        void changeStatus({ ...row, status: next }, previous).then(() => {
          onRefresh()
        })
      },
    }
    if (next === 'archived') {
      toast('Message archived', { action: undo })
    } else if (next === 'new') {
      toast('Marked as unread')
    } else if (previous === 'archived') {
      toast('Moved to inbox', { action: undo })
    }
    onRefresh()
  }

  function onListKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    if (event.key !== 'ArrowDown' && event.key !== 'ArrowUp') {
      return
    }
    event.preventDefault()
    const ids = items.map((item) => item.id)
    const active = document.activeElement as HTMLElement | null
    const current = ids.findIndex((id) => rowRefs.current[id] === active)
    const delta = event.key === 'ArrowDown' ? 1 : -1
    const target =
      current < 0 ? 0 : Math.min(Math.max(current + delta, 0), ids.length - 1)
    rowRefs.current[ids[target]]?.focus()
  }

  function openRow(row: ContactMessageRow) {
    lastFocusedId.current = row.id
    onSelect(row.id)
  }

  function step(delta: number) {
    const target = items[selectedIndex + delta]
    if (target) {
      lastFocusedId.current = target.id
      onSelect(target.id)
    }
  }

  const overlayOpen = !isLg && Boolean(selectedId)

  const view = selected ? (
    <MessageView
      row={selected}
      hasPrev={selectedIndex > 0}
      hasNext={selectedIndex >= 0 && selectedIndex < items.length - 1}
      onPrev={() => step(-1)}
      onNext={() => step(1)}
      onClose={isLg ? undefined : () => onSelect(undefined)}
      onAction={(next) => void runAction(selected, next)}
      variant={isLg ? 'pane' : isMd ? 'dialog' : 'sheet'}
    />
  ) : missing ? (
    <MessageError onRetry={onRefresh} />
  ) : selectedId ? (
    <MessagePaneSkeleton />
  ) : null

  return (
    <TooltipProvider>
      <div className="grid w-full gap-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-1">
            <h1 className="text-2xl font-semibold tracking-tight">Inbox</h1>
            <FieldHelpPopover
              fieldLabel="Inbox email alerts"
              helpText={ALERTS_HELP}
            />
          </div>
          <div className="relative w-full sm:w-72">
            <MagnifyingGlass
              {...phosphorIcon}
              className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground"
            />
            <Input
              id="inbox-search"
              type="search"
              value={q}
              onChange={(event) => onSearchChange(event.target.value)}
              placeholder="Search name, email or message"
              className="pl-9"
              autoComplete="off"
              aria-label="Search messages"
            />
          </div>
        </div>

        <div className="admin-url-tabs overflow-x-auto">
          <div
            role="tablist"
            aria-label="Inbox folders"
            className="admin-tab-list"
          >
            {TABS.map((item) => {
              const active = item.id === tab
              return (
                <button
                  key={item.id}
                  type="button"
                  role="tab"
                  aria-selected={active}
                  tabIndex={active ? 0 : -1}
                  className={cn(
                    'admin-tab whitespace-nowrap',
                    active && 'admin-tab-active',
                  )}
                  onClick={() => onTabChange(item.id)}
                >
                  {item.label}
                  <span
                    className={cn(
                      'rounded-full px-2 text-xs',
                      active ? 'bg-primary/10 text-primary' : 'bg-muted',
                    )}
                  >
                    {counts[item.id]}
                  </span>
                </button>
              )
            })}
          </div>
        </div>

        {isLg ? (
          <div className="grid h-[calc(100vh-14rem)] min-h-[560px] grid-cols-[380px_1fr] admin-card divide-x divide-border overflow-hidden xl:grid-cols-[420px_1fr]">
            <MessageList
              page={page}
              items={items}
              q={q}
              tab={tab}
              selectedId={selectedId}
              rowRefs={rowRefs}
              onKeyDown={onListKeyDown}
              onOpen={openRow}
              onSearchChange={onSearchChange}
              onPageChange={onPageChange}
              onPageSizeChange={onPageSizeChange}
            />
            <div className="min-h-0 min-w-0">
              {view ?? (
                <div className="flex h-full flex-col items-center justify-center gap-3 text-muted-foreground">
                  <EnvelopeOpen {...phosphorIcon} className="size-10" />
                  <p className="text-sm">Select a message to read it</p>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="admin-card overflow-hidden">
            <MessageList
              page={page}
              items={items}
              q={q}
              tab={tab}
              selectedId={selectedId}
              rowRefs={rowRefs}
              onKeyDown={onListKeyDown}
              onOpen={openRow}
              onSearchChange={onSearchChange}
              onPageChange={onPageChange}
              onPageSizeChange={onPageSizeChange}
            />
          </div>
        )}

        {!isLg && isMd ? (
          <Dialog
            open={overlayOpen}
            onOpenChange={(open) => {
              if (!open) {
                onSelect(undefined)
              }
            }}
          >
            <DialogContent
              showCloseButton={false}
              className="flex max-h-[85vh] w-[calc(100vw-2rem)] max-w-2xl flex-col gap-0 overflow-hidden rounded-xl p-0 sm:max-w-2xl"
              onOpenAutoFocus={(event) => {
                event.preventDefault()
                document.getElementById('inbox-message-title')?.focus()
              }}
              onCloseAutoFocus={(event) => {
                event.preventDefault()
                if (lastFocusedId.current) {
                  rowRefs.current[lastFocusedId.current]?.focus()
                }
              }}
            >
              {view}
            </DialogContent>
          </Dialog>
        ) : null}

        {!isMd ? (
          <Sheet
            open={overlayOpen}
            onOpenChange={(open) => {
              if (!open) {
                onSelect(undefined)
              }
            }}
          >
            <SheetContent
              side="bottom"
              showCloseButton={false}
              className="h-[92vh] rounded-t-2xl"
              onOpenAutoFocus={(event) => {
                event.preventDefault()
                document.getElementById('inbox-message-title')?.focus()
              }}
              onCloseAutoFocus={(event) => {
                event.preventDefault()
                if (lastFocusedId.current) {
                  rowRefs.current[lastFocusedId.current]?.focus()
                }
              }}
            >
              <div
                className="mx-auto mt-3 h-1.5 w-10 shrink-0 rounded-full bg-muted"
                aria-hidden
              />
              {view}
            </SheetContent>
          </Sheet>
        ) : null}
      </div>
    </TooltipProvider>
  )
}

function MessageList({
  page,
  items,
  q,
  tab,
  selectedId,
  rowRefs,
  onKeyDown,
  onOpen,
  onSearchChange,
  onPageChange,
  onPageSizeChange,
}: {
  page: ContactInboxPage
  items: ContactMessageRow[]
  q: string
  tab: ContactInboxTab
  selectedId?: string
  rowRefs: RefObject<Record<string, HTMLButtonElement | null>>
  onKeyDown: (event: KeyboardEvent<HTMLDivElement>) => void
  onOpen: (row: ContactMessageRow) => void
  onSearchChange: (q: string) => void
  onPageChange: (page: number) => void
  onPageSizeChange: (pageSize: ContactInboxPageSize) => void
}) {
  const from = page.total === 0 ? 0 : (page.page - 1) * page.pageSize + 1
  const to = Math.min(page.page * page.pageSize, page.total)

  return (
    <div className="flex h-full min-h-0 flex-col">
      {/* biome-ignore lint/a11y/noStaticElementInteractions: arrow key navigation is delegated from the row buttons */}
      <div className="min-h-0 flex-1 overflow-y-auto" onKeyDown={onKeyDown}>
        {items.length === 0 ? (
          <ListEmpty q={q} tab={tab} onClearSearch={() => onSearchChange('')} />
        ) : (
          items.map((row) => {
            const unread = row.status === 'new'
            const active = row.id === selectedId
            return (
              <button
                key={row.id}
                ref={(node) => {
                  rowRefs.current[row.id] = node
                }}
                type="button"
                onClick={() => onOpen(row)}
                aria-current={active ? 'true' : undefined}
                className={cn(
                  'relative block w-full border-b border-border px-4 py-3 text-left outline-none transition-colors hover:bg-muted/50 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset',
                  unread && 'bg-muted/30',
                  active && 'bg-muted shadow-[inset_2px_0_0_0_var(--primary)]',
                )}
              >
                <div className="flex items-center gap-2">
                  {unread ? (
                    <span className="size-2 shrink-0 rounded-full bg-primary">
                      <span className="sr-only">Unread</span>
                    </span>
                  ) : null}
                  <span
                    className={cn(
                      'min-w-0 flex-1 truncate text-sm',
                      unread ? 'font-semibold' : 'font-medium',
                    )}
                  >
                    {row.name}
                  </span>
                  <span
                    className="shrink-0 text-xs text-muted-foreground"
                    title={fullDate.format(new Date(row.created_at))}
                  >
                    {contactRelativeTime(row.created_at)}
                  </span>
                </div>
                <div className="truncate text-xs text-muted-foreground">
                  {row.email}
                </div>
                <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">
                  {row.message}
                </p>
              </button>
            )
          })
        )}
      </div>
      <div className="sticky bottom-0 flex flex-wrap items-center justify-between gap-2 border-t border-border bg-background px-4 py-2 text-xs text-muted-foreground">
        <span>
          Showing {from} to {to} of {page.total}
        </span>
        <div className="flex items-center gap-2">
          <label className="sr-only" htmlFor="inbox-page-size">
            Rows per page
          </label>
          <select
            id="inbox-page-size"
            className="h-8 rounded-md border border-input bg-background px-2 text-xs"
            value={page.pageSize}
            onChange={(event) =>
              onPageSizeChange(
                Number(event.target.value) as ContactInboxPageSize,
              )
            }
          >
            {CONTACT_INBOX_PAGE_SIZES.map((size) => (
              <option key={size} value={size}>
                {size} rows
              </option>
            ))}
          </select>
          <Button
            variant="ghost"
            size="icon"
            className="size-8"
            aria-label="Previous page"
            disabled={page.page <= 1}
            onClick={() => onPageChange(page.page - 1)}
          >
            <CaretLeft {...phosphorIcon} className="size-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="size-8"
            aria-label="Next page"
            disabled={page.page >= page.pageCount}
            onClick={() => onPageChange(page.page + 1)}
          >
            <CaretRight {...phosphorIcon} className="size-4" />
          </Button>
        </div>
      </div>
    </div>
  )
}

function ListEmpty({
  q,
  tab,
  onClearSearch,
}: {
  q: string
  tab: ContactInboxTab
  onClearSearch: () => void
}) {
  if (q) {
    return (
      <EmptyBlock title="No messages match your search">
        <Button variant="outline" onClick={onClearSearch}>
          Clear search
        </Button>
      </EmptyBlock>
    )
  }
  if (tab === 'archived') {
    return <EmptyBlock title="Nothing archived" />
  }
  if (tab === 'unread') {
    return <EmptyBlock title="No unread messages" />
  }
  return (
    <EmptyBlock
      icon
      title="No messages yet"
      body="Messages sent from your contact form will show up here."
    >
      <Button asChild variant="outline">
        <Link to="/contact">View contact page</Link>
      </Button>
    </EmptyBlock>
  )
}

function EmptyBlock({
  icon,
  title,
  body,
  children,
}: {
  icon?: boolean
  title: string
  body?: string
  children?: ReactNode
}) {
  return (
    <div className="flex flex-col items-center px-6 py-16 text-center">
      {icon ? (
        <Tray
          {...phosphorIcon}
          className="mb-4 size-12 text-muted-foreground"
        />
      ) : null}
      <p className="font-medium">{title}</p>
      {body ? (
        <p className="mt-1 max-w-xs text-sm text-muted-foreground">{body}</p>
      ) : null}
      {children ? <div className="mt-4">{children}</div> : null}
    </div>
  )
}

function StatusBadge({ status }: { status: string }) {
  if (status === 'new') {
    return (
      <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
        New
      </span>
    )
  }
  if (status === 'archived') {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">
        <Archive {...phosphorIcon} className="size-3" />
        Archived
      </span>
    )
  }
  return (
    <span className="rounded-full border border-border px-2 py-0.5 text-xs font-medium text-muted-foreground">
      Read
    </span>
  )
}

function IconAction({
  label,
  shortcut,
  onClick,
  children,
}: {
  label: string
  shortcut: string
  onClick: () => void
  children: ReactNode
}) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="size-9"
          aria-label={label}
          aria-keyshortcuts={shortcut}
          onClick={onClick}
        >
          {children}
        </Button>
      </TooltipTrigger>
      <TooltipContent>
        {label} <kbd className="ml-1 font-mono">{shortcut}</kbd>
      </TooltipContent>
    </Tooltip>
  )
}

function isTypingTarget(target: EventTarget | null) {
  return (
    target instanceof HTMLElement &&
    (target.isContentEditable ||
      target.tagName === 'INPUT' ||
      target.tagName === 'TEXTAREA' ||
      target.tagName === 'SELECT')
  )
}

function MessageView({
  row,
  hasPrev,
  hasNext,
  onPrev,
  onNext,
  onClose,
  onAction,
  variant,
}: {
  row: ContactMessageRow
  hasPrev: boolean
  hasNext: boolean
  onPrev: () => void
  onNext: () => void
  onClose?: () => void
  onAction: (next: ContactMessageStatus) => void
  variant: 'pane' | 'dialog' | 'sheet'
}) {
  const archived = row.status === 'archived'
  const href = replyHref(row)
  const date = new Date(row.created_at)

  useEffect(() => {
    function onKey(event: globalThis.KeyboardEvent) {
      if (
        event.metaKey ||
        event.ctrlKey ||
        event.altKey ||
        isTypingTarget(event.target)
      ) {
        return
      }
      const key = event.key.toLowerCase()
      if (key === 'e') {
        event.preventDefault()
        onAction(archived ? 'read' : 'archived')
      } else if (key === 'u' && !archived) {
        event.preventDefault()
        onAction('new')
      } else if (key === 'r') {
        event.preventDefault()
        window.location.href = href
      } else if (key === 'escape' && variant === 'pane' && onClose) {
        onClose()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [archived, href, onAction, onClose, variant])

  async function copyEmail() {
    try {
      await navigator.clipboard.writeText(row.email)
      toast('Copied')
    } catch {
      toast.error('Could not copy the email address.')
    }
  }

  const TitleTag = variant === 'pane' ? 'h2' : null
  const titleClass = 'truncate text-base font-semibold outline-none'
  const descriptionText = `${row.email}, ${fullDate.format(date)}`

  const padX = variant === 'sheet' ? 'px-5' : 'px-6'

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className={cn('border-b border-border pt-6 pb-4', padX)}>
        <div className="flex items-start gap-3">
          <span
            className="flex size-10 shrink-0 items-center justify-center rounded-full bg-muted text-sm font-semibold"
            aria-hidden
          >
            {contactInitials(row.name)}
          </span>
          <div className="min-w-0 flex-1">
            {TitleTag ? (
              <h2 id="inbox-message-title" tabIndex={-1} className={titleClass}>
                {row.name}
              </h2>
            ) : variant === 'dialog' ? (
              <DialogTitle
                id="inbox-message-title"
                tabIndex={-1}
                className={titleClass}
              >
                {row.name}
              </DialogTitle>
            ) : (
              <SheetTitle
                id="inbox-message-title"
                tabIndex={-1}
                className={titleClass}
              >
                {row.name}
              </SheetTitle>
            )}
            {variant === 'dialog' ? (
              <DialogDescription className="sr-only">
                {descriptionText}
              </DialogDescription>
            ) : variant === 'sheet' ? (
              <SheetDescription className="sr-only">
                {descriptionText}
              </SheetDescription>
            ) : null}
            <div className="flex min-w-0 items-center gap-1">
              <a
                href={`mailto:${encodeURIComponent(row.email)}`}
                className="truncate text-sm text-muted-foreground underline-offset-4 hover:underline"
              >
                {row.email}
              </a>
              <Button
                variant="ghost"
                size="icon"
                className="size-7 shrink-0"
                aria-label="Copy email address"
                onClick={() => void copyEmail()}
              >
                <Copy {...phosphorIcon} className="size-3.5" />
              </Button>
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              className="size-8"
              aria-label="Previous message"
              disabled={!hasPrev}
              onClick={onPrev}
            >
              <CaretUp {...phosphorIcon} className="size-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="size-8"
              aria-label="Next message"
              disabled={!hasNext}
              onClick={onNext}
            >
              <CaretDown {...phosphorIcon} className="size-4" />
            </Button>
            {onClose ? (
              <Button
                variant="ghost"
                size="icon"
                className="size-8"
                aria-label="Close"
                onClick={onClose}
              >
                <X {...phosphorIcon} className="size-4" />
              </Button>
            ) : null}
          </div>
        </div>
        <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
          <StatusBadge status={row.status} />
          <span aria-hidden>·</span>
          <Tooltip>
            <TooltipTrigger asChild>
              <time dateTime={row.created_at}>{fullDate.format(date)}</time>
            </TooltipTrigger>
            <TooltipContent>
              {contactRelativeTime(row.created_at)}
            </TooltipContent>
          </Tooltip>
        </div>
      </div>
      <div
        className={cn(
          'min-h-0 flex-1 overflow-y-auto py-6 text-[15px] leading-7 break-words whitespace-pre-wrap [overflow-wrap:anywhere]',
          padX,
        )}
      >
        {row.message}
      </div>
      <div
        className={cn(
          'flex items-center justify-between gap-2 border-t border-border bg-muted/30 py-4',
          padX,
          variant === 'sheet' && 'pb-[max(1rem,env(safe-area-inset-bottom))]',
        )}
      >
        <div className="flex items-center gap-1">
          {archived ? (
            <IconAction
              label="Move to inbox"
              shortcut="E"
              onClick={() => onAction('read')}
            >
              <Tray {...phosphorIcon} className="size-4" />
            </IconAction>
          ) : (
            <>
              <IconAction
                label="Archive"
                shortcut="E"
                onClick={() => onAction('archived')}
              >
                <Archive {...phosphorIcon} className="size-4" />
              </IconAction>
              <IconAction
                label="Mark unread"
                shortcut="U"
                onClick={() => onAction('new')}
              >
                <EnvelopeSimple {...phosphorIcon} className="size-4" />
              </IconAction>
            </>
          )}
        </div>
        <Button asChild className={cn('h-9', variant === 'sheet' && 'flex-1')}>
          <a href={href} aria-keyshortcuts="R">
            <ArrowBendUpLeft {...phosphorIcon} className="size-4" />
            Reply by email
          </a>
        </Button>
      </div>
    </div>
  )
}

function MessageError({ onRetry }: { onRetry: () => void }) {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-3 p-6 text-center">
      <p className="text-sm text-muted-foreground">
        Could not load this message.
      </p>
      <Button variant="outline" onClick={onRetry}>
        Retry
      </Button>
    </div>
  )
}

function MessagePaneSkeleton() {
  return (
    <div className="grid gap-4 p-6">
      <div className="flex items-center gap-3">
        <Skeleton className="size-10 rounded-full" />
        <div className="grid flex-1 gap-2">
          <Skeleton className="h-4 w-40" />
          <Skeleton className="h-3 w-56" />
        </div>
      </div>
      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-4 w-11/12" />
      <Skeleton className="h-4 w-3/4" />
    </div>
  )
}

const SKELETON_ROWS = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h']

export function ContactInboxSkeleton() {
  return (
    <div className="grid w-full gap-6" aria-busy="true">
      <div className="flex items-center justify-between">
        <Skeleton className="h-8 w-32" />
        <Skeleton className="hidden h-9 w-72 sm:block" />
      </div>
      <Skeleton className="h-9 w-72" />
      <div className="admin-card grid overflow-hidden lg:grid-cols-[380px_1fr] lg:divide-x lg:divide-border">
        <div>
          {SKELETON_ROWS.map((key) => (
            <div
              key={key}
              className="grid gap-2 border-b border-border px-4 py-3"
            >
              <Skeleton className="h-4 w-1/2" />
              <Skeleton className="h-3 w-2/3" />
              <Skeleton className="h-3 w-full" />
            </div>
          ))}
        </div>
        <div className="hidden lg:block">
          <MessagePaneSkeleton />
        </div>
      </div>
    </div>
  )
}

export function ContactInboxError({ onRetry }: { onRetry: () => void }) {
  return (
    <Alert variant="destructive">
      <AlertDescription className="flex flex-wrap items-center justify-between gap-3">
        Could not load messages.
        <Button variant="outline" size="sm" onClick={onRetry}>
          Retry
        </Button>
      </AlertDescription>
    </Alert>
  )
}
