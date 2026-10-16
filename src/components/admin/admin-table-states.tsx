import type { ReactNode } from 'react'
import type { Icon } from '@phosphor-icons/react'
import { WarningCircle } from '@phosphor-icons/react'

import { phosphorIcon } from '#/lib/icon'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'

export function AdminTableEmpty({
  icon: Icon,
  title,
  description,
  action,
}: {
  icon: Icon
  title: string
  description: string
  action?: ReactNode
}) {
  return (
    <div className="admin-state-box">
      <div className="admin-state-box-icon" aria-hidden>
        <Icon {...phosphorIcon} className="size-6 text-current" />
      </div>
      <h3 className="admin-state-box-title">{title}</h3>
      <p className="admin-state-box-desc">{description}</p>
      {action ? <div className="admin-state-box-action">{action}</div> : null}
    </div>
  )
}

const TABLE_SKELETON_SLOTS = [
  'slot-a',
  'slot-b',
  'slot-c',
  'slot-d',
  'slot-e',
  'slot-f',
  'slot-g',
  'slot-h',
] as const

export function AdminTableLoading({ rows = 6 }: { rows?: number }) {
  const slots = TABLE_SKELETON_SLOTS.slice(0, rows)
  return (
    <div
      className="admin-table-skeleton"
      aria-busy="true"
      aria-live="polite"
      role="status"
    >
      <span className="sr-only">Loading table</span>
      {slots.map((slot) => (
        <Skeleton key={slot} className="admin-table-skeleton-row" />
      ))}
    </div>
  )
}

export function AdminTableErrorBanner({ message }: { message: string }) {
  return (
    <div className="admin-banner-error" role="alert">
      <WarningCircle
        {...phosphorIcon}
        className="size-5 shrink-0 text-current"
        aria-hidden
      />
      <p>{message}</p>
    </div>
  )
}

export function AdminTableError({
  message,
  onRetry,
}: {
  message: string
  onRetry: () => void
}) {
  return (
    <div className="grid gap-3">
      <AdminTableErrorBanner message={message} />
      <div className="admin-state-box">
        <h3 className="admin-state-box-title">Could not load this list</h3>
        <p className="admin-state-box-desc">
          Check your connection and try again. Your filters are unchanged.
        </p>
        <div className="admin-state-box-action">
          <Button type="button" onClick={onRetry}>
            Try again
          </Button>
        </div>
      </div>
    </div>
  )
}
