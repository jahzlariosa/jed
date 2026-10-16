import '@tanstack/react-start/server-only'

import { createSupabaseServerClient } from '#/lib/supabase/server'
import {
  plainSearchHeadline,
  SEARCH_PAGE_SIZE,
  type searchRouteSchema,
} from '#/lib/cms/search'
import type { DomainContext } from '#/domain/types'
import type { z } from 'zod'

type SearchInput = z.infer<typeof searchRouteSchema>

type SearchResultRow = {
  kind: 'post' | 'page'
  slug: string
  title: string
  excerpt: string
  headline: string
  href: string
}

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
    headline: plainSearchHeadline(row.headline || row.title),
    href,
  }
}

export async function searchPublishedContentDomain(
  _ctx: DomainContext,
  input: SearchInput,
) {
  const q = input.q.trim()
  if (q.length < 2) {
    return { q, page: input.page, pageCount: 1, items: [] as SearchResultRow[] }
  }

  const supabase = createSupabaseServerClient()
  const offset = (input.page - 1) * SEARCH_PAGE_SIZE

  const { data: rows, error } = await supabase.rpc('search_published_content', {
    search_query: q,
    page_limit: SEARCH_PAGE_SIZE,
    page_offset: offset,
  })

  if (error) {
    console.error(error)
    throw new Error('Unable to search')
  }

  const items = (rows ?? []).map((row) => mapRow(row))
  const pageCount = Math.max(
    1,
    items.length < SEARCH_PAGE_SIZE && input.page === 1
      ? 1
      : input.page + (items.length === SEARCH_PAGE_SIZE ? 1 : 0),
  )

  return { q, page: input.page, pageCount, items }
}
