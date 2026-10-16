import { z } from 'zod'

import {
  ORG_LOGO_URL_SAVE_ERROR,
  parseCmsImageUrlForSave,
} from '#/lib/url-security'

const verificationCode = z
  .string()
  .max(120)
  .regex(/^[\w-]+$/)
  .optional()
  .or(z.literal(''))

const measurementId = z
  .string()
  .max(32)
  .regex(/^G-[A-Z0-9]+$/)
  .optional()
  .or(z.literal(''))

const gtmId = z
  .string()
  .max(32)
  .regex(/^GTM-[A-Z0-9]+$/)
  .optional()
  .or(z.literal(''))

const twitterHandle = z
  .string()
  .max(32)
  .regex(/^@?[\w]{1,15}$/)
  .optional()
  .or(z.literal(''))

function parsePathLines(value: unknown, max = 40): string[] {
  const text = typeof value === 'string' ? value : ''
  const lines = text
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
    .slice(0, max)
  for (const line of lines) {
    if (!line.startsWith('/') || line.includes(' ')) {
      throw new Error(
        'Each excluded path must start with / and contain no spaces.',
      )
    }
  }
  return lines
}

function parseHostLines(value: unknown, max = 20): string[] {
  const text = typeof value === 'string' ? value : ''
  const hosts = text
    .split('\n')
    .map((line) => line.trim().toLowerCase())
    .filter(Boolean)
    .slice(0, max)
  for (const host of hosts) {
    if (!/^[a-z0-9.-]+$/.test(host)) {
      throw new Error('External hosts must be valid hostnames.')
    }
  }
  return hosts
}

function parseUrlList(value: unknown, max = 12): string[] {
  const text = typeof value === 'string' ? value : ''
  const urls = text
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
    .slice(0, max)
  for (const url of urls) {
    try {
      const parsed = new URL(url)
      if (parsed.protocol !== 'https:') {
        throw new Error('Social profile URLs must use https.')
      }
    } catch {
      throw new Error('Social profile URLs must be valid https links.')
    }
  }
  return urls
}

export const siteSeoSaveSchema = z.object({
  ogLocale: z.string().max(16).default('en_US'),
  twitterHandle: twitterHandle.transform((v) => {
    const trimmed = (v ?? '').trim()
    if (!trimmed) return null
    return trimmed.startsWith('@') ? trimmed : `@${trimmed}`
  }),
  allowSearchIndexing: z.boolean(),
  robotsExtraRules: z.string().max(4000).default(''),
  sitemapIncludeBlog: z.boolean(),
  sitemapIncludePages: z.boolean(),
  sitemapIncludeDocs: z.boolean(),
  sitemapExcludedPathsText: z.string().max(4000).default(''),
  googleSiteVerification: verificationCode.transform((v) => v?.trim() || null),
  bingSiteVerification: verificationCode.transform((v) => v?.trim() || null),
  ga4MeasurementId: measurementId.transform((v) => v?.trim() || null),
  gtmContainerId: gtmId.transform((v) => v?.trim() || null),
  plausibleDomain: z
    .string()
    .max(120)
    .regex(/^[\w.-]+$/)
    .optional()
    .or(z.literal(''))
    .transform((v) => v?.trim() || null),
  vercelAnalyticsEnabled: z.boolean(),
  defaultOgImageAlt: z
    .string()
    .max(200)
    .optional()
    .or(z.literal(''))
    .transform((v) => v?.trim() || null),
  orgSchemaType: z.enum(['Organization', 'LocalBusiness']),
  orgLegalName: z
    .string()
    .max(200)
    .optional()
    .or(z.literal(''))
    .transform((v) => v?.trim() || null),
  orgLogoUrl: z
    .string()
    .max(512)
    .optional()
    .or(z.literal(''))
    .transform((v) => v?.trim() || null),
  orgAddress: z
    .string()
    .max(500)
    .optional()
    .or(z.literal(''))
    .transform((v) => v?.trim() || null),
  orgPhone: z
    .string()
    .max(64)
    .optional()
    .or(z.literal(''))
    .transform((v) => v?.trim() || null),
  orgEmail: z
    .string()
    .max(255)
    .optional()
    .or(z.literal(''))
    .transform((v) => v?.trim() || null),
  orgOpeningHours: z
    .string()
    .max(500)
    .optional()
    .or(z.literal(''))
    .transform((v) => v?.trim() || null),
  orgSameAsText: z.string().max(4000).default(''),
  redirectExternalHostsText: z.string().max(2000).default(''),
})

