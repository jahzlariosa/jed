import { createFileRoute } from '@tanstack/react-router'

import { FeaturesPage } from '#/components/marketing/features-page'
import { getPublicMarketingFn } from '#/lib/cms/public-marketing-fns'
import { publicHead, PUBLIC_CACHE_HEADERS, siteUrlFromMatches } from '#/lib/seo'

const FEATURES_DESCRIPTION =
  'Every feature in JED, the TanStack Start and Supabase starter for client sites: auth and two-step login, RLS roles, admin and editor, blog, contact inbox, REST API, MCP server, and CI.'

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
