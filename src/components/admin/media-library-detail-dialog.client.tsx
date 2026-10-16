import { useServerFn } from '@tanstack/react-start'
import { Copy, Trash } from '@phosphor-icons/react'
import { useEffect, useState } from 'react'

import {
  buildMediaDetailRows,
  isImageMediaMime,
  type MediaImageDimensions,
  type MediaLibraryItem,
} from '#/lib/media/media-library'
import { deleteMediaFn, updateMediaAltFn } from '#/lib/cms/functions'
import { publicMediaUrl } from '#/lib/media/public-media-url'
import { appToast } from '#/lib/app-toast'
import { phosphorIcon } from '#/lib/icon'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogBody,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

export function MediaLibraryDetailDialog({
  item,
  open,
  onOpenChange,
  onDeleted,
  onAltSaved,
}: {
  item: MediaLibraryItem | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onDeleted: () => void
  onAltSaved: (id: string, altText: string | null) => void
}) {
  const updateAlt = useServerFn(updateMediaAltFn)
  const remove = useServerFn(deleteMediaFn)
  const [altText, setAltText] = useState('')
  const [dimensions, setDimensions] = useState<MediaImageDimensions | null>(
    null,
  )
  const [pending, setPending] = useState(false)
  const [error, setError] = useState('')
  useEffect(() => {
    if (!item || !open) {
      return
    }
    setAltText(item.alt_text ?? '')
    setDimensions(null)
    setError('')
  }, [item, open])

  if (!item) {
    return null
  }

  const media = item
  const publicUrl = publicMediaUrl(media.storage_path)
  const isImage = isImageMediaMime(media.mime_type)
  const detailRows = buildMediaDetailRows(media, dimensions)

  async function onCopyUrl() {
    try {
      await navigator.clipboard.writeText(publicUrl)
      appToast.success('URL copied to clipboard.')
    } catch {
      appToast.error('Unable to copy URL.')
    }
  }

  async function onSaveAlt() {
    setPending(true)
    setError('')
    const result = await updateAlt({
      data: { id: media.id, altText },
    })
    setPending(false)
    if (result.error) {
      setError(result.error)
      appToast.error(result.error)
      return
    }
    onAltSaved(media.id, altText.trim() || null)
    appToast.success('Alt text saved.')
  }

  async function onDelete() {
    if (
      !window.confirm(
        `Delete "${media.filename}" permanently? This cannot be undone.`,
      )
    ) {
      return
    }
    setPending(true)
    setError('')
    const result = await remove({ data: { id: media.id } })
    setPending(false)
    if (result.error) {
      setError(result.error)
      appToast.error(result.error)
      return
    }
    appToast.success('File deleted.')
    onOpenChange(false)
    onDeleted()
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="truncate">{media.filename}</DialogTitle>
          <DialogDescription className="sr-only">
            Media file details and actions
          </DialogDescription>
        </DialogHeader>
        <DialogBody>
          <div className="grid gap-4 sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
            <div className="admin-media-library-preview">
              {isImage ? (
                <img
                  src={publicUrl}
                  alt={altText.trim() || media.filename}
                  className="admin-media-library-preview-img"
                  onLoad={(event) => {
                    const img = event.currentTarget
                    setDimensions({
                      width: img.naturalWidth,
                      height: img.naturalHeight,
                    })
                  }}
                />
              ) : (
                <p className="p-6 text-center text-sm text-muted-foreground">
                  Preview not available for this file type.
                </p>
              )}
            </div>
            <dl className="admin-media-library-meta">
              {detailRows.map((row) => (
                <div key={row.id} className="admin-media-library-meta-row">
                  <dt>{row.label}</dt>
                  <dd>{row.value}</dd>
                </div>
              ))}
            </dl>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="media-detail-url">Public URL</Label>
            <div className="flex gap-2">
              <Input
                id="media-detail-url"
                readOnly
                value={publicUrl}
                className="admin-input-tall font-mono text-xs"
              />
              <Button
                type="button"
                variant="outline"
                size="icon"
                aria-label="Copy URL"
                disabled={pending}
                onClick={() => void onCopyUrl()}
              >
                <Copy {...phosphorIcon} aria-hidden />
              </Button>
            </div>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="media-detail-alt">Alt text</Label>
            <Input
              id="media-detail-alt"
              value={altText}
              onChange={(event) => setAltText(event.target.value)}
              placeholder="Describe the image for accessibility"
              className="admin-input-tall"
              maxLength={500}
              disabled={pending}
            />
          </div>
          {error ? (
            <p role="alert" className="text-sm text-destructive">
              {error}
            </p>
          ) : null}
        </DialogBody>
        <DialogFooter className="sm:justify-between">
          <Button
            type="button"
            variant="destructive"
            size="sm"
            className="gap-1.5"
            loading={pending}
            disabled={pending}
            onClick={() => void onDelete()}
          >
            <Trash {...phosphorIcon} className="size-4" aria-hidden />
            Delete
          </Button>
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={pending}
              onClick={() => onOpenChange(false)}
            >
              Close
            </Button>
            <Button
              type="button"
              size="sm"
              loading={pending}
              disabled={pending}
              onClick={() => void onSaveAlt()}
            >
              Save alt text
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
