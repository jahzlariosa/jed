import { createFileRoute, notFound } from '@tanstack/react-router'

import { StructuredData } from '#/components/seo/structured-data'
import { DocsMarkdown } from '#/components/starter-docs/docs-markdown'
import {
  DocsPager,
  DocsShell,
  DocsToc,
} from '#/components/starter-docs/docs-shell'
import { getPublicMarketingFn } from '#/lib/cms/public-marketing-fns'
import { getStarterDocByFileSlug } from '#/lib/starter-docs/catalog'
import { renderStarterDocMarkdownFn } from '#/lib/starter-docs/render-doc-fns'
import { PUBLIC_CACHE_HEADERS } from '#/lib/seo'
import { marketingRouteHead } from '#/lib/seo/marketing-head'
import { MARKETING_ROUTE_SEO } from '#/lib/seo/marketing-routes'
import { buildDocsJsonLdFn } from '#/lib/seo/public-route-fns'

export const Route = createFileRoute('/docs/')({
  staleTime: Number.POSITIVE_INFINITY,
  gcTime: Number.POSITIVE_INFINITY,
  headers: () => PUBLIC_CACHE_HEADERS,
  loader: async () => {
    const marketing = await getPublicMarketingFn()
    const doc = getStarterDocByFileSlug('index')
    if (!doc) {
      throw notFound()
    }
    const rendered = await renderStarterDocMarkdownFn({
      data: { body: doc.body },
    })
    const jsonLdResult = await buildDocsJsonLdFn({
      data: {
        title: doc.title,
        description:
          MARKETING_ROUTE_SEO['/docs'].description || doc.description,
        path: doc.path,
      },
    })
    return { marketing, doc, rendered, jsonLd: jsonLdResult.jsonLd }
  },
  head: ({ matches }) => marketingRouteHead('/docs', matches),
  component: DocsIndexPage,
})

function DocsIndexPage() {
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
