import { useServerFn } from '@tanstack/react-start'
import { useEffect, useState } from 'react'

import { listMediaFn } from '#/lib/cms/functions'
import { publicMediaUrl } from '#/lib/media/public-media-url'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogBody,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'

export type AdminMediaPickerItem = {
  id: string
  url: string
  filename: string
  altText: string | null
}

export function AdminMediaPickerDialog({
  open,
  onOpenChange,
  onSelect,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSelect: (item: AdminMediaPickerItem) => void
}) {
  const listMedia = useServerFn(listMediaFn)
  const [query, setQuery] = useState('')
  const [items, setItems] = useState<AdminMediaPickerItem[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!open) {
      return
    }
    let cancelled = false
    setLoading(true)
    setError('')
    void listMedia({ data: { limit: 80, q: query } })
      .then((result) => {
        if (cancelled) {
          return
        }
        setItems(
          result.items
            .filter((row) => row.mime_type.startsWith('image/'))
            .map((row) => ({
              id: row.id,
              filename: row.filename,
              altText: row.alt_text,
              url: publicMediaUrl(row.storage_path),
            })),
        )
      })
      .catch((cause) => {
        console.error(cause)
        if (!cancelled) {
          setError('Unable to load the media library.')
        }
      })
      .finally(() => {
        if (!cancelled) {
          setLoading(false)
        }
      })
    return () => {
      cancelled = true
    }
  }, [listMedia, open, query])

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>Choose from media library</DialogTitle>
        </DialogHeader>
        <DialogBody className="gap-3">
          <Input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search filenames"
            className="admin-input-tall"
            aria-label="Search media"
          />
          {error ? (
            <p role="alert" className="text-sm text-destructive">
              {error}
            </p>
          ) : null}
          <ul className="admin-media-picker-grid">
            {loading ? (
              <li className="text-sm text-muted-foreground" role="status">
                Loading media…
              </li>
            ) : items.length === 0 ? (
              <li className="text-sm text-muted-foreground">
                No images found. Upload files on the Media page first.
              </li>
            ) : (
              items.map((item) => (
                <li key={item.id}>
                  <button
                    type="button"
                    className="admin-media-picker-item"
                    onClick={() => {
                      onSelect(item)
                      onOpenChange(false)
                    }}
                  >
                    <img src={item.url} alt={item.altText ?? item.filename} />
                    <span className="truncate text-xs">{item.filename}</span>
                  </button>
                </li>
              ))
            )}
          </ul>
        </DialogBody>
        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
          >
            Cancel
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
