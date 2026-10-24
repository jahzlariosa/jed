import { createFileRoute, Link } from '@tanstack/react-router'

import { MarketingSiteShell } from '#/components/marketing/marketing-site-shell'
import { Reveal } from '#/components/marketing/reveal'
import { getPublicMarketingFn } from '#/lib/cms/public-marketing-fns'
import {
  parseHighlightMarks,
  parseSearchRouteSearch,
  stripHighlightMarks,
} from '#/lib/cms/search'
import { searchPublishedContentFn } from '#/lib/cms/search-fns'
import { publicHead, PUBLIC_CACHE_HEADERS, siteUrlFromMatches } from '#/lib/seo'
import { DEFAULT_OG_IMAGE_ALT } from '#/lib/seo/og-image'
import { rootSeoFromMatches } from '#/lib/seo/matches-helpers'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

export const Route = createFileRoute('/search')({
  staleTime: 60_000,
  gcTime: 300_000,
  headers: () => PUBLIC_CACHE_HEADERS,
  validateSearch: (search) =>
    parseSearchRouteSearch(search as Record<string, unknown>),
  loaderDeps: ({ search }) => ({ q: search.q, page: search.page }),
  loader: async ({ deps }) => {
    const marketing = await getPublicMarketingFn()
    const results = await searchPublishedContentFn({
      data: { q: deps.q, page: deps.page },
    })
    return { marketing, results }
  },
  head: ({ matches, loaderData }) => {
    const rootSeo = rootSeoFromMatches(matches)
    return publicHead({
      pageLabel: loaderData?.results.q
        ? `Search: ${loaderData.results.q}`
        : 'Search',
      description: 'Search published pages and blog posts.',
      path: '/search',
      siteUrl: siteUrlFromMatches(matches),
      matches,
      siteDefaultDescription: rootSeo?.defaultDescription,
      socialImageUrl: rootSeo?.socialImageUrl,
      ogImageAlt: rootSeo?.defaultOgImageAlt ?? DEFAULT_OG_IMAGE_ALT,
      twitterSite: rootSeo?.twitterHandle ?? undefined,
      ogLocale: rootSeo?.ogLocale,
    })
  },
  component: SearchPage,
})

function SearchPage() {
  const { marketing, results } = Route.useLoaderData()
  const q = results.q.trim()

  return (
    <MarketingSiteShell marketing={marketing} searchQuery={q}>
      <main
        id="main-content"
        tabIndex={-1}
        className="marketing-main outline-none"
      >
        <section className="marketing-section !min-h-0 py-16 md:py-24">
          <div className="marketing-wrap marketing-wrap-wide">
            <Reveal i={0}>
              <p className="marketing-label">Search</p>
              <h1 className="mt-3 text-[clamp(1.75rem,3.5vw,2.25rem)] font-[650] leading-tight tracking-tight">
                Find a page or post
              </h1>
            </Reveal>
            <form
              method="get"
              action="/search"
              className="mt-8 flex max-w-2xl flex-col gap-3 sm:flex-row sm:items-end"
              aria-label="Site search"
            >
              <div className="flex-1">
                <Label htmlFor="search-q" className="text-[13px] font-medium">
                  Query
                </Label>
                <Input
                  id="search-q"
                  name="q"
                  type="search"
                  defaultValue={q}
                  placeholder="Try “auth” or “pricing”"
                  className="marketing-input mt-1"
                  required
                  minLength={2}
                />
              </div>
              <Button type="submit" className="marketing-btn-lg">
                Search
              </Button>
            </form>

            {q.length < 2 ? (
              <p className="mt-10 text-sm marketing-muted">
                Enter at least two characters to search published content.
              </p>
            ) : results.items.length === 0 ? (
              <div className="mt-12 rounded-2xl border border-dashed border-border px-6 py-12 text-center">
                <p className="font-medium">No results for “{q}”</p>
                <p className="mt-2 text-sm marketing-muted">
                  Try different words or browse the{' '}
                  <Link to="/blog" className="text-foreground underline">
                    blog
                  </Link>
                  .
                </p>
              </div>
            ) : (
              <ul className="mt-10 divide-y divide-border">
                {results.items.map((item, index) => (
                  <li key={`${item.kind}-${item.slug}`} className="py-6">
                    <Reveal i={index % 8}>
                      <p className="text-xs font-medium uppercase text-primary">
                        {item.kind === 'post' ? 'Post' : 'Page'}
                      </p>
                      <h2 className="mt-1 text-lg font-semibold">
                        <a href={item.href} className="hover:underline">
                          {parseHighlightMarks(item.headline).map((segment) => {
                            const key = `${segment.highlighted}:${segment.text}`
                            return segment.highlighted ? (
                              <mark
                                key={key}
                                className="rounded-sm bg-primary/15 text-foreground"
                              >
                                {segment.text}
                              </mark>
                            ) : (
                              <span key={key}>{segment.text}</span>
                            )
                          })}
                        </a>
                      </h2>
                      <p className="mt-2 text-sm marketing-muted">
                        {stripHighlightMarks(item.excerpt)}
                      </p>
                    </Reveal>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </section>
      </main>
    </MarketingSiteShell>
  )
}
