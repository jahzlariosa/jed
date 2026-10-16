import { useEffect, useState } from 'react'

import {
  AVATAR_OUTPUT_SIZE,
  cropImageToWebpBase64,
  defaultSquareCrop,
  loadImageFromFile,
} from '#/lib/account/avatar-crop'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogBody,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'

export function AvatarCropDialog({
  file,
  open,
  onOpenChange,
  onSave,
  pending,
}: {
  file: File | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onSave: (base64: string) => void | Promise<void>
  pending?: boolean
}) {
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [image, setImage] = useState<HTMLImageElement | null>(null)
  const [zoom, setZoom] = useState(1.15)

  useEffect(() => {
    if (!file || !open) {
      setPreviewUrl(null)
      setImage(null)
      return
    }
    const url = URL.createObjectURL(file)
    setPreviewUrl(url)
    void loadImageFromFile(file).then(setImage)
    return () => URL.revokeObjectURL(url)
  }, [file, open])

  async function onConfirm() {
    if (!image) {
      return
    }
    const crop = defaultSquareCrop(
      image.naturalWidth,
      image.naturalHeight,
      zoom,
    )
    const base64 = cropImageToWebpBase64({
      image,
      crop,
      zoom,
      outputSize: AVATAR_OUTPUT_SIZE,
    })
    await onSave(base64)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        showCloseButton={false}
        className="rounded-[12px] sm:max-w-md"
        onEscapeKeyDown={(event) => {
          event.preventDefault()
          onOpenChange(false)
        }}
      >
        <DialogHeader>
          <DialogTitle>Adjust photo</DialogTitle>
        </DialogHeader>
        <DialogBody>
          <div className="relative mx-auto size-56 overflow-hidden rounded-full bg-muted">
            {previewUrl ? (
              <img
                src={previewUrl}
                alt=""
                className="size-full object-cover"
                style={{
                  transform: `scale(${zoom})`,
                  transformOrigin: 'center center',
                }}
              />
            ) : null}
            <div
              className="pointer-events-none absolute inset-4 account-crop-mask"
              aria-hidden
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="avatar-zoom">Zoom</Label>
            <input
              id="avatar-zoom"
              type="range"
              min={1}
              max={2}
              step={0.01}
              value={zoom}
              onChange={(event) => setZoom(Number(event.target.value))}
              className="w-full"
            />
          </div>
        </DialogBody>
        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            disabled={pending}
            onClick={() => onOpenChange(false)}
          >
            Cancel
          </Button>
          <Button
            type="button"
            disabled={pending || !image}
            onClick={() => void onConfirm()}
          >
            {pending ? 'Working...' : 'Save photo'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
