import type { PostStatus } from '#/lib/cms/schemas'

export function resolvePostStatusOnSave(input: {
  publishIntent?: 'save_draft' | 'publish' | 'update'
  status: PostStatus
  publishedAt: string | null | undefined
  now: Date
}): { status: PostStatus; publishedAt: string | null } {
  const { publishIntent, now } = input
  let publishedAt = input.publishedAt ?? null

  if (publishIntent === 'save_draft') {
    return { status: 'draft', publishedAt }
  }

  if (input.status === 'trash') {
    return { status: 'trash', publishedAt }
  }

  const schedule =
    publishedAt !== null && new Date(publishedAt).getTime() > now.getTime()

  if (schedule) {
    return { status: 'scheduled', publishedAt }
  }

  if (publishIntent === 'publish' || publishIntent === 'update') {
    if (!publishedAt) {
      publishedAt = now.toISOString()
    }
    return { status: 'published', publishedAt }
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
