import { createFileRoute } from '@tanstack/react-router'

import { FeaturesPage } from '#/components/marketing/features-page'
import { getPublicMarketingFn } from '#/lib/cms/public-marketing-fns'
import { publicHead, PUBLIC_CACHE_HEADERS, siteUrlFromMatches } from '#/lib/seo'

const FEATURES_DESCRIPTION =
  'What comes with JED: auth, content, admin, and a versioned API with MCP for client sites on TanStack Start and Supabase.'

export const Route = createFileRoute('/features/')({
  staleTime: Number.POSITIVE_INFINITY,
  gcTime: Number.POSITIVE_INFINITY,
  headers: () => PUBLIC_CACHE_HEADERS,
  loader: () => getPublicMarketingFn(),
  head: ({ matches }) =>
    publicHead({
      pageLabel: 'Features',
      description: FEATURES_DESCRIPTION,
      path: '/features',
      siteUrl: siteUrlFromMatches(matches),
      matches,
    }),
  component: FeaturesIndexRoute,
})

function FeaturesIndexRoute() {
  const marketing = Route.useLoaderData()
  return <FeaturesPage marketing={marketing} />
}
