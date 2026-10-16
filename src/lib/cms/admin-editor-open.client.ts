import type { AdminEditorContentKind } from '#/lib/cms/admin-preview'
import {
  adminEditorOpenedToast,
  type AdminPreviewPlanResult,
  resolveAdminEditorOpenPath,
} from '#/lib/cms/admin-preview'
import { appToast } from '#/lib/app-toast'

export async function runAdminPreviewPlan(input: {
  kind: AdminEditorContentKind
  plan: AdminPreviewPlanResult
  viewLive: boolean
  onSaveThenOpen: (saveStatus: string) => Promise<string | null>
  onWarn?: (message: string) => void
}): Promise<boolean> {
  const { plan } = input
  if (plan.kind === 'error') {
    appToast.error(plan.message)
    return false
  }
  if (plan.kind === 'open' && plan.warn) {
    input.onWarn?.(plan.warn)
  }
  let openSlug = plan.kind === 'open' ? plan.previewSlug : ''
  if (plan.kind === 'save_then_open') {
    const slug = await input.onSaveThenOpen(plan.saveStatus)
    if (!slug) {
      return false
    }
    openSlug = slug
  }
  window.open(
    resolveAdminEditorOpenPath(input.kind, openSlug, input.viewLive),
    '_blank',
    'noopener,noreferrer',
  )
  appToast.success(adminEditorOpenedToast(input.kind, input.viewLive))
  return true
}
