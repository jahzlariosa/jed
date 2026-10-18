import '@tanstack/react-start/server-only'

import type { z } from 'zod'

import { assertDomainAdmin } from '#/domain/helpers/admin-domain.server'
import type { postInputSchema } from '#/domain/api-schemas'
import type { DomainContext } from '#/domain/types'
import { persistBodyFromClient } from '#/lib/cms/blocknote-body.server'
import { blocksToJson } from '#/lib/cms/blocknote-types'
import { expireContentCacheTags } from '#/lib/api-runtime-cache.server'
import { clearPublicCache } from '#/lib/public-cache.server'
import { clientPostSaveError } from '#/lib/cms/post-save-errors'
import { insertAdminPost, newAdminPostId } from '#/lib/cms/posts-admin-save'
import { resolvePostSlug } from '#/lib/cms/post-slug'
import { ensureUniquePostSlug } from '#/lib/cms/slug-uniqueness.server'
import { resolvePostStatusOnSave } from '#/lib/cms/post-publish'

async function recordPostActivity(
  supabase: DomainContext['supabase'],
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

export async function saveAdminPostDomain(
  ctx: DomainContext,
  input: z.infer<typeof postInputSchema>,
) {
  assertDomainAdmin(ctx)
  if (!ctx.user) {
    throw new Error('Unauthorized')
  }
  const supabase = ctx.supabase
  const user = ctx.user

  if (input.status === 'trash') {
    throw new Error('Invalid status')
  }

  let baseSlug: string
  try {
    baseSlug = resolvePostSlug(input.slug, input.title)
  } catch {
    throw new Error(
      'Add a title or slug using lowercase letters, numbers, and hyphens.',
    )
  }
  let resolvedSlug: string
  try {
    resolvedSlug = await ensureUniquePostSlug(supabase, baseSlug, input.id)
  } catch (error) {
    console.error(error)
    throw new Error('Unable to allocate a unique slug')
  }
  const { body_blocks, body_html } = persistBodyFromClient(
    input.bodyBlocks,
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
    updated_at: new Date().toISOString(),
  }

  if (input.id) {
    const { data: row, error } = await supabase
      .from('posts')
      .update(payload)
      .eq('id', input.id)
      .select('id, slug')
      .maybeSingle()
    if (error) {
      const message = clientPostSaveError('update', error)
      throw new Error(message)
    }
    await recordPostActivity(
      supabase,
      user.id,
      'post.update',
      `Updated post "${input.title}"`,
      row?.id ?? input.id,
    )
    clearPublicCache('public')
    await expireContentCacheTags(row?.id ?? input.id)
    return { id: row?.id ?? input.id, slug: row?.slug ?? payload.slug }
  }

  const newId = newAdminPostId()
  const inserted = await insertAdminPost(
    supabase,
    { ...payload, author_id: user.id },
    newId,
  )
  if ('error' in inserted) {
    const message = clientPostSaveError('insert', inserted.error)
    throw new Error(message)
  }
  await recordPostActivity(
    supabase,
    user.id,
    'post.create',
    `Created post "${input.title}"`,
    inserted.id,
  )
  clearPublicCache('public')
  await expireContentCacheTags(inserted.id)
  return inserted
}
