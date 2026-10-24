import { createFileRoute, Link } from '@tanstack/react-router'

import { BlogIndexScreen } from '#/components/blog/blog-index-screen'
import { MarketingSiteShell } from '#/components/marketing/marketing-site-shell'
import { parseBlogRouteSearch } from '#/lib/cms/blog'
import { getBlogCategoryCountsFn, listBlogPostsFn } from '#/lib/cms/blog-fns'
import { getPublicMarketingFn } from '#/lib/cms/public-marketing-fns'
import { BLOG_PUBLIC_CACHE_HEADERS } from '#/lib/seo'
import { marketingRouteHead } from '#/lib/seo/marketing-head'

export const Route = createFileRoute('/blog/')({
  staleTime: Number.POSITIVE_INFINITY,
  gcTime: Number.POSITIVE_INFINITY,
  headers: () => BLOG_PUBLIC_CACHE_HEADERS,
  validateSearch: (search) =>
    parseBlogRouteSearch(search as Record<string, unknown>),
  loaderDeps: ({ search }) => ({
    page: search.page ?? 1,
    q: search.q,
    category: search.category,
    tag: search.tag,
    draftPreview: search.draftPreview,
  }),
  loader: async ({ deps }) => {
    const [marketing, list, categories] = await Promise.all([
      getPublicMarketingFn(),
      listBlogPostsFn({
        data: {
          page: deps.page,
          q: deps.q,
          category: deps.category,
          tag: deps.tag,
          draftPreview: deps.draftPreview,
        },
      }),
      getBlogCategoryCountsFn({ data: { draftPreview: deps.draftPreview } }),
    ])
    return { marketing, list, categories }
  },
  head: ({ matches }) =>
    marketingRouteHead('/blog', matches, { rssPath: '/blog/rss.xml' }),
  component: BlogIndexPage,
})

function BlogIndexPage() {
  const search = Route.useSearch()
  const { marketing, list, categories } = Route.useLoaderData()
  return (
    <MarketingSiteShell marketing={marketing}>
      <BlogIndexScreen
        list={list}
        categories={categories}
        search={{ ...search, page: search.page ?? 1 }}
      />
      <div className="marketing-wrap marketing-wrap-wide pb-10 text-center text-sm marketing-muted">
        <Link to="/blog/rss.xml" className="hover:text-foreground">
          RSS feed
        </Link>
      </div>
    </MarketingSiteShell>
  )
}
