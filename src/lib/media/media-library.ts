export type MediaLibraryItem = {
  id: string
  filename: string
  mime_type: string
  byte_size: number
  alt_text: string | null
  storage_path: string
  created_at: string
}

export type MediaImageDimensions = {
  width: number
  height: number
}

export function isImageMediaMime(mimeType: string): boolean {
  return mimeType.startsWith('image/')
}

export function formatMediaByteSize(bytes: number): string {
  if (!Number.isFinite(bytes) || bytes < 0) {
    return '—'
  }
  if (bytes < 1024) {
    return `${bytes} B`
  }
  if (bytes < 1024 * 1024) {
    return `${(bytes / 1024).toFixed(1)} KB`
  }
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

export function formatMediaUploadedAt(iso: string): string {
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) {
    return '—'
  }
  return date.toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  })
}

export function formatMediaDimensions(
  dimensions: MediaImageDimensions | null,
  mimeType: string,
): string {
  if (!isImageMediaMime(mimeType)) {
    return '—'
  }
  if (!dimensions || dimensions.width < 1 || dimensions.height < 1) {
    return 'Loading…'
  }
  return `${dimensions.width} × ${dimensions.height}`
}

export type MediaDetailRow = {
  id: string
  label: string
  value: string
}

export function buildMediaDetailRows(
  item: MediaLibraryItem,
  dimensions: MediaImageDimensions | null,
): MediaDetailRow[] {
  return [
    { id: 'filename', label: 'Filename', value: item.filename },
    { id: 'type', label: 'Type', value: item.mime_type },
    {
      id: 'size',
      label: 'Size',
      value: formatMediaByteSize(item.byte_size),
    },
    {
      id: 'dimensions',
      label: 'Dimensions',
      value: formatMediaDimensions(dimensions, item.mime_type),
    },
    {
      id: 'uploaded',
      label: 'Uploaded',
      value: formatMediaUploadedAt(item.created_at),
    },
  ]
}

export function mediaLibraryThumbnailLabel(filename: string): string {
  return `Open details for ${filename}`
}

export function isMediaGridActivateKey(key: string): boolean {
  return key === 'Enter' || key === ' '
}
