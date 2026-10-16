import { Upload } from '@phosphor-icons/react'
import { useEffect, useRef, useState } from 'react'

import { AdminPageHeader } from '#/components/admin/admin-page-header'
import { MediaLibraryDetailDialog } from '#/components/admin/media-library-detail-dialog.client'
import { MediaLibraryGrid } from '#/components/admin/media-library-grid.client'
import { useAdminMediaUpload } from '#/lib/cms/use-admin-media-upload'
import type { MediaLibraryItem } from '#/lib/media/media-library'
import { phosphorIcon } from '#/lib/icon'
import { Button } from '@/components/ui/button'

export function MediaLibraryScreen({
  items: initialItems,
  onReload,
}: {
  items: MediaLibraryItem[]
  onReload: () => void
}) {
  const { uploadImage } = useAdminMediaUpload()
  const inputRef = useRef<HTMLInputElement>(null)
  const [items, setItems] = useState(initialItems)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState('')
  const [selectedItem, setSelectedItem] = useState<MediaLibraryItem | null>(
    null,
  )
  const [detailOpen, setDetailOpen] = useState(false)

  useEffect(() => {
    setItems(initialItems)
  }, [initialItems])

  function openDetail(item: MediaLibraryItem) {
    setSelectedItem(item)
    setDetailOpen(true)
  }

  function onAltSaved(id: string, altText: string | null) {
    setItems((current) =>
      current.map((row) =>
        row.id === id ? { ...row, alt_text: altText } : row,
      ),
    )
    setSelectedItem((current) =>
      current?.id === id ? { ...current, alt_text: altText } : current,
    )
  }

  async function onUpload(files: FileList | null) {
    if (!files?.length) {
      return
    }
    setUploading(true)
    setError('')
    try {
      for (const file of Array.from(files)) {
        await uploadImage(file)
      }
      onReload()
    } catch (cause) {
      console.error(cause)
      setError('Upload failed. Check the file and try again.')
    } finally {
      setUploading(false)
      if (inputRef.current) {
        inputRef.current.value = ''
      }
    }
  }

  return (
    <div className="grid gap-6">
      <AdminPageHeader
        title="Media library"
        description="Upload images and files for your site."
        actions={
          <Button
            type="button"
            size="sm"
            className="gap-1.5"
            disabled={uploading}
            onClick={() => inputRef.current?.click()}
          >
            <Upload
              {...phosphorIcon}
              className="size-4 text-current"
              aria-hidden
            />
            Upload
          </Button>
        }
      />
      <input
        ref={inputRef}
        type="file"
        className="sr-only"
        multiple
        accept="image/*"
        onChange={(event) => void onUpload(event.target.files)}
      />
      {error ? (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      ) : null}
      {items.length === 0 ? (
        <div className="admin-card flex flex-col items-center gap-3 p-12 text-center">
          <p className="text-sm text-muted-foreground">No media yet</p>
          <Button type="button" onClick={() => inputRef.current?.click()}>
            Upload
          </Button>
        </div>
      ) : (
        <MediaLibraryGrid items={items} onOpenItem={openDetail} />
      )}
      <MediaLibraryDetailDialog
        item={selectedItem}
        open={detailOpen}
        onOpenChange={setDetailOpen}
        onDeleted={onReload}
        onAltSaved={onAltSaved}
      />
    </div>
  )
}
