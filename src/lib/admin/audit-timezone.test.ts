import { describe, expect, it } from 'vitest'

import {
  parseSiteWallTimeToUtcIso,
  utcIsoToSiteWallInput,
} from './audit-timezone'

describe('audit site timezone helpers', () => {
  it('round-trips wall time in Tokyo', () => {
    const iso = parseSiteWallTimeToUtcIso('2026-06-15T21:30', 'Asia/Tokyo')
    expect(iso).toBeTruthy()
    expect(utcIsoToSiteWallInput(iso!, 'Asia/Tokyo')).toBe('2026-06-15T21:30')
  })

  it('rejects malformed wall input', () => {
    expect(parseSiteWallTimeToUtcIso('2026-06-15', 'UTC')).toBeNull()
    expect(parseSiteWallTimeToUtcIso('not-a-date', 'UTC')).toBeNull()
  })
})
