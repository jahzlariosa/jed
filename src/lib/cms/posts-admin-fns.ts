import { createServerFn } from '@tanstack/react-start'
import { z } from 'zod'

import { requireAdminRead, requireAdminWrite } from '#/auth/admin-access.server'
import { invalidatePublishedContentCache } from '#/lib/api-runtime-cache.server'
import { clearPublicCache } from '#/lib/public-cache.server'

import {
  postsListMonthRange,
  postsListSearchTerm,
  sumPostsAllTabCount,
} from './admin-posts-list'
import { persistBodyFromClient } from './blocknote-body.server'
import { blocksToJson } from './blocknote-types'
import { clientPostSaveError } from './post-save-errors'
import { clearRedirectCache } from '#/lib/seo/redirect-cache.server'
import { insertAdminPost, newAdminPostId } from './posts-admin-save'
import { resolvePostSlug } from './post-slug'
import { ensureUniquePostSlug } from '#/lib/cms/slug-uniqueness.server'
import { resolvePostStatusOnSave } from './post-publish'
import {
  adminPostsListQuerySchema,
  bulkPostsActionSchema,
  postInputSchema,
} from './schemas'
import { sanitizeCanonicalUrl, sanitizeCmsImageUrl } from '#/lib/url-security'

async function markPrivateNoStore() {
  const { setResponseHeader } = await import('@tanstack/react-start/server')
  setResponseHeader('cache-control', 'private, no-store')
}

async function countPostsByStatus(
  supabase: Awaited<ReturnType<typeof requireAdminRead>>['supabase'],
  status: string,
) {
  const { count, error } = await supabase
    .from('posts')
    .select('id', { count: 'exact', head: true })
    .eq('status', status)
  if (error) {
    console.error('countPostsByStatus failed', error.message)
    return 0
  }
  return count ?? 0
}

async function recordPostActivity(
  supabase: Awaited<ReturnType<typeof requireAdminRead>>['supabase'],
  actorId: string,
  action: string,
  summary: string,
  entityId: string | null,
) {
  const { error } = await supabase.from('content_activity').insert({
    actor_id: actorId,
    action,
    summary,
    entity_type: 'post',
    entity_id: entityId,
  })
  if (error) {
    console.error('recordPostActivity failed', error.message)
  }
}

export const listAdminPostsFn = createServerFn({ method: 'GET' })
  .validator((input: unknown) => adminPostsListQuerySchema.parse(input ?? {}))
  .handler(async ({ data }) => {
    await markPrivateNoStore()
    const { supabase } = await requireAdminRead()

    const [published, draft, scheduled, trash] = await Promise.all([
      countPostsByStatus(supabase, 'published'),
      countPostsByStatus(supabase, 'draft'),
      countPostsByStatus(supabase, 'scheduled'),
      countPostsByStatus(supabase, 'trash'),
    ])
    const counts = {
      all: sumPostsAllTabCount({ published, draft, scheduled }),
      published,
      draft,
      scheduled,
      trash,
    }

    const from = (data.page - 1) * data.pageSize
    const to = from + data.pageSize - 1

    let query = supabase
      .from('posts')
      .select(
        'id, kind, slug, title, status, speaker, published_at, updated_at, cover_image_url, tags, excerpt',
        { count: 'exact' },
      )
      .order('updated_at', { ascending: false })
      .range(from, to)

    if (data.status === 'trash') {
      query = query.eq('status', 'trash')
    } else if (data.status === 'all') {
      query = query.neq('status', 'trash')
    } else {
      query = query.eq('status', data.status)
    }

    if (data.kind) {
      query = query.eq('kind', data.kind)
    }

    const term = postsListSearchTerm(data.q)
    if (term) {
      query = query.or(`title.ilike.${term},excerpt.ilike.${term}`)
    }

    if (data.month) {
      const { start, end } = postsListMonthRange(data.month)
      query = query.gte('updated_at', start).lt('updated_at', end)
    }

    const { data: rows, error, count } = await query

    if (error) {
      console.error('listAdminPostsFn failed', error.message)
      throw new Error('Unable to load posts')
    }

    const total = count ?? 0
    const pageCount = Math.max(1, Math.ceil(total / data.pageSize))

    return {
      items: rows ?? [],
      page: data.page,
      pageSize: data.pageSize,
      total,
      pageCount,
      counts,
    }
  })

export const bulkAdminPostsFn = createServerFn({ method: 'POST' })
  .validator((input: unknown) => bulkPostsActionSchema.parse(input))
  .handler(async ({ data }) => {
    await markPrivateNoStore()
    const { supabase } = await requireAdminWrite()
    const now = new Date().toISOString()

    const nextStatus =
      data.action === 'publish'
        ? 'published'
        : data.action === 'draft'
          ? 'draft'
          : 'trash'

    const { error } = await supabase
      .from('posts')
      .update({
        status: nextStatus,
        updated_at: now,
        ...(data.action === 'publish' ? { published_at: now } : {}),
      })
      .in('id', data.ids)

    if (error) {
      console.error('bulkAdminPostsFn failed', error.message)
      return { error: 'Unable to update posts' }
    }

    clearPublicCache('public')
    for (const id of data.ids) {
      await invalidatePublishedContentCache(id)
    }
    return { ok: true as const, updated: data.ids.length }
  })

