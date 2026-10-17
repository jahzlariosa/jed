import { z } from 'zod'

import { draftPreviewSearchSchema } from '#/lib/cms/blog'

export type CmsPageDto = {
  id: string
  slug: string
  title: string
  bodyHtml: string
  status: string
  publishedAt: string | null
  metaTitle: string | null
  metaDescription: string | null
  canonicalUrl: string | null
  noindex: boolean
  showInNav: boolean
}

export type CmsPageResult = {
  page: CmsPageDto
  includeDrafts: boolean
  canPreviewDrafts: boolean
}

export const cmsPageSearchSchema = z.object({
  draftPreview: draftPreviewSearchSchema,
})

export type CmsPageSearch = z.infer<typeof cmsPageSearchSchema>

export const RESERVED_CMS_PAGE_SLUGS = new Set([
  'admin',
  'auth',
  'blog',
  'account',
  'forgot-password',
  'login',
  'reset-password',
  'signup',
  'sitemap.xml',
  'update-password',
  'admin-panel',
  'roles',
  'setup',
])

export function isReservedCmsPageSlug(slug: string): boolean {
  return RESERVED_CMS_PAGE_SLUGS.has(slug)
}

export function publicCmsPagePath(slug: string): string {
  return `/${slug}`
}

export function isCmsPagePubliclyVisible(input: {
  status: string
  publishedAt: string | null
  scheduledAt: string | null
  now: Date
}): boolean {
  if (input.status === 'published') {
    return true
  }
  if (input.status === 'scheduled') {
    const at = input.scheduledAt ?? input.publishedAt
    if (!at) {
      return false
    }
    return new Date(at).getTime() <= input.now.getTime()
  }
  return false
}
