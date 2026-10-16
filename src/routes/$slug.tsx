import { createFileRoute, notFound } from '@tanstack/react-router'

import { MAIN_CONTENT_ID, SkipLink } from '#/components/a11y/skip-link'
import { SafeRichHtml } from '#/components/blog/safe-rich-html'
import { cmsPageSearchSchema } from '#/lib/cms/pages'
import { getCmsPageBySlugFn } from '#/lib/cms/pages-fns'
import { notFoundHead, publicHead, siteUrlFromMatches } from '#/lib/seo'

export const Route = createFileRoute('/$slug')({
  staleTime: Number.POSITIVE_INFINITY,
  gcTime: Number.POSITIVE_INFINITY,
  validateSearch: (search) => cmsPageSearchSchema.parse(search),
  loaderDeps: ({ search }) => ({
    draftPreview: search.draftPreview,
  }),
  loader: async ({ params, deps }) => {
    const result = await getCmsPageBySlugFn({
      data: { slug: params.slug, draftPreview: deps.draftPreview },
    })
    if (!result) {
      throw notFound()
    }
    return result
  },
  head: ({ loaderData, matches }) => {
    if (!loaderData?.page) {
      return notFoundHead(matches)
    }
    const page = loaderData.page
    return publicHead({
      pageLabel: page.metaTitle ?? page.title,
      description: page.metaDescription ?? undefined,
      path: `/${page.slug}`,
      canonicalUrl: page.canonicalUrl ?? undefined,
      noindex: page.noindex,
      siteUrl: siteUrlFromMatches(matches),
      matches,
    })
  },
  component: CmsPage,
})

function CmsPage() {
  const { page, includeDrafts } = Route.useLoaderData()

  return (
    <div className="min-h-dvh bg-background text-foreground">
      <SkipLink />
      <main
        id={MAIN_CONTENT_ID}
        tabIndex={-1}
        className="mx-auto w-full max-w-[1400px] px-4 py-16 outline-none md:px-10"
      >
        <h1 className="text-3xl font-semibold tracking-tight">{page.title}</h1>
        {includeDrafts && page.status === 'draft' ? (
          <p className="mt-4 rounded-md border border-border bg-muted px-3 py-2 text-sm">
            Draft preview — not visible to the public.
          </p>
        ) : null}
        <article className="mt-10">
          <SafeRichHtml html={page.bodyHtml} />
        </article>
      </main>
    </div>
  )
}
