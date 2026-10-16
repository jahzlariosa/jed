import { createServerFn } from '@tanstack/react-start'

import { PUBLIC_CACHE_HEADERS } from '#/lib/seo'
import { createSupabaseServerClient } from '#/lib/supabase/server'
import { SEARCH_PAGE_SIZE, searchRouteSchema } from './search'

export type SearchResultRow = {
  kind: 'post' | 'page'
  slug: string
  title: string
  excerpt: string
  headline: string
  href: string
}

export const searchPublishedContentFn = createServerFn({ method: 'GET' })
  .validator((input: unknown) => searchRouteSchema.parse(input ?? {}))
  .handler(async ({ data }) => {
    const q = data.q.trim()
    if (q.length < 2) {
      return {
        q,
        page: data.page,
        pageCount: 1,
        items: [] as SearchResultRow[],
      }
    }

    const supabase = createSupabaseServerClient()
    const offset = (data.page - 1) * SEARCH_PAGE_SIZE

    const { data: rows, error } = await supabase.rpc(
      'search_published_content',
      {
        search_query: q,
        page_limit: SEARCH_PAGE_SIZE,
        page_offset: offset,
      },
    )

    if (error) {
      console.error(error)
      const fallback = await searchPublishedContentIlike(supabase, q, offset)
      return fallback
    }

    const items = (rows ?? []).map((row) => mapRow(row))
    const pageCount = Math.max(
      1,
      items.length < SEARCH_PAGE_SIZE && data.page === 1
        ? 1
        : data.page + (items.length === SEARCH_PAGE_SIZE ? 1 : 0),
    )

    return { q, page: data.page, pageCount, items }
  })

function mapRow(row: {
  result_kind: string
  slug: string
  title: string
  excerpt: string
  headline: string
}): SearchResultRow {
  const kind = row.result_kind === 'page' ? 'page' : 'post'
  const href = kind === 'post' ? `/blog/${row.slug}` : `/${row.slug}`
  return {
    kind,
    slug: row.slug,
    title: row.title,
    excerpt: row.excerpt,
    headline: row.headline || row.title,
    href,
  }
}

async function searchPublishedContentIlike(
  supabase: ReturnType<typeof createSupabaseServerClient>,
  q: string,
  offset: number,
) {
  const pattern = `%${q.replace(/[%_]/g, '')}%`
  const [posts, pages] = await Promise.all([
    supabase
      .from('posts')
      .select('slug, title, excerpt')
      .or(
        `status.eq.published,and(status.eq.scheduled,published_at.lte.${new Date().toISOString()})`,
      )
      .or(`title.ilike.${pattern},excerpt.ilike.${pattern}`)
      .range(offset, offset + SEARCH_PAGE_SIZE - 1),
    supabase
      .from('content_entries')
      .select('slug, title, meta_description')
      .eq('kind', 'page')
      .eq('status', 'published')
      .or(`title.ilike.${pattern},meta_description.ilike.${pattern}`)
      .range(0, SEARCH_PAGE_SIZE - 1),
  ])

  const items: SearchResultRow[] = []
  for (const row of posts.data ?? []) {
    items.push({
      kind: 'post',
      slug: row.slug,
      title: row.title,
      excerpt: row.excerpt ?? '',
      headline: row.title,
      href: `/blog/${row.slug}`,
    })
  }
  for (const row of pages.data ?? []) {
    items.push({
      kind: 'page',
      slug: row.slug,
      title: row.title,
      excerpt: row.meta_description ?? '',
      headline: row.title,
      href: `/${row.slug}`,
    })
  }

  return {
    q,
    page: Math.floor(offset / SEARCH_PAGE_SIZE) + 1,
    pageCount: 1,
    items: items.slice(0, SEARCH_PAGE_SIZE),
  }
}

export function searchResponseHeaders() {
  return PUBLIC_CACHE_HEADERS
}
