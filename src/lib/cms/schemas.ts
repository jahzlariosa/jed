import { z } from 'zod'

import { blockNoteDocumentSchema } from '#/lib/cms/blocknote-types'
import {
  CANONICAL_URL_SAVE_ERROR,
  COVER_IMAGE_URL_SAVE_ERROR,
  isAllowedHttpsUrl,
  parseCmsImageUrlForSave,
} from '#/lib/url-security'

export const postKindSchema = z.enum([
  'article',
  'project',
  'learning',
  'update',
])
export type PostKind = z.infer<typeof postKindSchema>

export const postStatusSchema = z.enum([
  'draft',
  'published',
  'scheduled',
  'trash',
])
export type PostStatus = z.infer<typeof postStatusSchema>

export const postListStatusFilterSchema = z.enum([
  'all',
  'published',
  'draft',
  'scheduled',
  'trash',
])

export const postPublishIntentSchema = z.enum([
  'save_draft',
  'publish',
  'update',
])
export type PostPublishIntent = z.infer<typeof postPublishIntentSchema>

export const adminListViewSchema = z.enum(['table', 'grid']).default('table')

export const adminPostsListQuerySchema = z.object({
  status: postListStatusFilterSchema.default('all'),
  q: z.string().max(120).optional(),
  kind: postKindSchema.optional(),
  month: z
    .string()
    .regex(/^\d{4}-\d{2}$/)
    .optional(),
  view: adminListViewSchema.optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(5).max(50).default(20),
})

export type AdminPostsListQuery = z.infer<typeof adminPostsListQuerySchema>

export const bulkPostsActionSchema = z.object({
  ids: z.array(z.string().uuid()).min(1).max(50),
  action: z.enum(['publish', 'draft', 'trash']),
})

export const postInputSchema = z.object({
  id: z.string().uuid().optional(),
  kind: postKindSchema,
  slug: z.string().max(120).default(''),
  title: z.string().min(1).max(200),
  speaker: z.string().max(200).default(''),
  excerpt: z.string().max(500).default(''),
  bodyHtml: z.string().max(200_000).default(''),
  bodyBlocks: blockNoteDocumentSchema.default([]),
  videoUrl: z.string().url().max(2000).nullable().optional(),
  coverImageUrl: z
    .string()
    .max(2000)
    .nullable()
    .optional()
    .transform((value) =>
      parseCmsImageUrlForSave(value, COVER_IMAGE_URL_SAVE_ERROR),
    ),
  tags: z.array(z.string().min(1).max(40)).max(12).default([]),
  publishedAt: z.string().datetime({ offset: true }).nullable().optional(),
  status: postStatusSchema,
  publishIntent: postPublishIntentSchema.optional(),
  featuredMediaId: z.string().uuid().nullable().optional(),
  metaTitle: z.string().max(200).nullable().optional(),
  metaDescription: z.string().max(500).nullable().optional(),
  canonicalUrl: z
    .string()
    .max(512)
    .nullable()
    .optional()
    .transform((value) => {
      if (value === null || value === undefined) {
        return null
      }
      const trimmed = value.trim()
      if (!trimmed) {
        return null
      }
      if (!isAllowedHttpsUrl(trimmed)) {
        throw new Error(CANONICAL_URL_SAVE_ERROR)
      }
      return trimmed
    }),
  ogImageAlt: z.string().max(200).nullable().optional(),
  coverImageAlt: z.string().max(200).nullable().optional(),
  noindex: z.boolean().optional(),
  sitemapExclude: z.boolean().optional(),
  createSlugRedirect: z.boolean().optional(),
})

export type PostInput = z.infer<typeof postInputSchema>
