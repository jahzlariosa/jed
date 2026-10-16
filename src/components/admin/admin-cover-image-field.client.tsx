import { ImageSquare, Upload } from '@phosphor-icons/react'
import { type DragEvent, useRef, useState } from 'react'

import { AdminMediaPickerDialog } from '#/components/admin/admin-media-picker-dialog.client'
import { phosphorIcon } from '#/lib/icon'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

type DropState = 'idle' | 'active' | 'uploading' | 'error'

export function AdminCoverImageField({
  label = 'Cover image',
  imageUrl,
  onImageUrlChange,
  onMediaIdChange,
  onUploadFile,
  disabled,
  variant = 'default',
}: {
  label?: string
  imageUrl: string
  onImageUrlChange: (url: string) => void
  onMediaIdChange?: (id: string | null) => void
  onUploadFile: (file: File) => Promise<void>
  disabled?: boolean
  /** `sidebar` uses a compact drop zone for the editor settings column. */
  variant?: 'default' | 'sidebar'
}) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [dropState, setDropState] = useState<DropState>('idle')
  const [error, setError] = useState('')
  const [libraryOpen, setLibraryOpen] = useState(false)

  async function handleFiles(files: FileList | File[] | null) {
    const file = files?.[0]
    if (!file || disabled) {
      return
    }
    setDropState('uploading')
    setError('')
    try {
      await onUploadFile(file)
      setDropState('idle')
    } catch (cause) {
      console.error(cause)
      setDropState('error')
      setError(
        cause instanceof Error ? cause.message : 'Upload failed. Try again.',
      )
    }
  }

  function onDragOver(event: DragEvent) {
    event.preventDefault()
    if (!disabled) {
      setDropState('active')
    }
  }

  function onDragLeave(event: DragEvent) {
    event.preventDefault()
    if (dropState === 'active') {
      setDropState('idle')
    }
  }

  function onDrop(event: DragEvent) {
    event.preventDefault()
    if (disabled) {
      return
    }
    void handleFiles(event.dataTransfer.files)
  }

  const trimmed = imageUrl.trim()

  const isSidebar = variant === 'sidebar'

  return (
    <div
      className={cn(
        'admin-cover-field',
        isSidebar && 'admin-cover-field-sidebar',
      )}
    >
      <p className="text-sm font-medium text-foreground">{label}</p>
      <button
        type="button"
        disabled={disabled || dropState === 'uploading'}
        className={cn(
          'admin-cover-drop',
          dropState === 'active' && 'admin-cover-drop-active',
          dropState === 'uploading' && 'admin-cover-drop-uploading',
          dropState === 'error' && 'admin-cover-drop-error',
        )}
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        onDrop={onDrop}
        onClick={() => inputRef.current?.click()}
        aria-label={`${label}. Click or drop an image to upload.`}
      >
        {trimmed ? (
          <img src={trimmed} alt="" className="admin-cover-drop-preview" />
        ) : (
          <div className="admin-cover-drop-placeholder">
            <ImageSquare {...phosphorIcon} className="size-8" aria-hidden />
            <span className="text-sm text-muted-foreground">
              Click or drag an image here
            </span>
          </div>
        )}
        {dropState === 'uploading' ? (
          <span className="admin-cover-drop-status" role="status">
            Uploading…
          </span>
        ) : null}
      </button>
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif,image/avif"
        className="sr-only"
        disabled={disabled || dropState === 'uploading'}
        onChange={(event) => void handleFiles(event.target.files)}
      />
      {error ? (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      ) : null}
      <div className="admin-cover-field-actions">
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={disabled || dropState === 'uploading'}
          onClick={() => inputRef.current?.click()}
        >
          <Upload {...phosphorIcon} className="mr-2 size-4" aria-hidden />
          {trimmed ? 'Replace' : 'Upload image'}
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={disabled || dropState === 'uploading'}
          onClick={() => setLibraryOpen(true)}
        >
          Media library
        </Button>
        {trimmed ? (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            disabled={disabled || dropState === 'uploading'}
            onClick={() => {
              onImageUrlChange('')
              onMediaIdChange?.(null)
            }}
          >
            Remove
          </Button>
        ) : null}
      </div>
      <AdminMediaPickerDialog
        open={libraryOpen}
        onOpenChange={setLibraryOpen}
        onSelect={(item) => {
          onImageUrlChange(item.url)
          onMediaIdChange?.(item.id)
        }}
      />
    </div>
  )
}
