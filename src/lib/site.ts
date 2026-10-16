import { createServerFn } from '@tanstack/react-start'

import { loadSeoBranding } from './seo.server'
import { getSiteUrl } from './site.server'

/** Public, identity-free. Safe to cache for the life of the client router. */
export const getRootShellFn = createServerFn({ method: 'GET' }).handler(
  async () => {
    const { loadPublicSeoSettings } = await import(
      './seo/public-settings.server'
    )
    const [siteUrl, seo, publicSeo] = await Promise.all([
      getSiteUrl(),
      loadSeoBranding(),
      loadPublicSeoSettings(),
    ])
    return {
      siteUrl,
      seo: {
        ...seo,
        defaultDescription: publicSeo.defaultDescription,
        ogLocale: publicSeo.ogLocale,
        language: publicSeo.language,
        twitterHandle: publicSeo.twitterHandle,
        socialImageUrl: publicSeo.socialImageUrl,
        defaultOgImageAlt: publicSeo.defaultOgImageAlt,
        allowSearchIndexing: publicSeo.allowSearchIndexing,
        googleSiteVerification: publicSeo.googleSiteVerification,
        bingSiteVerification: publicSeo.bingSiteVerification,
        ga4MeasurementId: publicSeo.ga4MeasurementId,
        gtmContainerId: publicSeo.gtmContainerId,
        plausibleDomain: publicSeo.plausibleDomain,
        vercelAnalyticsEnabled: publicSeo.vercelAnalyticsEnabled,
        org: {
          schemaType: publicSeo.orgSchemaType,
          legalName: publicSeo.orgLegalName,
          logoUrl: publicSeo.orgLogoUrl,
          address: publicSeo.orgAddress,
          phone: publicSeo.orgPhone,
          email: publicSeo.orgEmail,
          openingHours: publicSeo.orgOpeningHours,
          sameAs: publicSeo.orgSameAs,
        },
      },
    }
  },
)

/** @deprecated Use `getRootShellFn` */
export const getSiteUrlFn = createServerFn({ method: 'GET' }).handler(
  async () => ({ siteUrl: getSiteUrl() }),
)
