import { z } from 'zod'

import { parseAuditDirectoryQuery } from '#/lib/admin/audit-directory-query'
import { parseUsersDirectoryQuery } from '#/auth/users-directory-query'
import {
  adminPostsListQuerySchema,
  postInputSchema,
  postKindSchema,
} from '#/lib/cms/schemas'
import { searchRouteSchema } from '#/lib/cms/search'
import { DEFAULT_BRAND_HEX } from '#/lib/cms/brand-defaults'
import { parseMfaPolicy } from '#/auth/mfa-policy'
import { safeInternalPath } from '#/auth/path'
import { parseEmail } from '#/auth/validators'
import { parseBrandHex } from '#/lib/cms/validators'
import {
  parseCmsImageUrlForSave,
  SOCIAL_IMAGE_URL_SAVE_ERROR,
} from '#/lib/url-security'
import { parseSiteTimezoneForSave } from '#/lib/iana-timezones'

export const emptyObjectSchema = z.object({}).strict()

export const contentIdParamSchema = z.object({
  id: z.string().min(1).max(64),
})

export const postIdParamSchema = z.object({
  postId: z.string().uuid(),
})

export const sqlTemplateIdParamSchema = z.object({
  id: z.string().min(1).max(200),
})

export const contentListQuerySchema = z.object({
  page: z.coerce.number().int().min(1).optional(),
  pageSize: z.coerce.number().int().min(1).max(50).optional(),
  q: z.string().max(120).optional(),
  kind: z.enum(['page', 'post']).optional(),
  status: z
    .enum(['all', 'draft', 'published', 'scheduled', 'pages', 'posts'])
    .optional(),
  filter: z.string().max(40).optional(),
})

export const auditListQuerySchema = z.object({
  action: z.string().max(80).optional(),
  q: z.string().max(120).optional(),
  role: z.string().max(40).optional(),
  page: z.coerce.number().int().min(1).optional(),
  pageSize: z.coerce.number().int().optional(),
  actorId: z.string().uuid().optional(),
  targetType: z.string().max(64).optional(),
  from: z.string().max(40).optional(),
  to: z.string().max(40).optional(),
  preset: z.enum(['1h', '24h', '7d', '30d']).optional(),
})

export const mcpConfirmSchema = z.object({
  confirm: z.literal(true, {
    message: 'Set confirm to true to run this tool',
  }),
})

export const mcpIdempotencyKeySchema = z.object({
  idempotencyKey: z.string().trim().min(1).max(128),
})

export const userIdParamSchema = z.object({
  userId: z.string().uuid(),
})

export const usersListQuerySchema = z.object({
  q: z.string().max(120).optional(),
  role: z.string().max(40).optional(),
  page: z.coerce.number().int().min(1).optional(),
  pageSize: z.coerce.number().int().optional(),
  status: z.enum(['active', 'banned', 'unconfirmed']).optional(),
  mfa: z.enum(['enabled', 'disabled']).optional(),
  createdFrom: z.string().max(10).optional(),
  createdTo: z.string().max(10).optional(),
})

export const inviteUserBodySchema = z.object({
  email: z.string().email().max(255),
  displayName: z.string().trim().max(120).optional(),
  roleCode: z.string().min(1).max(64),
})

export const updateUserBodySchema = z.object({
  displayName: z.string().trim().max(120).nullable().optional(),
  roleCode: z.string().min(1).max(64).optional(),
})

export const createRoleBodySchema = z.object({
  code: z.string().min(1).max(64),
  name: z.string().min(1).max(120),
  description: z.string().max(500).optional(),
  permissionCodes: z.array(z.string()).max(32),
})

export const updateRoleBodySchema = z.object({
  name: z.string().min(1).max(120),
  description: z.string().max(500).optional(),
  permissionCodes: z.array(z.string()).max(32),
})

export const roleCodeParamSchema = z.object({
  roleCode: z.string().min(1).max(64),
})

export const deleteRoleBodySchema = z.object({
  reassignToRoleCode: z.string().min(1).max(64).optional(),
  confirm: z.literal(true).optional(),
})

export function parseUsersListInput(
  input: z.infer<typeof usersListQuerySchema>,
) {
  return parseUsersDirectoryQuery({
    q: input.q,
    role: input.role,
    page: input.page,
    pageSize: input.pageSize,
    status: input.status,
    mfa: input.mfa,
    createdFrom: input.createdFrom,
    createdTo: input.createdTo,
  })
}

