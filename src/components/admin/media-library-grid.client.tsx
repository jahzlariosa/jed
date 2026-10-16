import {
  isImageMediaMime,
  mediaLibraryThumbnailLabel,
  type MediaLibraryItem,
} from '#/lib/media/media-library'
import { publicMediaUrl } from '#/lib/media/public-media-url'
import { File } from '@phosphor-icons/react'
import { phosphorIcon } from '#/lib/icon'

export function MediaLibraryGrid({
  items,
  onOpenItem,
}: {
  items: MediaLibraryItem[]
  onOpenItem: (item: MediaLibraryItem) => void
}) {
  return (
    <ul className="admin-media-library-grid">
      {items.map((item) => {
        const isImage = isImageMediaMime(item.mime_type)
        const url = publicMediaUrl(item.storage_path)
        return (
          <li key={item.id}>
            <button
              type="button"
              className="admin-media-library-thumb"
              aria-label={mediaLibraryThumbnailLabel(item.filename)}
              onClick={() => onOpenItem(item)}
            >
              {isImage ? (
                <img
                  src={url}
                  alt=""
                  loading="lazy"
                  decoding="async"
                  className="admin-media-library-thumb-img"
                />
              ) : (
                <span className="admin-media-library-thumb-file">
                  <File {...phosphorIcon} className="size-8" aria-hidden />
                </span>
              )}
            </button>
          </li>
        )
      })}
    </ul>
  )
}
