import { z } from 'zod'

import { type PostKind, postKindSchema } from './schemas'

export type BlogPostDto = {
  id: string
  slug: string
  title: string
  excerpt: string
  category: PostKind
  coverImageUrl: string | null
  publishedAt: string | null
  status: 'draft' | 'published'
  readMinutes: number
  tags: string[]
  authorName: string
}

export type BlogPostDetailDto = BlogPostDto & {
  bodyHtml: string
  speaker: string
  metaTitle: string | null
  metaDescription: string | null
  canonicalUrl: string | null
  ogImageUrl: string | null
  ogImageAlt: string | null
  coverImageAlt: string | null
  noindex: boolean
  updatedAt: string
}

export type BlogListResult = {
  featured: BlogPostDto | null
  items: BlogPostDto[]
  page: number
  pageCount: number
  includeDrafts: boolean
  canPreviewDrafts: boolean
}

export type BlogPostPageResult = {
  post: BlogPostDetailDto
  previous: { slug: string; title: string } | null
  next: { slug: string; title: string } | null
  related: BlogPostDto[]
  includeDrafts: boolean
  canPreviewDrafts: boolean
}

export type BlogCategoryCounts = {
  total: number
  counts: Record<PostKind, number>
}

export const BLOG_GRID_PAGE_SIZE = 9

export const POST_CATEGORY_LABELS: Record<PostKind, string> = {
  article: 'Articles',
  project: 'Projects',
  learning: 'Learning',
  update: 'Updates',
}

export const draftPreviewSearchSchema = z
  .union([
    z.literal('true'),
    z.literal('false'),
    z.literal('1'),
    z.literal('0'),
    z.literal(1),
    z.literal(0),
    z.boolean(),
  ])
  .optional()
  .transform((value) => {
    if (value === undefined) return undefined
    if (value === true || value === 'true' || value === '1' || value === 1)
      return true
    return false
  })

export const blogListSearchSchema = z.object({
  page: z.coerce.number().int().min(1).max(500).default(1),
  q: z.string().max(120).optional(),
  category: postKindSchema.optional(),
  tag: z.string().max(48).optional(),
  draftPreview: draftPreviewSearchSchema,
})

export type BlogListSearch = z.infer<typeof blogListSearchSchema>

const blogRouteSearchSchema = blogListSearchSchema.omit({ page: true }).extend({
  page: z.coerce.number().int().min(1).max(500).optional(),
})

/** Route search: page stays off the URL until the visitor chooses one. */
export function parseBlogRouteSearch(search: Record<string, unknown>) {
  return blogRouteSearchSchema.parse(search)
}

export function resolveIncludeDrafts(input: {
  canPreviewDrafts: boolean
  draftPreview: boolean | undefined
}): boolean {
  if (input.draftPreview !== true) {
    return false
  }
  return input.canPreviewDrafts
}

export function estimateReadMinutes(html: string): number {
  const text = html
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
  const words = text ? text.split(' ').length : 0
  return Math.max(1, Math.ceil(words / 200))
}

export function excerptFromHtml(html: string, max = 120): string {
  const plain = html
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
  if (plain.length <= max) return plain
  return `${plain.slice(0, max - 1).trimEnd()}…`
}

export function formatPostDate(iso: string | null): string {
  if (!iso) return 'Draft'
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(new Date(iso))
}

export function planBlogListRange(
  total: number,
  page: number,
  pageSize: number = BLOG_GRID_PAGE_SIZE,
) {
  if (total <= 0) {
    return {
      rangeStart: 0,
      rangeEnd: null,
      pageCount: 1,
      featuredOnPage: false,
    }
  }

  const gridTotal = Math.max(0, total - 1)
  const pageCount = Math.max(1, Math.ceil(gridTotal / pageSize))

  if (page === 1) {
    return {
      rangeStart: 0,
      rangeEnd: Math.min(pageSize, total - 1),
      pageCount,
      featuredOnPage: true,
    }
  }

  const gridStart = (page - 1) * pageSize + 1
  if (gridStart >= total) {
    return {
      rangeStart: gridStart,
      rangeEnd: null,
      pageCount,
      featuredOnPage: false,
    }
  }

  return {
    rangeStart: gridStart,
    rangeEnd: Math.min(gridStart + pageSize - 1, total - 1),
    pageCount,
    featuredOnPage: false,
  }
}