export const contentSaveBodySchema = z.object({
  id: z.string().min(1).max(64).default('new'),
  kind: z.enum(['page', 'post']),
  title: z.string().min(1).max(255),
  slug: z.string().max(120).optional(),
  status: z.enum(['draft', 'published', 'scheduled']),
  body: z.array(z.unknown()).default([]),
  showInNav: z.boolean().optional(),
  publishedAt: z.string().datetime().nullable().optional(),
  scheduledAt: z.string().datetime().nullable().optional(),
  tags: z.array(z.string().min(1).max(40)).max(20).optional(),
  featuredMediaId: z.string().uuid().nullable().optional(),
  metaTitle: z.string().max(120).nullable().optional(),
  metaDescription: z.string().max(320).nullable().optional(),
})

export const meDisplayNameBodySchema = z.object({
  displayName: z.string().trim().min(1).max(120),
})

export const meAvatarUploadBodySchema = z.object({
  imageBase64: z.string().max(3_000_000),
  contentType: z.enum(['image/jpeg', 'image/png', 'image/webp']),
})

export const siteSettingsSaveBodySchema = z.object({
  siteName: z.string().max(120).optional(),
  siteUrl: z.string().max(255).optional(),
  timezone: z.string().max(64).optional(),
  language: z.string().max(16).optional(),
  brandHex: z.string().max(16).optional(),
  logoUrl: z.string().max(512).nullable().optional(),
  seoTitleTemplate: z.string().max(160).optional(),
  seoDefaultDescription: z.string().max(320).nullable().optional(),
  socialImageUrl: z.string().max(512).nullable().optional(),
  analyticsId: z.string().max(64).nullable().optional(),
  webhookUrl: z.string().max(512).nullable().optional(),
  redirectAfterSignInAdmin: z.string().max(512).optional(),
  redirectAfterSignInUser: z.string().max(512).optional(),
  redirectAfterSignUp: z.string().max(512).optional(),
  redirectAfterPasswordReset: z.string().max(512).optional(),
  redirectAfterSignOut: z.string().max(512).optional(),
  contactEmail: z.string().max(255).optional(),
  mfaEnabled: z.boolean().optional(),
  mfaPolicy: z.string().max(40).optional(),
})

export function parseSiteSettingsSaveBody(
  raw: z.infer<typeof siteSettingsSaveBodySchema>,
  options?: { previousTimezone?: string | null },
) {
  return {
    siteName: String(raw.siteName ?? '')
      .trim()
      .slice(0, 120),
    siteUrl: String(raw.siteUrl ?? '')
      .trim()
      .slice(0, 255),
    timezone: parseSiteTimezoneForSave(raw.timezone ?? 'UTC', {
      previousTimezone: options?.previousTimezone,
    }),
    language: String(raw.language ?? 'en')
      .trim()
      .slice(0, 16),
    brandHex: parseBrandHex(raw.brandHex ?? DEFAULT_BRAND_HEX),
    logoUrl:
      String(raw.logoUrl ?? '')
        .trim()
        .slice(0, 512) || null,
    seoTitleTemplate: String(raw.seoTitleTemplate ?? '')
      .trim()
      .slice(0, 160),
    seoDefaultDescription:
      String(raw.seoDefaultDescription ?? '')
        .trim()
        .slice(0, 320) || null,
    socialImageUrl: parseCmsImageUrlForSave(
      String(raw.socialImageUrl ?? '').trim() || null,
      SOCIAL_IMAGE_URL_SAVE_ERROR,
    ),
    analyticsId:
      String(raw.analyticsId ?? '')
        .trim()
        .slice(0, 64) || null,
    webhookUrl:
      String(raw.webhookUrl ?? '')
        .trim()
        .slice(0, 512) || null,
    redirectAfterSignInAdmin:
      safeInternalPath(String(raw.redirectAfterSignInAdmin ?? '/admin')) ??
      '/admin',
    redirectAfterSignInUser:
      safeInternalPath(String(raw.redirectAfterSignInUser ?? '/')) ?? '/',
    redirectAfterSignUp:
      safeInternalPath(String(raw.redirectAfterSignUp ?? '/')) ?? '/',
    redirectAfterPasswordReset:
      safeInternalPath(String(raw.redirectAfterPasswordReset ?? '/account')) ??
      '/account',
    redirectAfterSignOut:
      safeInternalPath(String(raw.redirectAfterSignOut ?? '/login')) ??
      '/login',
    contactEmail: (() => {
      const value = String(raw.contactEmail ?? '').trim()
      if (!value) {
        return ''
      }
      return parseEmail(value)
    })(),
    mfaEnabled: raw.mfaEnabled !== false,
    mfaPolicy: parseMfaPolicy(raw.mfaPolicy),
  }
}

export {
  adminPostsListQuerySchema,
  postInputSchema,
  postKindSchema,
  searchRouteSchema,
}

export function parseAuditListInput(
  input: z.infer<typeof auditListQuerySchema>,
) {
  return parseAuditDirectoryQuery(input)
}
