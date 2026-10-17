import type { MfaPolicy } from '#/auth/mfa-policy'
import { parseSiteBarWidth, type SiteBarWidth } from '#/lib/cms/site-layout'
import { pathsToText } from '#/lib/cms/site-settings-seo'
import {
  resolvePublicBrandHex,
  resolvePublicSiteName,
} from '#/lib/cms/brand-defaults'

export type SiteSettingsForm = {
  site_name: string
  site_url: string | null
  timezone: string
  language: string
  brand_hex: string
  logo_url: string | null
  navbar_width: SiteBarWidth
  footer_width: SiteBarWidth
  seo_title_template: string
  seo_default_description: string | null
  social_image_url: string | null
  analytics_id: string | null
  webhook_url: string | null
  redirect_after_sign_in_admin: string
  redirect_after_sign_in_user: string
  redirect_after_sign_up: string
  redirect_after_password_reset: string
  redirect_after_sign_out: string
  contact_email: string | null
  mfa_enabled: boolean
  mfa_policy: MfaPolicy
  og_locale: string
  twitter_handle: string | null
  allow_search_indexing: boolean
  robots_extra_rules: string
  sitemap_include_blog: boolean
  sitemap_include_pages: boolean
  sitemap_include_docs: boolean
  sitemap_excluded_paths: unknown
  google_site_verification: string | null
  bing_site_verification: string | null
  ga4_measurement_id: string | null
  gtm_container_id: string | null
  plausible_domain: string | null
  vercel_analytics_enabled: boolean
  default_og_image_alt: string | null
  org_schema_type: string
  org_legal_name: string | null
  org_logo_url: string | null
  org_address: string | null
  org_phone: string | null
  org_email: string | null
  org_opening_hours: string | null
  org_same_as: unknown
  redirect_external_hosts: unknown
}

export function normalizeSiteSettingsForm(
  settings: SiteSettingsForm,
): SiteSettingsForm {
  return {
    ...settings,
    site_name: resolvePublicSiteName(settings.site_name),
    brand_hex: resolvePublicBrandHex(settings.brand_hex),
    navbar_width: parseSiteBarWidth(settings.navbar_width),
    footer_width: parseSiteBarWidth(settings.footer_width),
  }
}

export function toSaveSiteSettingsPayload(form: SiteSettingsForm) {
  return {
    siteName: form.site_name,
    siteUrl: form.site_url ?? '',
    timezone: form.timezone,
    language: form.language,
    brandHex: form.brand_hex,
    logoUrl: form.logo_url ?? '',
    navbarWidth: form.navbar_width,
    footerWidth: form.footer_width,
    seoTitleTemplate: form.seo_title_template,
    seoDefaultDescription: form.seo_default_description ?? '',
    socialImageUrl: form.social_image_url ?? '',
    analyticsId: form.analytics_id ?? '',
    webhookUrl: form.webhook_url ?? '',
    redirectAfterSignInAdmin: form.redirect_after_sign_in_admin,
    redirectAfterSignInUser: form.redirect_after_sign_in_user,
    redirectAfterSignUp: form.redirect_after_sign_up,
    redirectAfterPasswordReset: form.redirect_after_password_reset,
    redirectAfterSignOut: form.redirect_after_sign_out,
    contactEmail: form.contact_email ?? '',
    mfaEnabled: form.mfa_enabled,
    mfaPolicy: form.mfa_policy,
    ogLocale: form.og_locale,
    twitterHandle: form.twitter_handle ?? '',
    allowSearchIndexing: form.allow_search_indexing,
    robotsExtraRules: form.robots_extra_rules,
    sitemapIncludeBlog: form.sitemap_include_blog,
    sitemapIncludePages: form.sitemap_include_pages,
    sitemapIncludeDocs: form.sitemap_include_docs,
    sitemapExcludedPathsText: pathsToText(form.sitemap_excluded_paths),
    googleSiteVerification: form.google_site_verification ?? '',
    bingSiteVerification: form.bing_site_verification ?? '',
    ga4MeasurementId: form.ga4_measurement_id ?? '',
    gtmContainerId: form.gtm_container_id ?? '',
    plausibleDomain: form.plausible_domain ?? '',
    vercelAnalyticsEnabled: form.vercel_analytics_enabled,
    defaultOgImageAlt: form.default_og_image_alt ?? '',
    orgSchemaType:
      form.org_schema_type === 'LocalBusiness'
        ? 'LocalBusiness'
        : 'Organization',
    orgLegalName: form.org_legal_name ?? '',
    orgLogoUrl: form.org_logo_url ?? '',
    orgAddress: form.org_address ?? '',
    orgPhone: form.org_phone ?? '',
    orgEmail: form.org_email ?? '',
    orgOpeningHours: form.org_opening_hours ?? '',
    orgSameAsText: pathsToText(form.org_same_as),
    redirectExternalHostsText: pathsToText(form.redirect_external_hosts),
  }
}

export function siteSettingsFormsEqual(
  a: SiteSettingsForm,
  b: SiteSettingsForm,
): boolean {
  return (
    JSON.stringify(toSaveSiteSettingsPayload(a)) ===
    JSON.stringify(toSaveSiteSettingsPayload(b))
  )
}
