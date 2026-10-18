import type { PostStatus } from '#/lib/cms/schemas'

export function resolvePostStatusOnSave(input: {
  publishIntent?: 'save_draft' | 'publish' | 'update'
  status: PostStatus
  publishedAt: string | null | undefined
  existingPublishedAt?: string | null
  now: Date
}): { status: PostStatus; publishedAt: string | null } {
  const { publishIntent, now } = input
  const existingPublishedAt = input.existingPublishedAt ?? null
  let publishedAt = input.publishedAt ?? null

  if (publishIntent === 'save_draft') {
    return { status: 'draft', publishedAt }
  }

  if (input.status === 'trash') {
    return { status: 'trash', publishedAt }
  }

  const schedule =
    input.status === 'scheduled' &&
    publishedAt !== null &&
    new Date(publishedAt).getTime() > now.getTime()

  if (schedule) {
    return { status: 'scheduled', publishedAt }
  }

  if (publishIntent === 'publish') {
    if (!existingPublishedAt && !publishedAt) {
      publishedAt = now.toISOString()
    } else if (!publishedAt && existingPublishedAt) {
      publishedAt = existingPublishedAt
    }
    return { status: 'published', publishedAt }
  }

  if (publishIntent === 'update') {
    const nextStatus = input.status
    if (nextStatus === 'draft') {
      return { status: 'draft', publishedAt }
    }
    if (nextStatus === 'scheduled') {
      if (
        publishedAt !== null &&
        new Date(publishedAt).getTime() > now.getTime()
      ) {
        return { status: 'scheduled', publishedAt }
      }
      if (!existingPublishedAt && !publishedAt) {
        publishedAt = now.toISOString()
      } else if (!publishedAt && existingPublishedAt) {
        publishedAt = existingPublishedAt
      }
      return { status: 'published', publishedAt }
    }
    if (nextStatus === 'published') {
      if (!existingPublishedAt && !publishedAt) {
        publishedAt = now.toISOString()
      } else if (!publishedAt && existingPublishedAt) {
        publishedAt = existingPublishedAt
      }
      return { status: 'published', publishedAt }
    }
    return { status: nextStatus, publishedAt }
  }

  return { status: input.status, publishedAt }
}

export function isPostPubliclyVisible(input: {
  status: string
  publishedAt: string | null
  now: Date
}): boolean {
  if (input.status === 'trash' || input.status === 'draft') {
    return false
  }
  if (input.status === 'published') {
    return true
  }
  if (input.status === 'scheduled' && input.publishedAt) {
    return new Date(input.publishedAt).getTime() <= input.now.getTime()
  }
  return false
}
