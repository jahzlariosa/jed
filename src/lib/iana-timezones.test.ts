import { afterEach, describe, expect, it } from 'vitest'

import {
  formatTimeZoneOptionLabel,
  formatUtcOffsetForTimeZone,
  getIanaTimeZoneIds,
  isKnownIanaTimeZoneId,
  parseSiteTimezoneForSave,
  resolveSiteTimezoneForUse,
  resetIanaTimeZoneCache,
} from '#/lib/iana-timezones'

describe('iana timezones', () => {
  afterEach(() => {
    resetIanaTimeZoneCache()
  })

  it('includes UTC and common IANA ids', () => {
    const ids = getIanaTimeZoneIds()
    expect(ids.length).toBeGreaterThan(100)
    expect(isKnownIanaTimeZoneId('UTC')).toBe(true)
    expect(isKnownIanaTimeZoneId('America/New_York')).toBe(true)
    expect(isKnownIanaTimeZoneId('Asia/Tokyo')).toBe(true)
  })

  it('formats offset labels', () => {
    expect(formatUtcOffsetForTimeZone('UTC')).toBe('UTC+00:00')
    const tokyo = formatUtcOffsetForTimeZone('Asia/Tokyo')
    expect(tokyo).toMatch(/^UTC[+-]\d{2}:\d{2}$/)
    expect(formatTimeZoneOptionLabel('Asia/Tokyo')).toContain('Asia/Tokyo')
    expect(formatTimeZoneOptionLabel('Asia/Tokyo')).toContain('UTC')
  })

  it('resolveSiteTimezoneForUse uses the IANA allowlist on read', () => {
    expect(resolveSiteTimezoneForUse('Asia/Tokyo')).toBe('Asia/Tokyo')
    expect(resolveSiteTimezoneForUse('Not/A_Zone')).toBe('UTC')
    expect(resolveSiteTimezoneForUse(null)).toBe('UTC')
  })

  it('accepts known zones on save', () => {
    expect(parseSiteTimezoneForSave('Europe/London')).toBe('Europe/London')
    expect(parseSiteTimezoneForSave(' UTC ')).toBe('UTC')
  })

  it('rejects unknown zones unless unchanged legacy value', () => {
    expect(() => parseSiteTimezoneForSave('Not/A_Zone')).toThrow(
      'Choose a valid timezone from the list.',
    )
    expect(
      parseSiteTimezoneForSave('Legacy/Custom', {
        previousTimezone: 'Legacy/Custom',
      }),
    ).toBe('Legacy/Custom')
    expect(() =>
      parseSiteTimezoneForSave('Legacy/Custom', {
        previousTimezone: 'UTC',
      }),
    ).toThrow('Choose a valid timezone from the list.')
  })

  it('falls back to static list when Intl.supportedValuesOf is missing', () => {
    const original = Intl.supportedValuesOf
    Object.defineProperty(Intl, 'supportedValuesOf', {
      configurable: true,
      value: undefined,
    })
    resetIanaTimeZoneCache()
    expect(getIanaTimeZoneIds()).toContain('America/New_York')
    Object.defineProperty(Intl, 'supportedValuesOf', {
      configurable: true,
      value: original,
    })
    resetIanaTimeZoneCache()
  })
})
