import { createFileRoute, notFound } from '@tanstack/react-router'
import { z } from 'zod'

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
    return { marketing, doc, rendered }
  },
  head: ({ loaderData, matches }) => {
    const doc = loaderData?.doc
    return publicHead({
      pageLabel: doc?.title ?? 'Docs',
      description: doc?.description ?? '',
      path: doc?.path ?? '/docs',
      siteUrl: siteUrlFromMatches(matches),
      matches,
    })
  },
  component: DocsSlugPage,
})

function DocsSlugPage() {
  const { marketing, doc, rendered } = Route.useLoaderData()

  return (
    <DocsShell marketing={marketing} activePath={doc.path}>
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
