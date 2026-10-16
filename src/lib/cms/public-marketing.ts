import {
  resolvePublicBrandHex,
  resolvePublicSiteName,
} from '#/lib/cms/brand-defaults'

export type PublicMarketing = {
  siteName: string
  contactEmail: string | null
  brandHex: string
}

export function normalizePublicMarketing(
  marketing: PublicMarketing,
): PublicMarketing {
  return {
    ...marketing,
    siteName: resolvePublicSiteName(marketing.siteName),
    brandHex: resolvePublicBrandHex(marketing.brandHex),
  }
}
