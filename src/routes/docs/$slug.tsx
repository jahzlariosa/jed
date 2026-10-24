import { createFileRoute, notFound } from '@tanstack/react-router'
import { z } from 'zod'

import { StructuredData } from '#/components/seo/structured-data'
import { DocsMarkdown } from '#/components/starter-docs/docs-markdown'
import {
  DocsPager,
  DocsShell,
  DocsToc,
} from '#/components/starter-docs/docs-shell'
import { getPublicMarketingFn } from '#/lib/cms/public-marketing-fns'
import { getStarterDocByRouteSlug } from '#/lib/starter-docs/catalog'
import { renderStarterDocMarkdownFn } from '#/lib/starter-docs/render-doc-fns'
import { publicHead, PUBLIC_CACHE_HEADERS, siteUrlFromMatches } from '#/lib/seo'
import { DEFAULT_OG_IMAGE_ALT } from '#/lib/seo/og-image'
import { rootSeoFromMatches } from '#/lib/seo/matches-helpers'
import { MARKETING_ROUTE_SEO } from '#/lib/seo/marketing-routes'
import { buildDocsJsonLdFn } from '#/lib/seo/public-route-fns'

export const Route = createFileRoute('/docs/$slug')({
  staleTime: Number.POSITIVE_INFINITY,
  gcTime: Number.POSITIVE_INFINITY,
  headers: () => PUBLIC_CACHE_HEADERS,
  params: {
    parse: (params) => ({
      slug: z.string().min(1).parse(params.slug),
    }),
  },
  loader: async ({ params }) => {
    const marketing = await getPublicMarketingFn()
    const doc = getStarterDocByRouteSlug(params.slug)
    if (!doc || doc.fileSlug === 'index') {
      throw notFound()
    }
    const rendered = await renderStarterDocMarkdownFn({
      data: { body: doc.body },
    })
    const jsonLdResult = await buildDocsJsonLdFn({
      data: {
        title: doc.title,
        description:
          doc.description || MARKETING_ROUTE_SEO['/docs'].description,
        path: doc.path,
      },
    })
    return { marketing, doc, rendered, jsonLd: jsonLdResult.jsonLd }
  },
  head: ({ loaderData, matches }) => {
    const doc = loaderData?.doc
    const rootSeo = rootSeoFromMatches(matches)
    return publicHead({
      pageLabel: doc?.title ?? 'Docs',
      description: doc?.description,
      path: doc?.path ?? '/docs',
      siteUrl: siteUrlFromMatches(matches),
      matches,
      siteDefaultDescription:
        rootSeo?.defaultDescription ?? MARKETING_ROUTE_SEO['/docs'].description,
      socialImageUrl: rootSeo?.socialImageUrl,
      ogImageAlt: rootSeo?.defaultOgImageAlt ?? DEFAULT_OG_IMAGE_ALT,
      ogLocale: rootSeo?.ogLocale,
      twitterSite: rootSeo?.twitterHandle ?? undefined,
    })
  },
  component: DocsSlugPage,
})

function DocsSlugPage() {
  const { marketing, doc, rendered, jsonLd } = Route.useLoaderData()

  return (
    <DocsShell marketing={marketing} activePath={doc.path}>
      <StructuredData json={jsonLd} />
      <article
        id="main-content"
        tabIndex={-1}
        className="docs-article outline-none"
      >
        <DocsMarkdown html={rendered.html} />
        <DocsPager current={doc} />
      </article>
      <DocsToc headings={rendered.headings} />
    </DocsShell>
  )
}
