import { IANA_TIMEZONE_FALLBACK_IDS } from '#/lib/iana-timezones-fallback'

const EXTRA_TIME_ZONE_IDS = ['UTC'] as const

let cachedIds: readonly string[] | null = null
let cachedIdSet: ReadonlySet<string> | null = null

function readIntlTimeZoneIds(): string[] | null {
  if (typeof Intl === 'undefined') {
    return null
  }
  const supportedValuesOf = (
    Intl as typeof Intl & {
      supportedValuesOf?: (key: string) => string[]
    }
  ).supportedValuesOf
  if (typeof supportedValuesOf !== 'function') {
    return null
  }
  try {
    return supportedValuesOf('timeZone')
  } catch {
    return null
  }
}

/** Sorted IANA timezone ids (includes UTC for legacy site_settings rows). */
export function getIanaTimeZoneIds(): readonly string[] {
  if (cachedIds) {
    return cachedIds
  }
  const fromIntl = readIntlTimeZoneIds()
  const base = fromIntl ?? [...IANA_TIMEZONE_FALLBACK_IDS]
  cachedIds = [...new Set([...EXTRA_TIME_ZONE_IDS, ...base])].sort((a, b) =>
    a.localeCompare(b),
  )
  return cachedIds
}

export function getIanaTimeZoneIdSet(): ReadonlySet<string> {
  if (!cachedIdSet) {
    cachedIdSet = new Set(getIanaTimeZoneIds())
  }
  return cachedIdSet
}

export function isKnownIanaTimeZoneId(value: string): boolean {
  return getIanaTimeZoneIdSet().has(value)
}

export function normalizeOffsetLabel(raw: string): string {
  if (raw === 'GMT' || raw === 'UTC') {
    return 'UTC+00:00'
  }
  const match = /^GMT([+-])(\d{1,2})(?::(\d{2}))?$/.exec(raw)
  if (!match) {
    return raw.replace(/^GMT/, 'UTC')
  }
  const sign = match[1]
  const hours = match[2].padStart(2, '0')
  const minutes = (match[3] ?? '00').padStart(2, '0')
  return `UTC${sign}${hours}:${minutes}`
}

/** Current UTC offset label for a zone, e.g. UTC+09:00. */
export function formatUtcOffsetForTimeZone(
  timeZone: string,
  date = new Date(),
): string {
  try {
    const part = new Intl.DateTimeFormat('en-US', {
      timeZone,
      timeZoneName: 'shortOffset',
    })
      .formatToParts(date)
      .find((piece) => piece.type === 'timeZoneName')?.value
    if (!part) {
      return ''
    }
    return normalizeOffsetLabel(part)
  } catch {
    return ''
  }
}

export function formatTimeZoneOptionLabel(
  timeZone: string,
  date = new Date(),
): string {
  const offset = formatUtcOffsetForTimeZone(timeZone, date)
  return offset ? `${timeZone} (${offset})` : timeZone
}

const SITE_TIMEZONE_MAX = 64

/** Read path: known IANA ids only; unknown stored values fall back to UTC. */
export function resolveSiteTimezoneForUse(value: unknown): string {
  const trimmed = String(value ?? 'UTC')
    .trim()
    .slice(0, SITE_TIMEZONE_MAX)
  if (!trimmed) {
    return 'UTC'
  }
  if (isKnownIanaTimeZoneId(trimmed)) {
    return trimmed
  }
  return 'UTC'
}

export function parseSiteTimezoneForSave(
  value: unknown,
  options?: { previousTimezone?: string | null },
): string {
  const trimmed = String(value ?? 'UTC')
    .trim()
    .slice(0, SITE_TIMEZONE_MAX)
  if (!trimmed) {
    throw new Error('Choose a valid timezone from the list.')
  }
  if (isKnownIanaTimeZoneId(trimmed)) {
    return trimmed
  }
  const previous = options?.previousTimezone?.trim()
  if (previous && trimmed === previous) {
    return trimmed
  }
  throw new Error('Choose a valid timezone from the list.')
}

/** For tests: reset module cache after mocking Intl. */
export function resetIanaTimeZoneCache(): void {
  cachedIds = null
  cachedIdSet = null
}
