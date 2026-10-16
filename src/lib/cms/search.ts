import { z } from 'zod'

export const SEARCH_PAGE_SIZE = 12

export const searchRouteSchema = z.object({
  q: z.string().max(120).default(''),
  page: z.coerce.number().int().min(1).max(200).default(1),
})

export type SearchRouteSearch = z.infer<typeof searchRouteSchema>

export function parseSearchRouteSearch(search: Record<string, unknown>) {
  return searchRouteSchema.parse(search)
}

export function stripHighlightMarks(html: string) {
  return html.replace(/<\/?mark>/gi, '')
}

/** Plain-text headline for JSON API responses (mark tags removed, no HTML). */
export function plainSearchHeadline(html: string): string {
  return stripHighlightMarks(html)
}

export type HighlightSegment = { text: string; highlighted: boolean }

/** Parse Postgres `ts_headline` output that uses `<mark>` only; strips unknown tags. */
export function parseHighlightMarks(html: string): HighlightSegment[] {
  const safe = html.replace(/<(?!\/?mark>)[^>]+>/gi, '')
  const segments: HighlightSegment[] = []
  const re = /<mark>([^<]*)<\/mark>/gi
  let lastIndex = 0
  let match = re.exec(safe)
  while (match) {
    if (match.index > lastIndex) {
      segments.push({
        highlighted: false,
        text: stripHighlightMarks(safe.slice(lastIndex, match.index)),
      })
    }
    segments.push({ highlighted: true, text: match[1] })
    lastIndex = re.lastIndex
    match = re.exec(safe)
  }
  if (lastIndex < safe.length) {
    segments.push({
      highlighted: false,
      text: stripHighlightMarks(safe.slice(lastIndex)),
    })
  }
  if (segments.length === 0) {
    return [{ highlighted: false, text: stripHighlightMarks(safe) }]
  }
  return segments
}
