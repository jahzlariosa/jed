const WALL_TIME_PATTERN = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})$/

type ZonedParts = {
  year: number
  month: number
  day: number
  hour: number
  minute: number
}

function readZonedParts(date: Date, timeZone: string): ZonedParts {
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  })
  const parts = formatter.formatToParts(date)
  const pick = (type: Intl.DateTimeFormatPartTypes) =>
    Number.parseInt(parts.find((part) => part.type === type)?.value ?? '0', 10)
  return {
    year: pick('year'),
    month: pick('month'),
    day: pick('day'),
    hour: pick('hour'),
    minute: pick('minute'),
  }
}

/** Wall clock in `timeZone` → UTC `Date` (iterative offset fix). */
export function wallTimeInTimeZoneToUtc(
  year: number,
  month: number,
  day: number,
  hour: number,
  minute: number,
  timeZone: string,
): Date {
  let utcMs = Date.UTC(year, month - 1, day, hour, minute)
  for (let attempt = 0; attempt < 4; attempt += 1) {
    const zoned = readZonedParts(new Date(utcMs), timeZone)
    const zonedAsUtc = Date.UTC(
      zoned.year,
      zoned.month - 1,
      zoned.day,
      zoned.hour,
      zoned.minute,
    )
    const intended = Date.UTC(year, month - 1, day, hour, minute)
    utcMs += intended - zonedAsUtc
  }
  return new Date(utcMs)
}

export function parseSiteWallTimeToUtcIso(
  value: string,
  timeZone: string,
): string | null {
  const match = WALL_TIME_PATTERN.exec(value.trim())
  if (!match) {
    return null
  }
  const [, y, mo, d, h, mi] = match
  const date = wallTimeInTimeZoneToUtc(
    Number(y),
    Number(mo),
    Number(d),
    Number(h),
    Number(mi),
    timeZone,
  )
  if (Number.isNaN(date.getTime())) {
    return null
  }
  return date.toISOString()
}

export function utcIsoToSiteWallInput(
  iso: string,
  timeZone: string,
): string | null {
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) {
    return null
  }
  const parts = readZonedParts(date, timeZone)
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${parts.year}-${pad(parts.month)}-${pad(parts.day)}T${pad(parts.hour)}:${pad(parts.minute)}`
}
