import {
  resolvePublicBrandHex,
  resolvePublicSiteName,
} from '#/lib/cms/brand-defaults'
import { parseSiteBarWidth, type SiteBarWidth } from '#/lib/cms/site-layout'

export type PublicMarketing = {
  siteName: string
  contactEmail: string | null
  brandHex: string
  navbarWidth?: SiteBarWidth
  footerWidth?: SiteBarWidth
}

export function normalizePublicMarketing(
  marketing: PublicMarketing,
): Required<PublicMarketing> {
  return {
    ...marketing,
    siteName: resolvePublicSiteName(marketing.siteName),
    brandHex: resolvePublicBrandHex(marketing.brandHex),
    navbarWidth: parseSiteBarWidth(marketing.navbarWidth),
    footerWidth: parseSiteBarWidth(marketing.footerWidth),
  }
}
