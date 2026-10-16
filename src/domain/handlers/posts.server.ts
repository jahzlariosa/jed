import '@tanstack/react-start/server-only'

import { assertDomainAdmin } from '#/domain/helpers/admin-domain.server'
import { escapeLike } from '#/auth/validators'
import {
  postsListMonthRange,
  postsListSearchTerm,
} from '#/lib/cms/admin-posts-list'
import type { adminPostsListQuerySchema } from '#/lib/cms/schemas'
import type { DomainContext } from '#/domain/types'
import { z } from 'zod'

const postIdSchema = z.object({ postId: z.string().uuid() })

export async function listAdminPostsDomain(
  ctx: DomainContext,
  input: z.infer<typeof adminPostsListQuerySchema>,
) {
  assertDomainAdmin(ctx)
  const supabase = ctx.supabase
  const data = input
  const from = (data.page - 1) * data.pageSize
  const to = from + data.pageSize - 1

  let query = supabase
    .from('posts')
    .select(
      'id, kind, slug, title, status, published_at, updated_at, excerpt',
      { count: 'exact' },
    )
    .neq('status', 'trash')

  if (data.status !== 'all') {
    query = query.eq('status', data.status)
  }
  if (data.kind) {
    query = query.eq('kind', data.kind)
  }
  const search = postsListSearchTerm(data.q)
  if (search) {
    query = query.or(
      `title.ilike.%${escapeLike(search)}%,slug.ilike.%${escapeLike(search)}%`,
    )
  }
  if (data.month) {
    const monthRange = postsListMonthRange(data.month)
    if (monthRange) {
      query = query
        .gte('published_at', monthRange.start)
        .lt('published_at', monthRange.end)
    }
  }

  const {
    data: rows,
    error,
    count,
  } = await query.order('updated_at', { ascending: false }).range(from, to)

  if (error) {
    console.error(error)
    throw new Error('Unable to load posts')
  }

  return {
    items: rows ?? [],
    total: count ?? 0,
    page: data.page,
    pageSize: data.pageSize,
  }
}

export async function getAdminPostDomain(
  ctx: DomainContext,
  input: z.infer<typeof postIdSchema>,
) {
  assertDomainAdmin(ctx)
  const supabase = ctx.supabase
  const { data: row, error } = await supabase
    .from('posts')
    .select(
      'id, kind, slug, title, speaker, excerpt, body_html, body_blocks, video_url, cover_image_url, tags, published_at, status, featured_media_id, meta_title, meta_description',
    )
    .eq('id', input.postId)
    .maybeSingle()
  if (error) {
    console.error(error)
    throw new Error('Unable to load post')
  }
  if (!row) {
    throw new Error('Post not found')
  }
  return row
}
