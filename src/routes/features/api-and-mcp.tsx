import { createFileRoute, notFound } from '@tanstack/react-router'

import { FeaturesContent } from '#/components/starter-docs/features-content'
import { StarterFeaturesShell } from '#/components/starter-docs/starter-site-chrome'
import { getPublicMarketingFn } from '#/lib/cms/public-marketing-fns'
import { parseFrontmatter } from '#/lib/starter-docs/frontmatter'
import { getStarterFeatureRaw } from '#/lib/starter-docs/catalog'
import { parseFeaturesMarkdown } from '#/lib/starter-docs/parse-features'
import { publicHead, PUBLIC_CACHE_HEADERS, siteUrlFromMatches } from '#/lib/seo'

export const Route = createFileRoute('/features/api-and-mcp')({
  staleTime: Number.POSITIVE_INFINITY,
  gcTime: Number.POSITIVE_INFINITY,
  headers: () => PUBLIC_CACHE_HEADERS,
  loader: async () => {
    const marketing = await getPublicMarketingFn()
    const raw = getStarterFeatureRaw('api-and-mcp')
    if (!raw) {
      throw notFound()
    }
    const { frontmatter, body } = parseFrontmatter(raw)
    const sections = parseFeaturesMarkdown(body)
    return { marketing, frontmatter, sections }
  },
  head: ({ loaderData, matches }) =>
    publicHead({
      pageLabel: loaderData?.frontmatter.title ?? 'API and MCP',
      description: loaderData?.frontmatter.description ?? '',
      path: '/features/api-and-mcp',
      siteUrl: siteUrlFromMatches(matches),
      matches,
    }),
  component: FeaturesApiPage,
})

function FeaturesApiPage() {
  const { marketing, sections } = Route.useLoaderData()
  return (
    <StarterFeaturesShell
      marketing={marketing}
      currentPath="/features/api-and-mcp"
    >
      <FeaturesContent sections={sections} />
    </StarterFeaturesShell>
  )
}
