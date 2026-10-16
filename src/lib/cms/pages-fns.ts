import { createServerFn } from '@tanstack/react-start'
import { setResponseStatus } from '@tanstack/react-start/server'
import { z } from 'zod'

import { createSupabaseServerClient } from '#/lib/supabase/server'
import { resolveIncludeDrafts } from '#/lib/cms/blog'
import { blocksToHtmlServer } from '#/lib/cms/blocks-to-html.server'
import {
  type CmsPageDto,
  type CmsPageResult,
  cmsPageSearchSchema,
  isCmsPagePubliclyVisible,
  isReservedCmsPageSlug,
} from '#/lib/cms/pages'
import { staffCanPreviewDrafts } from '#/lib/cms/preview-access.server'
import { sanitizeCanonicalUrl } from '#/lib/url-security'

type ContentRow = {
  id: string
  slug: string
  title: string
  status: string
  body: unknown
  published_at: string | null
  scheduled_at: string | null
  meta_title: string | null
  meta_description: string | null
  canonical_url: string | null
  noindex: boolean
  show_in_nav: boolean
}

const pageSelect =
  'id, slug, title, status, body, published_at, scheduled_at, meta_title, meta_description, canonical_url, noindex, show_in_nav'

function mapPage(row: ContentRow, bodyHtml: string): CmsPageDto {
  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    bodyHtml,
    status: row.status,
    publishedAt: row.published_at,
    metaTitle: row.meta_title,
    metaDescription: row.meta_description,
    canonicalUrl: sanitizeCanonicalUrl(row.canonical_url),
    noindex: row.noindex,
    showInNav: row.show_in_nav,
  }
}

function publicPagesOrFilter(now: Date) {
  const iso = now.toISOString()
  return `status.eq.published,and(status.eq.scheduled,scheduled_at.lte.${iso})`
}

const pageSlugSchema = z.object({
  slug: z
    .string()
    .min(1)
    .max(120)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
  draftPreview: cmsPageSearchSchema.shape.draftPreview,
})

export const getCmsPageBySlugFn = createServerFn({ method: 'GET' })
  .validator((input: unknown) => pageSlugSchema.parse(input ?? {}))
  .handler(async ({ data }) => {
    if (isReservedCmsPageSlug(data.slug)) {
      setResponseStatus(404)
      return null
    }

    const canPreviewDrafts = await staffCanPreviewDrafts()
    const includeDrafts = resolveIncludeDrafts({
      canPreviewDrafts,
      draftPreview: data.draftPreview,
    })
    if (includeDrafts) {
      const { setResponseHeader } = await import('@tanstack/react-start/server')
      setResponseHeader('cache-control', 'private, no-store')
    }

    const supabase = createSupabaseServerClient()
    let query = supabase
      .from('content_entries')
      .select(pageSelect)
      .eq('kind', 'page')
      .eq('slug', data.slug)

    if (!includeDrafts) {
      query = query.or(publicPagesOrFilter(new Date()))
    }

    const { data: row, error } = await query.maybeSingle()
    if (error) {
      console.error(error)
      throw new Error('Unable to load page')
    }
    if (!row) {
      setResponseStatus(404)
      return null
    }

    const now = new Date()
    if (
      !includeDrafts &&
      !isCmsPagePubliclyVisible({
        status: row.status,
        publishedAt: row.published_at,
        scheduledAt: row.scheduled_at,
        now,
      })
    ) {
      setResponseStatus(404)
      return null
    }

    const bodyHtml = blocksToHtmlServer(row.body)
    return {
      page: mapPage(row as ContentRow, bodyHtml),
      includeDrafts,
      canPreviewDrafts,
    } satisfies CmsPageResult
  })

export const listPublishedCmsPagesForSitemapFn = createServerFn({
  method: 'GET',
}).handler(async () => {
  const supabase = createSupabaseServerClient()
  const now = new Date().toISOString()
  const { data: rows, error } = await supabase
    .from('content_entries')
    .select('slug, updated_at, published_at')
    .eq('kind', 'page')
    .or(`status.eq.published,and(status.eq.scheduled,scheduled_at.lte.${now})`)
    .order('updated_at', { ascending: false })

  if (error) {
    console.error(error)
    return []
  }

  return (rows ?? []).filter((row) => !isReservedCmsPageSlug(row.slug))
})
