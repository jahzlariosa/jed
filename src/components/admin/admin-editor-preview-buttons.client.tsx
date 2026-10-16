import { Eye } from '@phosphor-icons/react'

import type { AdminEditorToolbarActions } from '#/lib/cms/admin-preview'
import { phosphorIcon } from '#/lib/icon'
import { Button } from '@/components/ui/button'

export function AdminEditorPreviewButtons({
  toolbarActions,
  pending,
  onPreview,
  onViewLive,
}: {
  toolbarActions: AdminEditorToolbarActions
  pending: boolean
  onPreview: () => void
  onViewLive: () => void
}) {
  return (
    <>
      {toolbarActions.showPreview ? (
        <Button
          type="button"
          variant="outline"
          size="sm"
          loading={pending}
          disabled={pending}
          onClick={onPreview}
        >
          <Eye
            {...phosphorIcon}
            className="mr-2 size-4 text-current"
            aria-hidden
          />
          Preview
        </Button>
      ) : null}
      {toolbarActions.showViewLive ? (
        <Button
          type="button"
          variant="outline"
          size="sm"
          loading={pending}
          disabled={pending}
          onClick={onViewLive}
        >
          <Eye
            {...phosphorIcon}
            className="mr-2 size-4 text-current"
            aria-hidden
          />
          {toolbarActions.viewLiveLabel}
        </Button>
      ) : null}
    </>
  )
}
