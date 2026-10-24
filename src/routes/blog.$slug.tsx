import { createFileRoute, notFound } from '@tanstack/react-router'

import { StructuredData } from '#/components/seo/structured-data'
import { SafeRichHtml } from '#/components/blog/safe-rich-html'
import { MarketingSiteShell } from '#/components/marketing/marketing-site-shell'
import {
  blogListSearchSchema,
  formatPostDate,
  POST_CATEGORY_LABELS,
} from '#/lib/cms/blog'
import { getBlogPostBySlugFn } from '#/lib/cms/blog-fns'
import { getPublicMarketingFn } from '#/lib/cms/public-marketing-fns'
import { optimizedCoverImageUrl } from '#/lib/media/cover-image'
import { buildBlogPostJsonLdFn } from '#/lib/seo/public-route-fns'
import {
  BLOG_PUBLIC_CACHE_HEADERS,
  notFoundHead,
  publicHead,
  siteUrlFromMatches,
} from '#/lib/seo'
import { DEFAULT_OG_IMAGE_ALT } from '#/lib/seo/og-image'
import { rootSeoFromMatches } from '#/lib/seo/matches-helpers'

export const Route = createFileRoute('/blog/$slug')({
  staleTime: Number.POSITIVE_INFINITY,
  gcTime: Number.POSITIVE_INFINITY,
  headers: () => BLOG_PUBLIC_CACHE_HEADERS,
  validateSearch: (search) =>
    blogListSearchSchema.pick({ draftPreview: true }).parse(search),
  loaderDeps: ({ search }) => ({
    draftPreview: search.draftPreview,
  }),
  loader: async ({ params, deps }) => {
    const [marketing, result] = await Promise.all([
      getPublicMarketingFn(),
      getBlogPostBySlugFn({
        data: { slug: params.slug, draftPreview: deps.draftPreview },
      }),
    ])
    if (!result) {
      throw notFound()
    }
    const jsonLdResult = result
      ? await buildBlogPostJsonLdFn({
          data: {
            slug: result.post.slug,
            title: result.post.title,
            excerpt: result.post.excerpt,
            metaDescription: result.post.metaDescription,
            coverImageUrl: result.post.coverImageUrl,
            ogImageUrl: result.post.ogImageUrl,
            publishedAt: result.post.publishedAt,
            updatedAt: result.post.updatedAt,
            authorName: result.post.authorName,
          },
        })
      : { jsonLd: null }
    return { marketing, ...result, jsonLd: jsonLdResult.jsonLd }
  },
  head: ({ loaderData, matches }) => {
    if (!loaderData?.post) {
      return notFoundHead(matches)
    }
    const post = loaderData.post
    const rootSeo = rootSeoFromMatches(matches)
    return publicHead({
      pageLabel: post.metaTitle ?? post.title,
      description: post.metaDescription ?? post.excerpt ?? undefined,
      path: `/blog/${post.slug}`,
      canonicalUrl: post.canonicalUrl ?? undefined,
      noindex: post.noindex,
      siteUrl: siteUrlFromMatches(matches),
      matches,
      siteDefaultDescription: rootSeo?.defaultDescription,
      socialImageUrl: rootSeo?.socialImageUrl,
      ogType: 'article',
      ogImageUrl: post.ogImageUrl ?? post.coverImageUrl ?? undefined,
      ogImageAlt:
        post.ogImageAlt ??
        post.coverImageAlt ??
        rootSeo?.defaultOgImageAlt ??
        DEFAULT_OG_IMAGE_ALT,
      articlePublishedTime: post.publishedAt ?? undefined,
      articleModifiedTime: post.updatedAt ?? undefined,
      articleAuthor: post.authorName,
      rssPath: '/blog/rss.xml',
    })
  },
  component: BlogPostPage,
})

function BlogPostPage() {
  const data = Route.useLoaderData()
  const { post, marketing, jsonLd } = data
  const coverSrc = optimizedCoverImageUrl(post.coverImageUrl)

  return (
    <MarketingSiteShell marketing={marketing}>
      <StructuredData json={jsonLd} />
      <main
        id="main-content"
        tabIndex={-1}
        className="marketing-main outline-none"
      >
        <article className="marketing-wrap marketing-post-body">
          <p className="text-sm marketing-muted">
            {POST_CATEGORY_LABELS[post.category]} ·{' '}
            {formatPostDate(post.publishedAt)} · {post.readMinutes} min read
          </p>
          <h1 className="mt-4">{post.title}</h1>
          {post.excerpt ? (
            <p className="marketing-post-dek">{post.excerpt}</p>
          ) : null}
          {coverSrc ? (
            <img
              src={coverSrc}
              alt={post.coverImageAlt ?? post.title}
              width={1200}
              height={675}
              fetchPriority="high"
              className="mt-8 aspect-video w-full rounded-lg border border-border object-cover"
            />
          ) : null}
          {data.includeDrafts && post.status === 'draft' ? (
            <p className="mt-4 rounded-md border border-border bg-muted px-3 py-2 text-sm">
              Draft preview. This post is not public yet.
            </p>
          ) : null}
          <div className="mt-10">
            <SafeRichHtml html={post.bodyHtml} />
          </div>
        </article>
      </main>
    </MarketingSiteShell>
  )
}
