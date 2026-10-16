import { useEffect, useRef } from 'react'

import type { PostStatus } from '#/lib/cms/schemas'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

export function AdminPublishPopover({
  open,
  onOpenChange,
  status,
  onStatusChange,
  publishedAt,
  onPublishedAtChange,
  onConfirm,
  pending,
  confirmLabel,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  status: PostStatus | string
  onStatusChange: (status: PostStatus | string) => void
  publishedAt: string
  onPublishedAtChange: (value: string) => void
  onConfirm: () => void
  pending: boolean
  confirmLabel: string
}) {
  const panelRef = useRef<HTMLDivElement>(null)
  const schedule = status === 'scheduled'

  useEffect(() => {
    if (!open) {
      return
    }
    function onKey(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        onOpenChange(false)
      }
    }
    function onPointer(event: MouseEvent) {
      const target = event.target as Node
      if (panelRef.current && !panelRef.current.contains(target)) {
        onOpenChange(false)
      }
    }
    document.addEventListener('keydown', onKey)
    document.addEventListener('mousedown', onPointer)
    return () => {
      document.removeEventListener('keydown', onKey)
      document.removeEventListener('mousedown', onPointer)
    }
  }, [open, onOpenChange])

  if (!open) {
    return null
  }

  return (
    <div
      className="admin-publish-pop"
      ref={panelRef}
      role="dialog"
      aria-label="Publish"
    >
      <h3 className="text-sm font-semibold">Publish</h3>
      <p className="admin-publish-pop-sub">
        Choose when this entry goes live on your site.
      </p>
      <div className="admin-field-grid">
        <div>
          <Label htmlFor="publish-when">When</Label>
          <select
            id="publish-when"
            className="admin-input-tall mt-1 w-full rounded-md border border-input bg-background px-3 text-sm"
            value={schedule ? 'schedule' : 'now'}
            onChange={(event) => {
              if (event.target.value === 'schedule') {
                onStatusChange('scheduled')
              } else {
                onStatusChange('published')
              }
            }}
          >
            <option value="now">Publish now</option>
            <option value="schedule">Schedule</option>
          </select>
        </div>
        {schedule ? (
          <div>
            <Label htmlFor="publish-schedule-at">Date and time</Label>
            <Input
              id="publish-schedule-at"
              type="datetime-local"
              value={publishedAt}
              onChange={(event) => onPublishedAtChange(event.target.value)}
              className="admin-input-tall mt-1"
            />
          </div>
        ) : null}
        <div>
          <Label htmlFor="publish-visibility">Visibility</Label>
          <select
            id="publish-visibility"
            className="admin-input-tall mt-1 w-full rounded-md border border-input bg-background px-3 text-sm"
            value={status}
            onChange={(event) => onStatusChange(event.target.value)}
          >
            <option value="published">Published</option>
            <option value="draft">Draft</option>
            <option value="scheduled">Scheduled</option>
          </select>
        </div>
      </div>
      <div className="mt-3 flex gap-2">
        <Button
          type="button"
          variant="outline"
          className="flex-1"
          disabled={pending}
          onClick={() => onOpenChange(false)}
        >
          Cancel
        </Button>
        <Button
          type="button"
          className="flex-1"
          loading={pending}
          disabled={pending}
          onClick={() => {
            onConfirm()
            onOpenChange(false)
          }}
        >
          {confirmLabel}
        </Button>
      </div>
    </div>
  )
}
