import { createFileRoute, notFound } from '@tanstack/react-router'

import { DocsMarkdown } from '#/components/starter-docs/docs-markdown'
import {
  DocsPager,
  DocsShell,
  DocsToc,
} from '#/components/starter-docs/docs-shell'
import { getPublicMarketingFn } from '#/lib/cms/public-marketing-fns'
import { getStarterDocByFileSlug } from '#/lib/starter-docs/catalog'
import { renderStarterDocMarkdownFn } from '#/lib/starter-docs/render-doc-fns'
import { publicHead, PUBLIC_CACHE_HEADERS, siteUrlFromMatches } from '#/lib/seo'
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
    return { marketing, doc, rendered }
  },
  head: ({ loaderData, matches }) => {
    const doc = loaderData?.doc
    return publicHead({
      pageLabel: 'Docs',
      description: doc?.description ?? '',
      path: '/docs',
      siteUrl: siteUrlFromMatches(matches),
      matches,
    })
  },
  component: DocsIndexPage,
})

function DocsIndexPage() {
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
