import {
  publicHead,
  type PublicHeadInput,
  type RootMatch,
  siteUrlFromMatches,
} from '#/lib/seo'
import { DEFAULT_OG_IMAGE_ALT } from '#/lib/seo/og-image'
import { rootSeoFromMatches } from '#/lib/seo/matches-helpers'
import {
  MARKETING_ROUTE_SEO,
  type MarketingRouteSeo,
} from '#/lib/seo/marketing-routes'

type MarketingRoutePath = keyof typeof MARKETING_ROUTE_SEO

export function marketingRouteHead(
  routePath: MarketingRoutePath,
  matches: ReadonlyArray<RootMatch>,
  extra?: Partial<PublicHeadInput>,
) {
  const route: MarketingRouteSeo = MARKETING_ROUTE_SEO[routePath]
  const rootSeo = rootSeoFromMatches(matches)
  return publicHead({
    title: route.title,
    description: route.description,
    path: routePath,
    siteUrl: siteUrlFromMatches(matches),
    matches,
    siteDefaultDescription: rootSeo?.defaultDescription,
    socialImageUrl: rootSeo?.socialImageUrl,
    ogImageAlt: rootSeo?.defaultOgImageAlt ?? DEFAULT_OG_IMAGE_ALT,
    ogLocale: rootSeo?.ogLocale,
    twitterSite: rootSeo?.twitterHandle ?? undefined,
    ...extra,
  })
}
