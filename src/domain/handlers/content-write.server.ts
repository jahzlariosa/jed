import '@tanstack/react-start/server-only'

import { PERMISSIONS } from '#/auth/permissions'
import { requireCmsWrite } from '#/auth/admin-access.server'
import type { z } from 'zod'
import type { contentSaveBodySchema } from '#/domain/api-schemas'
import type { DomainContext } from '#/domain/types'
import { expireContentCacheTags } from '#/lib/api-runtime-cache.server'
import { clearPublicCache } from '#/lib/public-cache.server'
import type { Json } from '#/lib/supabase/database.types'
import {
  parseContentId,
  parseContentKind,
  parseContentStatus,
  parseMetaDescription,
  parseMetaTitle,
  parseSlug,
  parseTags,
  parseTitle,
} from '#/lib/cms/validators'

async function recordContentActivity(
  supabase: DomainContext['supabase'],
  summary: string,
  action: string,
  entityId: string | null,
  actorId: string,
) {
  const { error } = await supabase.from('content_activity').insert({
    actor_id: actorId,
    action,
    summary,
    entity_type: 'content',
    entity_id: entityId,
  })
  if (error) {
    console.error(error)
  }
}

export async function saveContentDomain(
  ctx: DomainContext,
  input: z.infer<typeof contentSaveBodySchema>,
) {
  const { user } = await requireCmsWrite(PERMISSIONS.contentWrite)
  const supabase = ctx.supabase
  const data = {
    id: parseContentId(input.id),
    kind: parseContentKind(input.kind),
    title: parseTitle(input.title),
    slug: parseSlug(input.slug || input.title),
    status: parseContentStatus(input.status),
    body: input.body,
    showInNav: Boolean(input.showInNav),
    publishedAt: input.publishedAt ?? null,
    scheduledAt: input.scheduledAt ?? null,
    tags: parseTags(input.tags ?? []),
    featuredMediaId: input.featuredMediaId ?? null,
    metaTitle: parseMetaTitle(input.metaTitle),
    metaDescription: parseMetaDescription(input.metaDescription),
  }

  const payload = {
    kind: data.kind,
    title: data.title,
    slug: data.slug,
    status: data.status,
    body: data.body as Json,
    show_in_nav: data.showInNav,
    published_at: data.publishedAt,
    scheduled_at: data.scheduledAt,
    tags: data.tags,
    featured_media_id: data.featuredMediaId,
    meta_title: data.metaTitle,
    meta_description: data.metaDescription,
    updated_by: user.id,
    updated_at: new Date().toISOString(),
  }

  if (data.id === 'new') {
    const { data: inserted, error } = await supabase
      .from('content_entries')
      .insert({ ...payload, created_by: user.id })
      .select('id')
      .single()
    if (error) {
      console.error(error)
      throw new Error('Unable to create content')
    }
    clearPublicCache('public')
    await expireContentCacheTags(inserted.id)
    await recordContentActivity(
      supabase,
      `Created ${data.title}`,
      'create',
      inserted.id,
      user.id,
    )
    return { ok: true as const, id: inserted.id }
  }

  const { error } = await supabase
    .from('content_entries')
    .update(payload)
    .eq('id', data.id)
  if (error) {
    console.error(error)
    throw new Error('Unable to save content')
  }
  clearPublicCache('public')
  await expireContentCacheTags(data.id)
  await recordContentActivity(
    supabase,
    `Updated ${data.title}`,
    'update',
    data.id,
    user.id,
  )
  return { ok: true as const, id: data.id }
}
