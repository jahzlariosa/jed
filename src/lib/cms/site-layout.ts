import { z } from 'zod'

export const SITE_BAR_WIDTHS = [
  'full',
  'contained',
  'full_content_contained',
] as const

export const siteBarWidthSchema = z.enum(SITE_BAR_WIDTHS)

export type SiteBarWidth = z.infer<typeof siteBarWidthSchema>

export const DEFAULT_SITE_BAR_WIDTH: SiteBarWidth = 'full'

const SITE_BAR_WIDTH_LABELS: Record<SiteBarWidth, string> = {
  full: 'Full width',
  contained: 'Contained',
  full_content_contained: 'Full width, content contained',
}

export function siteBarWidthLabel(width: SiteBarWidth): string {
  return SITE_BAR_WIDTH_LABELS[width]
}

/** Lenient read for stored rows: unknown or missing values fall back to full width. */
export function parseSiteBarWidth(value: unknown): SiteBarWidth {
  const result = siteBarWidthSchema.safeParse(value)
  return result.success ? result.data : DEFAULT_SITE_BAR_WIDTH
}

/**
 * Strict read for saves. Missing means "leave as is" so callers that do not
 * send the field keep the stored value. Anything else must be a known width.
 */
export function parseSiteBarWidthForSave(
  value: unknown,
): SiteBarWidth | undefined {
  if (value === undefined) {
    return undefined
  }
  const result = siteBarWidthSchema.safeParse(value)
  if (!result.success) {
    throw new Error('Choose a valid navbar and footer width.')
  }
  return result.data
}
