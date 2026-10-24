import { createServerFn } from '@tanstack/react-start'
import { setResponseStatus } from '@tanstack/react-start/server'
import { z } from 'zod'

import { isStarterDemoPostSlug } from '#/lib/cms/starter-demo-content'
import { staffCanPreviewDrafts } from '#/lib/cms/preview-access.server'
import { createSupabaseAnonReadClient } from '#/lib/supabase/anon-read.server'
import { createSupabaseServerClient } from '#/lib/supabase/server'

import {
  type BlogListResult,
  type BlogPostDto,
  type BlogPostPageResult,
  blogListSearchSchema,
  draftPreviewSearchSchema,
  estimateReadMinutes,
  excerptFromHtml,
  planBlogListRange,
  resolveIncludeDrafts,
} from './blog'
import { isPostPubliclyVisible } from './post-publish'
import type { PostKind } from './schemas'
import { sanitizeCanonicalUrl, sanitizeCmsImageUrl } from '#/lib/url-security'

type PostRow = {
  id: string
  kind: string
  slug: string
  title: string
  excerpt: string
  body_html: string
  cover_image_url: string | null
  published_at: string | null
  status: string
  tags: string[] | null
  speaker: string
  meta_title: string | null
  meta_description: string | null
  canonical_url: string | null
  og_image_alt: string | null
  cover_image_alt: string | null
  noindex: boolean
  updated_at: string
}

const postSelect =
  'id, kind, slug, title, excerpt, body_html, cover_image_url, published_at, status, tags, speaker, meta_title, meta_description, canonical_url, og_image_alt, cover_image_alt, noindex, updated_at'

function mapPost(row: PostRow): BlogPostDto {
  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    excerpt: row.excerpt || excerptFromHtml(row.body_html),
    category: row.kind as PostKind,
    coverImageUrl: sanitizeCmsImageUrl(row.cover_image_url),
    publishedAt: row.published_at,
    status: row.status === 'published' ? 'published' : 'draft',
    readMinutes: estimateReadMinutes(row.body_html),
    tags: row.tags ?? [],
    authorName: row.speaker?.trim() || 'Editorial',
  }
}

function publicPostsOrFilter(now: Date) {
  const iso = now.toISOString()
  return `status.eq.published,and(status.eq.scheduled,published_at.lte.${iso})`
}

function applyVisibility<
  T extends { or: (f: string) => T; neq: (c: string, v: string) => T },
>(query: T, includeDrafts: boolean) {
  if (!includeDrafts) {
    return query.or(publicPostsOrFilter(new Date()))
  }
  return query.neq('status', 'trash')
}

async function resolveBlogReadContext(draftPreview: boolean | undefined) {
  if (draftPreview !== true) {
    return {
      includeDrafts: false,
      canPreviewDrafts: false,
      supabase: createSupabaseAnonReadClient(),
    }
  }
  const canPreviewDrafts = await staffCanPreviewDrafts()
  const includeDrafts = resolveIncludeDrafts({
    canPreviewDrafts,
    draftPreview: true,
  })
  return {
    includeDrafts,
    canPreviewDrafts,
    supabase: includeDrafts
      ? createSupabaseServerClient()
      : createSupabaseAnonReadClient(),
  }
}

export const getBlogPreviewAccessFn = createServerFn({ method: 'GET' }).handler(
  async () => ({ canPreviewDrafts: await staffCanPreviewDrafts() }),
)

