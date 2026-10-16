import '@tanstack/react-start/server-only'

import { escapeLike } from '#/auth/validators'
import { PERMISSIONS } from '#/auth/permissions'
import { requireCmsAccess } from '#/auth/admin-access.server'
import {
  parseContentId,
  type parseContentListQuery,
} from '#/lib/cms/validators'
import type { DomainContext } from '#/domain/types'

export async function listContentDomain(
  ctx: DomainContext,
  input: ReturnType<typeof parseContentListQuery>,
) {
  await requireCmsAccess(PERMISSIONS.contentRead)
  const supabase = ctx.supabase
  const query = input
  const from = (query.page - 1) * query.pageSize
  const to = from + query.pageSize - 1

  let builder = supabase
    .from('content_entries')
    .select('id, title, slug, kind, status, updated_at', { count: 'exact' })

  if (query.kind) {
    builder = builder.eq('kind', query.kind)
  }
  if (query.status === 'pages') {
    builder = builder.eq('kind', 'page')
  } else if (query.status === 'posts') {
    builder = builder.eq('kind', 'post')
  } else if (
    query.status === 'draft' ||
    query.status === 'published' ||
    query.status === 'scheduled'
  ) {
    builder = builder.eq('status', query.status)
  }
  if (query.q) {
    builder = builder.or(
      `title.ilike.%${escapeLike(query.q)}%,slug.ilike.%${escapeLike(query.q)}%`,
    )
  }

  const listResult = await builder
    .order('updated_at', { ascending: false })
    .range(from, to)

  if (listResult.error) {
    console.error(listResult.error)
    throw new Error('Unable to load content')
  }

  return {
    items: listResult.data ?? [],
    total: listResult.count ?? 0,
    page: query.page,
    pageSize: query.pageSize,
  }
}

export async function getContentDomain(
  ctx: DomainContext,
  input: { id: string },
) {
  await requireCmsAccess(PERMISSIONS.contentRead)
  const id = parseContentId(input.id)
  if (id === 'new') {
    return {
      id: 'new',
      kind: 'page' as const,
      title: '',
      slug: '',
      status: 'draft' as const,
      body: [],
      show_in_nav: false,
      published_at: null,
      scheduled_at: null,
      tags: [] as string[],
      featured_media_id: null,
      meta_title: null,
      meta_description: null,
    }
  }
  const { data: row, error } = await ctx.supabase
    .from('content_entries')
    .select(
      'id, kind, title, slug, status, body, show_in_nav, published_at, scheduled_at, tags, featured_media_id, meta_title, meta_description',
    )
    .eq('id', id)
    .maybeSingle()
  if (error) {
    console.error(error)
    throw new Error('Unable to load content')
  }
  if (!row) {
    throw new Error('Content not found')
  }
  return row
}
