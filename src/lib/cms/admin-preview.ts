export function isLivePublishStatus(status: string): boolean {
  return status === 'published' || status === 'scheduled'
}

export type AdminPreviewPlan =
  | { kind: 'open'; previewSlug: string; warn?: string }
  | { kind: 'save_then_open'; previewSlug: string; saveStatus: string }

export type AdminPreviewPlanResult =
  | AdminPreviewPlan
  | { kind: 'error'; message: string }

export function planAdminPreview(input: {
  isNew: boolean
  savedStatus: string
  savedSlug: string
  currentSlug: string
  currentStatus: string
  isDirty: boolean
}): AdminPreviewPlanResult {
  const currentSlug = input.currentSlug.trim()
  const savedSlug = input.savedSlug.trim()

  if (input.isNew) {
    if (!currentSlug) {
      return { kind: 'error', message: 'Add a slug before previewing.' }
    }
    return {
      kind: 'save_then_open',
      previewSlug: currentSlug,
      saveStatus: input.currentStatus,
    }
  }

  const slugForSaved = savedSlug || currentSlug
  if (!slugForSaved) {
    return { kind: 'error', message: 'Add a slug before previewing.' }
  }

  if (!input.isDirty) {
    return { kind: 'open', previewSlug: slugForSaved }
  }

  if (isLivePublishStatus(input.savedStatus)) {
    return {
      kind: 'open',
      previewSlug: savedSlug || slugForSaved,
      warn: 'Preview shows the last saved version. Unsaved changes are not on the live site.',
    }
  }

  return {
    kind: 'save_then_open',
    previewSlug: currentSlug || savedSlug,
    saveStatus: input.currentStatus,
  }
}

export const ADMIN_PREVIEW_UNSAVED_LIVE_WARN =
  'Preview shows the last saved version. Unsaved changes are not on the live site.'

export function blogDraftPreviewPath(slug: string): string {
  return `/blog/${slug}?draftPreview=true`
}

export function blogLivePath(slug: string): string {
  return `/blog/${slug.trim()}`
}

export type AdminEditorContentKind = 'post' | 'page'

export function isAdminEditorLiveViewStatus(status: string): boolean {
  return status === 'published'
}

export function adminEditorViewLiveLabel(kind: AdminEditorContentKind): string {
  return kind === 'page' ? 'View page' : 'View post'
}

/** @deprecated Use resolveAdminEditorToolbarActions for editor chrome. */
export function adminEditorOpenLabel(
  kind: AdminEditorContentKind,
  status: string,
): string {
  if (isAdminEditorLiveViewStatus(status)) {
    return adminEditorViewLiveLabel(kind)
  }
  return 'Preview'
}

export type AdminEditorToolbarActions = {
  showPreview: boolean
  showViewLive: boolean
  viewLiveLabel: string
}

/** Which open actions to show in the post/page editor header. */
export function resolveAdminEditorToolbarActions(input: {
  kind: AdminEditorContentKind
  savedStatus: string
  isDirty: boolean
  isNew: boolean
}): AdminEditorToolbarActions {
  if (input.isNew) {
    return { showPreview: false, showViewLive: false, viewLiveLabel: '' }
  }
  const liveOnSite = isAdminEditorLiveViewStatus(input.savedStatus)
  if (!liveOnSite) {
    return {
      showPreview: true,
      showViewLive: false,
      viewLiveLabel: '',
    }
  }
  const viewLiveLabel = adminEditorViewLiveLabel(input.kind)
  if (input.isDirty) {
    return {
      showPreview: true,
      showViewLive: true,
      viewLiveLabel,
    }
  }
  return {
    showPreview: false,
    showViewLive: true,
    viewLiveLabel,
  }
}

/** Preview flow: saves pending edits when needed, then opens draft preview. */
export function planAdminPendingPreview(input: {
  isNew: boolean
  savedStatus: string
  savedSlug: string
  currentSlug: string
  currentStatus: string
  isDirty: boolean
}): AdminPreviewPlanResult {
  const currentSlug = input.currentSlug.trim()
  const savedSlug = input.savedSlug.trim()

  if (input.isNew) {
    if (!currentSlug) {
      return { kind: 'error', message: 'Add a slug before previewing.' }
    }
    return {
      kind: 'save_then_open',
      previewSlug: currentSlug,
      saveStatus: input.currentStatus,
    }
  }

  const slugForSaved = savedSlug || currentSlug
  if (!slugForSaved) {
    return { kind: 'error', message: 'Add a slug before previewing.' }
  }

  if (!input.isDirty) {
    return { kind: 'open', previewSlug: slugForSaved }
  }

  if (isAdminEditorLiveViewStatus(input.savedStatus)) {
    return {
      kind: 'save_then_open',
      previewSlug: currentSlug || savedSlug,
      saveStatus: input.currentStatus,
    }
  }

  return {
    kind: 'save_then_open',
    previewSlug: currentSlug || savedSlug,
    saveStatus: input.currentStatus,
  }
}

export function planAdminLiveView(input: {
  savedSlug: string
}): AdminPreviewPlanResult {
  const savedSlug = input.savedSlug.trim()
  if (!savedSlug) {
    return { kind: 'error', message: 'Add a slug before viewing.' }
  }
  return { kind: 'open', previewSlug: savedSlug }
}

export function resolveAdminEditorOpenPath(
  kind: AdminEditorContentKind,
  slug: string,
  viewLive: boolean,
): string {
  const trimmed = slug.trim()
  if (kind === 'post') {
    return viewLive ? blogLivePath(trimmed) : blogDraftPreviewPath(trimmed)
  }
  if (!trimmed) {
    return viewLive ? '/' : '/?draftPreview=true'
  }
  const base = `/${trimmed}`
  return viewLive ? base : `${base}?draftPreview=true`
}

export function adminEditorOpenedToast(
  kind: AdminEditorContentKind,
  viewLive: boolean,
): string {
  if (!viewLive) {
    return ADMIN_EDITOR_PREVIEW_OPENED_TOAST
  }
  return kind === 'page'
    ? ADMIN_EDITOR_LIVE_OPENED_TOAST
    : ADMIN_EDITOR_LIVE_POST_OPENED_TOAST
}

export const ADMIN_EDITOR_LIVE_OPENED_TOAST =
  'Opened the live page in a new tab.'
export const ADMIN_EDITOR_LIVE_POST_OPENED_TOAST =
  'Opened the live post in a new tab.'
export const ADMIN_EDITOR_PREVIEW_OPENED_TOAST = 'Preview opened in a new tab.'