export const getAdminPostFn = createServerFn({ method: 'GET' })
  .validator(z.object({ id: z.string().uuid() }))
  .handler(async ({ data }) => {
    await markPrivateNoStore()
    const { supabase } = await requireAdminRead()
    const { data: row, error } = await supabase
      .from('posts')
      .select('*')
      .eq('id', data.id)
      .maybeSingle()
    if (error || !row) {
      console.error('getAdminPostFn failed', error?.message)
      throw new Error('Post not found')
    }
    return {
      ...row,
      canonical_url: sanitizeCanonicalUrl(row.canonical_url),
      cover_image_url: sanitizeCmsImageUrl(row.cover_image_url),
    }
  })

export const saveAdminPostFn = createServerFn({ method: 'POST' })
  .validator((input: unknown) => postInputSchema.parse(input))
  .handler(async ({ data: input }) => {
    await markPrivateNoStore()
    const { supabase, user } = await requireAdminWrite()
    let baseSlug: string
    try {
      baseSlug = resolvePostSlug(input.slug, input.title)
    } catch {
      return {
        error:
          'Add a title or slug using lowercase letters, numbers, and hyphens.',
      }
    }
    let resolvedSlug: string
    try {
      resolvedSlug = await ensureUniquePostSlug(supabase, baseSlug, input.id)
    } catch (error) {
      console.error(error)
      return { error: 'Unable to allocate a unique slug' }
    }
    const { body_blocks, body_html } = persistBodyFromClient(
      input.bodyBlocks as import('#/lib/cms/blocknote-types').BlockNoteDocument,
      input.bodyHtml,
    )
    let existingPublishedAt: string | null = null
    if (input.id) {
      const { data: existing } = await supabase
        .from('posts')
        .select('published_at')
        .eq('id', input.id)
        .maybeSingle()
      existingPublishedAt = existing?.published_at ?? null
    }
    const { status, publishedAt } = resolvePostStatusOnSave({
      publishIntent: input.publishIntent,
      status: input.status,
      publishedAt: input.publishedAt,
      existingPublishedAt,
      now: new Date(),
    })
    const payload = {
      kind: input.kind,
      slug: resolvedSlug,
      title: input.title,
      speaker: input.speaker,
      excerpt: input.excerpt,
      body_html,
      body_blocks: blocksToJson(body_blocks),
      video_url: input.videoUrl ?? null,
      cover_image_url: input.coverImageUrl ?? null,
      tags: input.tags,
      published_at: publishedAt,
      status,
      featured_media_id: input.featuredMediaId ?? null,
      meta_title: input.metaTitle ?? null,
      meta_description: input.metaDescription ?? null,
      canonical_url: input.canonicalUrl ?? null,
      og_image_alt: input.ogImageAlt ?? null,
      cover_image_alt: input.coverImageAlt ?? null,
      noindex: input.noindex === true,
      sitemap_exclude: input.sitemapExclude === true,
      updated_at: new Date().toISOString(),
    }

    if (input.id) {
      const { data: previous } = await supabase
        .from('posts')
        .select('slug, status')
        .eq('id', input.id)
        .maybeSingle()
      const { data: row, error } = await supabase
        .from('posts')
        .update(payload)
        .eq('id', input.id)
        .select('id, slug')
        .maybeSingle()
      if (error) {
        return { error: clientPostSaveError('update', error) }
      }
      if (
        input.createSlugRedirect &&
        previous &&
        previous.slug !== resolvedSlug &&
        previous.status === 'published' &&
        status === 'published'
      ) {
        await supabase.from('url_redirects').upsert(
          {
            from_path: `/blog/${previous.slug}`,
            to_path: `/blog/${resolvedSlug}`,
            status_code: 301,
            enabled: true,
            is_external: false,
            updated_at: new Date().toISOString(),
          },
          { onConflict: 'from_path' },
        )
        clearRedirectCache()
      }
      await recordPostActivity(
        supabase,
        user.id,
        'post.update',
        `Updated post "${input.title}"`,
        row?.id ?? input.id,
      )
      clearPublicCache('public')
      await invalidatePublishedContentCache(row?.id ?? input.id)
      return { id: row?.id ?? input.id, slug: row?.slug ?? payload.slug }
    }

    const newId = newAdminPostId()
    const inserted = await insertAdminPost(
      supabase,
      { ...payload, author_id: user.id },
      newId,
    )
    if ('error' in inserted) {
      return { error: clientPostSaveError('insert', inserted.error) }
    }
    await recordPostActivity(
      supabase,
      user.id,
      'post.create',
      `Created post "${input.title}"`,
      inserted.id,
    )
    clearPublicCache('public')
    await invalidatePublishedContentCache(inserted.id)
    return inserted
  })

export const deleteAdminPostFn = createServerFn({ method: 'POST' })
  .validator(z.object({ id: z.string().uuid() }))
  .handler(async ({ data }) => {
    await markPrivateNoStore()
    const { supabase, user } = await requireAdminWrite()
    const { error } = await supabase.from('posts').delete().eq('id', data.id)
    if (error) {
      console.error('deleteAdminPostFn failed', error.message)
      return { error: 'Unable to delete post' }
    }
    await recordPostActivity(
      supabase,
      user.id,
      'post.delete',
      'Deleted a post',
      data.id,
    )
    clearPublicCache('public')
    await invalidatePublishedContentCache(data.id)
    return { ok: true as const }
  })