export const listBlogPostsFn = createServerFn({ method: 'GET' })
  .validator((input: unknown) => blogListSearchSchema.parse(input ?? {}))
  .handler(async ({ data }) => {
    const { includeDrafts, canPreviewDrafts, supabase } =
      await resolveBlogReadContext(data.draftPreview)
    if (includeDrafts) {
      const { setResponseHeader } = await import('@tanstack/react-start/server')
      setResponseHeader('cache-control', 'private, no-store')
    }

    let countQuery = supabase
      .from('posts')
      .select('id', { count: 'exact', head: true })
    countQuery = applyVisibility(countQuery, includeDrafts)
    if (data.category) {
      countQuery = countQuery.eq('kind', data.category)
    }
    if (data.tag) {
      countQuery = countQuery.contains('tags', [data.tag])
    }
    if (data.q?.trim()) {
      const pattern = `%${data.q.trim().replace(/[%_]/g, '')}%`
      countQuery = countQuery.or(
        `title.ilike.${pattern},excerpt.ilike.${pattern}`,
      )
    }

    const { count, error: countError } = await countQuery
    if (countError) {
      console.error(countError)
      throw new Error('Unable to load posts')
    }

    const total = count ?? 0
    const plan = planBlogListRange(total, data.page)
    if (plan.rangeEnd === null) {
      return {
        featured: null,
        items: [],
        page: data.page,
        pageCount: plan.pageCount,
        includeDrafts,
        canPreviewDrafts,
      } satisfies BlogListResult
    }

    let rowsQuery = supabase
      .from('posts')
      .select(postSelect)
      .order(includeDrafts ? 'updated_at' : 'published_at', {
        ascending: false,
        nullsFirst: false,
      })
    rowsQuery = applyVisibility(rowsQuery, includeDrafts)
    if (data.category) {
      rowsQuery = rowsQuery.eq('kind', data.category)
    }
    if (data.tag) {
      rowsQuery = rowsQuery.contains('tags', [data.tag])
    }
    if (data.q?.trim()) {
      const pattern = `%${data.q.trim().replace(/[%_]/g, '')}%`
      rowsQuery = rowsQuery.or(
        `title.ilike.${pattern},excerpt.ilike.${pattern}`,
      )
    }

    const { data: rows, error } = await rowsQuery.range(
      plan.rangeStart,
      plan.rangeEnd,
    )
    if (error) {
      console.error(error)
      throw new Error('Unable to load posts')
    }

    const mapped = (rows ?? []).map((row) => mapPost(row as PostRow))
    const featured = plan.featuredOnPage ? (mapped[0] ?? null) : null
    const items = plan.featuredOnPage ? mapped.slice(1) : mapped

    return {
      featured,
      items,
      page: data.page,
      pageCount: plan.pageCount,
      includeDrafts,
      canPreviewDrafts,
    } satisfies BlogListResult
  })

export const getBlogCategoryCountsFn = createServerFn({ method: 'GET' })
  .validator((input: unknown) =>
    blogListSearchSchema.pick({ draftPreview: true }).parse(input ?? {}),
  )
  .handler(async ({ data }) => {
    const { includeDrafts, supabase } = await resolveBlogReadContext(
      data.draftPreview,
    )
    let query = supabase.from('posts').select('kind')
    query = applyVisibility(query, includeDrafts)
    const { data: rows, error } = await query
    if (error) {
      console.error(error)
      throw new Error('Unable to load categories')
    }
    const counts: Record<PostKind, number> = {
      article: 0,
      project: 0,
      learning: 0,
      update: 0,
    }
    for (const row of rows ?? []) {
      const kind = row.kind as PostKind
      if (kind in counts) counts[kind] += 1
    }
    return {
      total: Object.values(counts).reduce((a, b) => a + b, 0),
      counts,
    }
  })

const blogPostSlugSchema = z.object({
  slug: z
    .string()
    .min(1)
    .max(120)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
  draftPreview: draftPreviewSearchSchema,
})

export const getBlogPostBySlugFn = createServerFn({ method: 'GET' })
  .validator((input: unknown) => blogPostSlugSchema.parse(input ?? {}))
  .handler(async ({ data }) => {
    const { includeDrafts, canPreviewDrafts, supabase } =
      await resolveBlogReadContext(data.draftPreview)
    if (includeDrafts) {
      const { setResponseHeader } = await import('@tanstack/react-start/server')
      setResponseHeader('cache-control', 'private, no-store')
    }

    let postQuery = supabase
      .from('posts')
      .select(postSelect)
      .eq('slug', data.slug)
    postQuery = applyVisibility(postQuery, includeDrafts)

    const { data: row, error } = await postQuery.maybeSingle()
    if (error) {
      console.error(error)
      throw new Error('Unable to load post')
    }
    if (!row) {
      setResponseStatus(404)
      return null
    }
    if (
      !includeDrafts &&
      !isPostPubliclyVisible({
        status: row.status,
        publishedAt: row.published_at,
        now: new Date(),
      })
    ) {
      setResponseStatus(404)
      return null
    }

    const post = mapPost(row as PostRow)
    return {
      post: {
        ...post,
        bodyHtml: row.body_html,
        speaker: row.speaker,
        metaTitle: row.meta_title,
        metaDescription: row.meta_description,
        canonicalUrl: sanitizeCanonicalUrl(row.canonical_url),
        ogImageUrl: sanitizeCmsImageUrl(row.cover_image_url),
        ogImageAlt: row.og_image_alt,
        coverImageAlt: row.cover_image_alt,
        noindex: row.noindex || isStarterDemoPostSlug(row.slug),
        updatedAt: row.updated_at,
      },
      previous: null,
      next: null,
      related: [],
      includeDrafts,
      canPreviewDrafts,
    } satisfies BlogPostPageResult
  })