export type SiteSeoSaveInput = z.infer<typeof siteSeoSaveSchema>

export function parseSiteSeoSaveInput(
  raw: Record<string, unknown>,
): SiteSeoSaveInput {
  const parsed = siteSeoSaveSchema.parse({
    ogLocale: raw.ogLocale,
    twitterHandle: raw.twitterHandle,
    allowSearchIndexing: raw.allowSearchIndexing !== false,
    robotsExtraRules: raw.robotsExtraRules ?? '',
    sitemapIncludeBlog: raw.sitemapIncludeBlog !== false,
    sitemapIncludePages: raw.sitemapIncludePages !== false,
    sitemapIncludeDocs: raw.sitemapIncludeDocs !== false,
    sitemapExcludedPathsText: raw.sitemapExcludedPathsText ?? '',
    googleSiteVerification: raw.googleSiteVerification ?? '',
    bingSiteVerification: raw.bingSiteVerification ?? '',
    ga4MeasurementId: raw.ga4MeasurementId ?? '',
    gtmContainerId: raw.gtmContainerId ?? '',
    plausibleDomain: raw.plausibleDomain ?? '',
    vercelAnalyticsEnabled: raw.vercelAnalyticsEnabled === true,
    defaultOgImageAlt: raw.defaultOgImageAlt ?? '',
    orgSchemaType:
      raw.orgSchemaType === 'LocalBusiness' ? 'LocalBusiness' : 'Organization',
    orgLegalName: raw.orgLegalName ?? '',
    orgLogoUrl: raw.orgLogoUrl ?? '',
    orgAddress: raw.orgAddress ?? '',
    orgPhone: raw.orgPhone ?? '',
    orgEmail: raw.orgEmail ?? '',
    orgOpeningHours: raw.orgOpeningHours ?? '',
    orgSameAsText: raw.orgSameAsText ?? '',
    redirectExternalHostsText: raw.redirectExternalHostsText ?? '',
  })
  parsePathLines(parsed.sitemapExcludedPathsText)
  parseHostLines(parsed.redirectExternalHostsText)
  parseUrlList(parsed.orgSameAsText)
  return {
    ...parsed,
    orgLogoUrl: parseCmsImageUrlForSave(
      parsed.orgLogoUrl,
      ORG_LOGO_URL_SAVE_ERROR,
    ),
  }
}

export function siteSeoRowFromInput(input: SiteSeoSaveInput) {
  return {
    og_locale: input.ogLocale.trim() || 'en_US',
    twitter_handle: input.twitterHandle,
    allow_search_indexing: input.allowSearchIndexing,
    robots_extra_rules: input.robotsExtraRules.trim(),
    sitemap_include_blog: input.sitemapIncludeBlog,
    sitemap_include_pages: input.sitemapIncludePages,
    sitemap_include_docs: input.sitemapIncludeDocs,
    sitemap_excluded_paths: parsePathLines(input.sitemapExcludedPathsText),
    google_site_verification: input.googleSiteVerification,
    bing_site_verification: input.bingSiteVerification,
    ga4_measurement_id: input.ga4MeasurementId,
    gtm_container_id: input.gtmContainerId,
    plausible_domain: input.plausibleDomain,
    vercel_analytics_enabled: input.vercelAnalyticsEnabled,
    default_og_image_alt: input.defaultOgImageAlt,
    org_schema_type: input.orgSchemaType,
    org_legal_name: input.orgLegalName,
    org_logo_url: input.orgLogoUrl,
    org_address: input.orgAddress,
    org_phone: input.orgPhone,
    org_email: input.orgEmail,
    org_opening_hours: input.orgOpeningHours,
    org_same_as: parseUrlList(input.orgSameAsText),
    redirect_external_hosts: parseHostLines(input.redirectExternalHostsText),
  }
}

export function pathsToText(paths: unknown): string {
  if (!Array.isArray(paths)) {
    return ''
  }
  return paths.filter((p): p is string => typeof p === 'string').join('\n')
}
