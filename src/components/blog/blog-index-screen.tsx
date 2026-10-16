import { Link } from '@tanstack/react-router'

import { Reveal } from '#/components/marketing/reveal'
import { optimizedCoverImageUrl } from '#/lib/media/cover-image'
import {
  formatPostDate,
  POST_CATEGORY_LABELS,
  type BlogCategoryCounts,
  type BlogListResult,
  type BlogListSearch,
} from '#/lib/cms/blog'
import { Button } from '@/components/ui/button'

export function BlogIndexScreen({
  list,
  search,
}: {
  list: BlogListResult
  categories?: BlogCategoryCounts
  search: BlogListSearch
}) {
  const { featured, items, page, pageCount } = list
  const showFeatured =
    featured && page === 1 && !search.tag && !search.q && !search.category
  const rows = showFeatured ? [featured, ...items] : items

  return (
    <main
      id="main-content"
      tabIndex={-1}
      className="marketing-main outline-none"
    >
      <section>
        <div className="marketing-wrap marketing-wrap-wide">
          <div className="marketing-page-hero !px-0">
            <Reveal i={0}>
              <h1>Blog</h1>
              <p className="marketing-page-lead">
                Product notes and guides from the team.
              </p>
            </Reveal>
          </div>

          {rows.length === 0 ? (
            <div className="mt-16 rounded-2xl border border-dashed border-border px-6 py-16 text-center">
              <p className="text-lg font-medium">No posts yet</p>
              <p className="mt-2 text-sm marketing-muted">
                Publish a story from admin when you are ready to share an
                update.
              </p>
            </div>
          ) : (
            <ul className="mt-10 list-none p-0">
              {rows.map((post, index) => (
                <li key={post.id}>
                  <Reveal i={index % 6}>
                    <PostRow post={post} search={search} />
                  </Reveal>
                </li>
              ))}
            </ul>
          )}

          {pageCount > 1 ? (
            <nav
              className="mt-12 flex items-center justify-center gap-3"
              aria-label="Pagination"
            >
              <Button asChild variant="outline" size="sm" disabled={page <= 1}>
                <Link
                  to="/blog"
                  search={{ ...search, page: Math.max(1, page - 1) }}
                >
                  Previous
                </Link>
              </Button>
              <span className="text-sm marketing-muted">
                Page {page} of {pageCount}
              </span>
              <Button
                asChild
                variant="outline"
                size="sm"
                disabled={page >= pageCount}
              >
                <Link
                  to="/blog"
                  search={{ ...search, page: Math.min(pageCount, page + 1) }}
                >
                  Next
                </Link>
              </Button>
            </nav>
          ) : null}
        </div>
      </section>
    </main>
  )
}

function PostRow({
  post,
  search,
}: {
  post: BlogListResult['items'][number]
  search: BlogListSearch
}) {
  const thumb = optimizedCoverImageUrl(post.coverImageUrl)
  return (
    <article className="marketing-blog-item">
      <div className="flex min-w-0 gap-4">
        {thumb ? (
          <img
            src={thumb}
            alt=""
            width={160}
            height={90}
            loading="lazy"
            className="hidden aspect-video w-32 shrink-0 rounded-md border border-border object-cover sm:block md:w-40"
          />
        ) : null}
        <div className="min-w-0">
          <span className="inline-block rounded-full border border-border px-2 py-0.5 text-[11.5px] text-muted-foreground mb-2">
            {POST_CATEGORY_LABELS[post.category]}
          </span>
          <h2>
            <Link
              to="/blog/$slug"
              params={{ slug: post.slug }}
              search={{ draftPreview: search.draftPreview }}
              className="hover:underline"
            >
              {post.title}
            </Link>
          </h2>
          {post.excerpt ? <p>{post.excerpt}</p> : null}
        </div>
      </div>
      <p className="marketing-blog-meta">
        {formatPostDate(post.publishedAt)}
        <br />
        {post.readMinutes} min read
      </p>
    </article>
  )
}
