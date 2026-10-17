import { describe, expect, it } from 'vitest'

import {
  DEFAULT_SITE_BAR_WIDTH,
  parseSiteBarWidth,
  parseSiteBarWidthForSave,
  SITE_BAR_WIDTHS,
  siteBarWidthLabel,
} from './site-layout'

describe('parseSiteBarWidth', () => {
  it('keeps every known width', () => {
    for (const width of SITE_BAR_WIDTHS) {
      expect(parseSiteBarWidth(width)).toBe(width)
    }
  })

  it('falls back to full width for missing or unknown values', () => {
    expect(DEFAULT_SITE_BAR_WIDTH).toBe('full')
    expect(parseSiteBarWidth(undefined)).toBe('full')
    expect(parseSiteBarWidth(null)).toBe('full')
    expect(parseSiteBarWidth('wide')).toBe('full')
    expect(parseSiteBarWidth(3)).toBe('full')
  })
})

describe('parseSiteBarWidthForSave', () => {
  it('accepts known widths', () => {
    expect(parseSiteBarWidthForSave('contained')).toBe('contained')
    expect(parseSiteBarWidthForSave('full_content_contained')).toBe(
      'full_content_contained',
    )
  })

  it('leaves the stored value alone when the field is missing', () => {
    expect(parseSiteBarWidthForSave(undefined)).toBeUndefined()
  })

  it('rejects unknown values', () => {
    expect(() => parseSiteBarWidthForSave('wide')).toThrow()
    expect(() => parseSiteBarWidthForSave(null)).toThrow()
    expect(() => parseSiteBarWidthForSave('')).toThrow()
  })
})

describe('siteBarWidthLabel', () => {
  it('has a label for every width', () => {
    for (const width of SITE_BAR_WIDTHS) {
      expect(siteBarWidthLabel(width).length).toBeGreaterThan(0)
    }
  })
})
