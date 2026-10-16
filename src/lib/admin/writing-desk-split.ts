export const WRITING_DESK_SPLIT = {
  storageKey: 'jed-admin-writing-desk-sidebar-v1',
  minPx: 260,
  maxPx: 560,
  minRatio: 0.2,
  maxRatio: 0.45,
  defaultPx: 320,
  stackMediaQuery: '(max-width: 1023px)',
  keyboardStepPx: 8,
} as const

export type WritingDeskSplitPersisted = {
  widthPx: number
  hidden?: boolean
}

export function writingDeskSidebarBounds(containerWidth: number): {
  min: number
  max: number
} {
  if (!Number.isFinite(containerWidth) || containerWidth <= 0) {
    return { min: WRITING_DESK_SPLIT.minPx, max: WRITING_DESK_SPLIT.maxPx }
  }
  const min = Math.max(
    WRITING_DESK_SPLIT.minPx,
    containerWidth * WRITING_DESK_SPLIT.minRatio,
  )
  const max = Math.min(
    WRITING_DESK_SPLIT.maxPx,
    containerWidth * WRITING_DESK_SPLIT.maxRatio,
  )
  if (min > max) {
    return {
      min: WRITING_DESK_SPLIT.minPx,
      max: WRITING_DESK_SPLIT.maxPx,
    }
  }
  return { min, max }
}

export function clampWritingDeskSidebarWidth(
  px: number,
  containerWidth: number,
): number {
  const { min, max } = writingDeskSidebarBounds(containerWidth)
  return Math.round(Math.min(max, Math.max(min, px)))
}

export function resolveInitialSidebarWidth(
  persisted: WritingDeskSplitPersisted | null,
  containerWidth: number,
): number {
  const base = persisted?.widthPx ?? WRITING_DESK_SPLIT.defaultPx
  return clampWritingDeskSidebarWidth(base, containerWidth)
}

export function parseWritingDeskSplitStorage(
  raw: string | null,
): WritingDeskSplitPersisted | null {
  if (!raw) {
    return null
  }
  try {
    const data: unknown = JSON.parse(raw)
    if (!data || typeof data !== 'object') {
      return null
    }
    const record = data as { widthPx?: unknown; hidden?: unknown }
    if (
      typeof record.widthPx !== 'number' ||
      !Number.isFinite(record.widthPx)
    ) {
      return null
    }
    return {
      widthPx: record.widthPx,
      hidden: typeof record.hidden === 'boolean' ? record.hidden : undefined,
    }
  } catch {
    return null
  }
}

export function serializeWritingDeskSplitStorage(
  state: WritingDeskSplitPersisted,
): string {
  return JSON.stringify({
    widthPx: state.widthPx,
    ...(state.hidden ? { hidden: true } : {}),
  })
}

export function adjustSidebarWidthByKeyboard(
  currentPx: number,
  key: 'ArrowLeft' | 'ArrowRight',
  containerWidth: number,
  stepPx = WRITING_DESK_SPLIT.keyboardStepPx,
): number | null {
  const delta = key === 'ArrowLeft' ? stepPx : -stepPx
  return clampWritingDeskSidebarWidth(currentPx + delta, containerWidth)
}
