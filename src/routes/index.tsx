import { createFileRoute } from '@tanstack/react-router'

import { StructuredData } from '#/components/seo/structured-data'
import { HomePage } from '#/components/marketing/home-page'
import {
  DEFAULT_PUBLIC_SITE_NAME,
  resolvePublicSiteName,
} from '#/lib/cms/brand-defaults'
import { getHomeRouteLoaderFn } from '#/lib/seo/public-route-fns'
import { PUBLIC_CACHE_HEADERS, publicHead, siteUrlFromMatches } from '#/lib/seo'

export const Route = createFileRoute('/')({
  staleTime: Infinity,
  headers: () => PUBLIC_CACHE_HEADERS,
  loader: () => getHomeRouteLoaderFn(),
  head: ({ loaderData, matches }) => {
    const siteName = resolvePublicSiteName(
      loaderData?.marketing.siteName ?? DEFAULT_PUBLIC_SITE_NAME,
    )
    const siteUrl = siteUrlFromMatches(matches)
    const description = loaderData?.seo.defaultDescription?.trim() || undefined
    return publicHead({
      title: siteName,
      description,
      path: '/',
      siteUrl,
      matches,
      ogImageUrl: loaderData?.seo.socialImageUrl ?? undefined,
      ogImageAlt: loaderData?.seo.defaultOgImageAlt ?? undefined,
      ogLocale: loaderData?.seo.ogLocale,
      twitterSite: loaderData?.seo.twitterHandle ?? undefined,
    })
  },
  component: Home,
})

function Home() {
  const { marketing, jsonLd } = Route.useLoaderData()
  return (
    <>
      <StructuredData json={jsonLd} />
      <HomePage marketing={marketing} />
    </>
  )
}
