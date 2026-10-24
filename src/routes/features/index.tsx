import { createFileRoute } from '@tanstack/react-router'

import { FeaturesPage } from '#/components/marketing/features-page'
import { getPublicMarketingFn } from '#/lib/cms/public-marketing-fns'
import { marketingRouteHead } from '#/lib/seo/marketing-head'
import { PUBLIC_CACHE_HEADERS } from '#/lib/seo'

export const Route = createFileRoute('/features/')({
  staleTime: Number.POSITIVE_INFINITY,
  gcTime: Number.POSITIVE_INFINITY,
  headers: () => PUBLIC_CACHE_HEADERS,
  loader: () => getPublicMarketingFn(),
  head: ({ matches }) => marketingRouteHead('/features', matches),
  component: FeaturesIndexRoute,
})

function FeaturesIndexRoute() {
  const marketing = Route.useLoaderData()
  return <FeaturesPage marketing={marketing} />
}
