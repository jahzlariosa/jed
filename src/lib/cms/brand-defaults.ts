/** Default accent color when site_settings.brand_hex is missing or invalid. */
export const DEFAULT_BRAND_HEX = '#111111'

/** Default public site name when site_settings.site_name is empty. */
export const DEFAULT_PUBLIC_SITE_NAME = 'JED'

/** Restrained marketing accent (focus rings, highlights). */
export const MARKETING_ACCENT_HEX = '#1F5E4B'

/** Pre–anti-slop seed values; treated as unset in app code. */
export const LEGACY_SITE_NAME = 'Site name'
export const LEGACY_JED_SITE_NAME = 'Jed'
export const LEGACY_BRAND_HEX = '#4F46E5'

export function resolvePublicSiteName(name: string | null | undefined): string {
  const trimmed = name?.trim() ?? ''
  if (
    !trimmed ||
    trimmed === LEGACY_SITE_NAME ||
    trimmed === LEGACY_JED_SITE_NAME
  ) {
    return DEFAULT_PUBLIC_SITE_NAME
  }
  return trimmed
}

function normalizeHexCandidate(hex: string): string {
  const trimmed = hex.trim()
  const withHash = trimmed.startsWith('#') ? trimmed : `#${trimmed}`
  return withHash.toUpperCase()
}

export function resolvePublicBrandHex(hex: string | null | undefined): string {
  const trimmed = hex?.trim() ?? ''
  if (!trimmed) {
    return DEFAULT_BRAND_HEX
  }
  const normalized = normalizeHexCandidate(trimmed)
  if (normalized === LEGACY_BRAND_HEX) {
    return DEFAULT_BRAND_HEX
  }
  if (/^#[0-9A-Fa-f]{6}$/.test(normalized)) {
    return normalized
  }
  return DEFAULT_BRAND_HEX
}
