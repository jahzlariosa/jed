import { useCallback, useMemo } from 'react'

import { runAdminPreviewPlan } from '#/lib/cms/admin-editor-open.client'
import type { AdminEditorContentKind } from '#/lib/cms/admin-preview'
import {
  ADMIN_PREVIEW_UNSAVED_LIVE_WARN,
  planAdminLiveView,
  planAdminPendingPreview,
  resolveAdminEditorToolbarActions,
} from '#/lib/cms/admin-preview'
import { appToast } from '#/lib/app-toast'

export function useAdminEditorPreview(input: {
  editorKind: AdminEditorContentKind
  isNew: boolean
  isDirty: boolean
  savedBaseline: { status: string; slug: string }
  slug: string
  status: string
  title?: string
  requireTitleBeforePreview?: boolean
  onSaveThenOpen: (saveStatus: string) => Promise<string | null>
}) {
  const toolbarActions = useMemo(
    () =>
      resolveAdminEditorToolbarActions({
        kind: input.editorKind,
        savedStatus: input.savedBaseline.status,
        isDirty: input.isDirty,
        isNew: input.isNew,
      }),
    [input.editorKind, input.savedBaseline.status, input.isDirty, input.isNew],
  )

  const onViewLive = useCallback(async () => {
    if (input.isNew) {
      return
    }
    if (input.isDirty) {
      appToast.message(ADMIN_PREVIEW_UNSAVED_LIVE_WARN)
    }
    await runAdminPreviewPlan({
      kind: input.editorKind,
      plan: planAdminLiveView({ savedSlug: input.savedBaseline.slug }),
      viewLive: true,
      onSaveThenOpen: async () => null,
    })
  }, [input.editorKind, input.isDirty, input.isNew, input.savedBaseline.slug])

  const onPreviewPending = useCallback(async () => {
    if (input.isNew) {
      return
    }
    if (input.requireTitleBeforePreview && !(input.title?.trim() ?? '')) {
      appToast.error('Add a title before previewing.')
      return
    }
    await runAdminPreviewPlan({
      kind: input.editorKind,
      plan: planAdminPendingPreview({
        isNew: false,
        savedStatus: input.savedBaseline.status,
        savedSlug: input.savedBaseline.slug,
        currentSlug: input.slug,
        currentStatus: input.status,
        isDirty: input.isDirty,
      }),
      viewLive: false,
      onSaveThenOpen: input.onSaveThenOpen,
    })
  }, [
    input.editorKind,
    input.isDirty,
    input.isNew,
    input.onSaveThenOpen,
    input.requireTitleBeforePreview,
    input.savedBaseline.slug,
    input.savedBaseline.status,
    input.slug,
    input.status,
    input.title,
  ])

  return { toolbarActions, onViewLive, onPreviewPending }
}
