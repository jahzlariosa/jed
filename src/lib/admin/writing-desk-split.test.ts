import { describe, expect, it } from 'vitest'

import {
  adjustSidebarWidthByKeyboard,
  clampWritingDeskSidebarWidth,
  parseWritingDeskSplitStorage,
  resolveInitialSidebarWidth,
  serializeWritingDeskSplitStorage,
  writingDeskSidebarBounds,
  WRITING_DESK_SPLIT,
} from './writing-desk-split'

describe('writingDeskSidebarBounds', () => {
  it('uses pixel and percent limits on a wide container', () => {
    expect(writingDeskSidebarBounds(1200)).toEqual({ min: 260, max: 540 })
  })

  it('caps max at 560px before percent on very wide containers', () => {
    expect(writingDeskSidebarBounds(4000).max).toBe(560)
  })
})

describe('clampWritingDeskSidebarWidth', () => {
  it('clamps below minimum', () => {
    expect(clampWritingDeskSidebarWidth(100, 1200)).toBe(260)
  })

  it('clamps above maximum', () => {
    expect(clampWritingDeskSidebarWidth(900, 1200)).toBe(540)
  })

  it('keeps in-range values', () => {
    expect(clampWritingDeskSidebarWidth(400, 1200)).toBe(400)
  })
})

describe('resolveInitialSidebarWidth', () => {
  it('defaults when storage is empty', () => {
    expect(resolveInitialSidebarWidth(null, 1200)).toBe(320)
  })

  it('clamps persisted width', () => {
    expect(resolveInitialSidebarWidth({ widthPx: 40 }, 1200)).toBe(260)
  })
})

describe('writing desk split storage', () => {
  it('round-trips width and hidden flag', () => {
    const raw = serializeWritingDeskSplitStorage({
      widthPx: 360,
      hidden: true,
    })
    expect(parseWritingDeskSplitStorage(raw)).toEqual({
      widthPx: 360,
      hidden: true,
    })
  })

  it('omits hidden when false', () => {
    const raw = serializeWritingDeskSplitStorage({ widthPx: 320 })
    expect(JSON.parse(raw)).toEqual({ widthPx: 320 })
  })

  it('rejects invalid JSON and shapes', () => {
    expect(parseWritingDeskSplitStorage('not-json')).toBeNull()
    expect(parseWritingDeskSplitStorage('{"widthPx":"wide"}')).toBeNull()
    expect(parseWritingDeskSplitStorage('[]')).toBeNull()
  })
})

describe('adjustSidebarWidthByKeyboard', () => {
  it('steps with arrow keys and clamps', () => {
    const container = 1200
    const start = WRITING_DESK_SPLIT.defaultPx
    const wider = adjustSidebarWidthByKeyboard(start, 'ArrowLeft', container)
    expect(wider).toBe(start + 8)
    const atMax = clampWritingDeskSidebarWidth(900, container)
    expect(adjustSidebarWidthByKeyboard(atMax, 'ArrowLeft', container)).toBe(
      atMax,
    )
    expect(adjustSidebarWidthByKeyboard(atMax, 'ArrowRight', container)).toBe(
      atMax - 8,
    )
  })
})
