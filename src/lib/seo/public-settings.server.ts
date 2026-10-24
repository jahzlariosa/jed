import '@tanstack/react-start/server-only'

import { createServiceRoleClient } from '#/lib/supabase/service-role.server'
import {
  sanitizeGa4Id,
  sanitizeGtmId,
  sanitizePlausibleDomain,
  sanitizeTwitterHandle,
  sanitizeVerificationCode,
} from '#/lib/seo/public-seo-sanitize'
import { DEFAULT_SITE_META_DESCRIPTION } from '#/lib/seo/descriptions'
import { sanitizeCmsImageUrl } from '#/lib/url-security'

export type PublicSeoSettings = {
  siteName: string
  titleTemplate: string
  defaultDescription: string
  socialImageUrl: string | null
  defaultOgImageAlt: string | null
  language: string
  ogLocale: string
  twitterHandle: string | null
  allowSearchIndexing: boolean
  robotsExtraRules: string
  googleSiteVerification: string | null
  bingSiteVerification: string | null
  ga4MeasurementId: string | null
  gtmContainerId: string | null
  plausibleDomain: string | null
  vercelAnalyticsEnabled: boolean
  orgSchemaType: 'Organization' | 'LocalBusiness'
  orgLegalName: string | null
  orgLogoUrl: string | null
  orgAddress: string | null
  orgPhone: string | null
  orgEmail: string | null
  orgOpeningHours: string | null
  orgSameAs: string[]
  sitemapIncludeBlog: boolean
  sitemapIncludePages: boolean
  sitemapIncludeDocs: boolean
  sitemapExcludedPaths: string[]
}

const DEFAULTS: PublicSeoSettings = {
  siteName: 'JED',
  titleTemplate: '{title} · {site}',
  defaultDescription: DEFAULT_SITE_META_DESCRIPTION,
  socialImageUrl: null,
  defaultOgImageAlt: null,
  language: 'en',
  ogLocale: 'en_US',
  twitterHandle: null,
  allowSearchIndexing: true,
  robotsExtraRules: '',
  googleSiteVerification: null,
  bingSiteVerification: null,
  ga4MeasurementId: null,
  gtmContainerId: null,
  plausibleDomain: null,
  vercelAnalyticsEnabled: false,
  orgSchemaType: 'Organization',
  orgLegalName: null,
  orgLogoUrl: null,
  orgAddress: null,
  orgPhone: null,
  orgEmail: null,
  orgOpeningHours: null,
  orgSameAs: [],
  sitemapIncludeBlog: true,
  sitemapIncludePages: true,
  sitemapIncludeDocs: true,
  sitemapExcludedPaths: [],
}

let cached: { value: PublicSeoSettings; loadedAt: number } | null = null
const TTL_MS = 60_000

function parseSameAs(value: unknown): string[] {
  if (!Array.isArray(value)) {
    return []
  }
  return value.filter((item): item is string => typeof item === 'string')
}

function parsePathList(value: unknown): string[] {
  if (!Array.isArray(value)) {
    return []
  }
  return value.filter((item): item is string => typeof item === 'string')
}

export async function loadPublicSeoSettings(): Promise<PublicSeoSettings> {
  const now = Date.now()
  if (cached && now - cached.loadedAt < TTL_MS) {
    return cached.value
  }
  try {
    const supabase = createServiceRoleClient()
    const { data, error } = await supabase.rpc('get_public_seo_settings')
    if (error || data === null || data === undefined) {
      console.error(error)
      return DEFAULTS
    }
    const row = data as Record<string, unknown>
    if (typeof row !== 'object') {
      return DEFAULTS
    }
    const { data: settingsRow } = await supabase
      .from('site_settings')
      .select('sitemap_excluded_paths')
      .eq('id', 1)
      .maybeSingle()

    const value: PublicSeoSettings = {
      siteName:
        typeof row.site_name === 'string' ? row.site_name : DEFAULTS.siteName,
      titleTemplate:
        typeof row.seo_title_template === 'string'
          ? row.seo_title_template
          : DEFAULTS.titleTemplate,
      defaultDescription:
        typeof row.seo_default_description === 'string'
          ? row.seo_default_description
          : DEFAULTS.defaultDescription,
      socialImageUrl: sanitizeCmsImageUrl(
        typeof row.social_image_url === 'string' ? row.social_image_url : null,
      ),
      defaultOgImageAlt:
        typeof row.default_og_image_alt === 'string'
          ? row.default_og_image_alt
          : null,
      language:
        typeof row.language === 'string' ? row.language : DEFAULTS.language,
      ogLocale:
        typeof row.og_locale === 'string' ? row.og_locale : DEFAULTS.ogLocale,
      twitterHandle: sanitizeTwitterHandle(row.twitter_handle),
      allowSearchIndexing: row.allow_search_indexing !== false,
      robotsExtraRules:
        typeof row.robots_extra_rules === 'string'
          ? row.robots_extra_rules
          : '',
      googleSiteVerification: sanitizeVerificationCode(
        row.google_site_verification,
      ),
      bingSiteVerification: sanitizeVerificationCode(
        row.bing_site_verification,
      ),
      ga4MeasurementId: sanitizeGa4Id(row.ga4_measurement_id),
      gtmContainerId: sanitizeGtmId(row.gtm_container_id),
      plausibleDomain: sanitizePlausibleDomain(row.plausible_domain),
      vercelAnalyticsEnabled: row.vercel_analytics_enabled === true,
      orgSchemaType:
        row.org_schema_type === 'LocalBusiness'
          ? 'LocalBusiness'
          : 'Organization',
      orgLegalName:
        typeof row.org_legal_name === 'string' ? row.org_legal_name : null,
      orgLogoUrl: sanitizeCmsImageUrl(
        typeof row.org_logo_url === 'string' ? row.org_logo_url : null,
      ),
      orgAddress: typeof row.org_address === 'string' ? row.org_address : null,
      orgPhone: typeof row.org_phone === 'string' ? row.org_phone : null,
      orgEmail: typeof row.org_email === 'string' ? row.org_email : null,
      orgOpeningHours:
        typeof row.org_opening_hours === 'string'
          ? row.org_opening_hours
          : null,
      orgSameAs: parseSameAs(row.org_same_as),
      sitemapIncludeBlog: row.sitemap_include_blog !== false,
      sitemapIncludePages: row.sitemap_include_pages !== false,
      sitemapIncludeDocs: row.sitemap_include_docs !== false,
      sitemapExcludedPaths: parsePathList(settingsRow?.sitemap_excluded_paths),
    }
    cached = { value, loadedAt: now }
    return value
  } catch (error) {
    console.error(error)
    return DEFAULTS
  }
}

export function clearPublicSeoSettingsCache(): void {
  cached = null
}
