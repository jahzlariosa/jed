import type { ReactNode } from 'react'

import { AdminCoverImageField } from '#/components/admin/admin-cover-image-field.client'
import { AdminEditorSlugField } from '#/components/admin/admin-editor-slug-field'

export function AdminEditorSidebarIntro({
  slugId,
  slug,
  onSlugChange,
  slugPlaceholder,
  coverLabel = 'Cover image',
  coverImageUrl,
  onCoverImageUrlChange,
  onFeaturedMediaIdChange,
  onCoverUpload,
  coverDisabled,
  trailing,
}: {
  slugId: string
  slug: string
  onSlugChange: (value: string) => void
  slugPlaceholder: string
  coverLabel?: string
  coverImageUrl: string
  onCoverImageUrlChange: (url: string) => void
  onFeaturedMediaIdChange: (id: string | null) => void
  onCoverUpload: (file: File) => Promise<void>
  coverDisabled?: boolean
  trailing?: ReactNode
}) {
  return (
    <div className="admin-writing-desk-side-intro">
      <AdminEditorSlugField
        id={slugId}
        value={slug}
        onChange={onSlugChange}
        placeholder={slugPlaceholder}
      />
      <div className="admin-cover-sidebar-card">
        <AdminCoverImageField
          label={coverLabel}
          variant="sidebar"
          imageUrl={coverImageUrl}
          onImageUrlChange={onCoverImageUrlChange}
          onMediaIdChange={onFeaturedMediaIdChange}
          onUploadFile={onCoverUpload}
          disabled={coverDisabled}
        />
      </div>
      {trailing}
    </div>
  )
}
