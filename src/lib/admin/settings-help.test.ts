import { describe, expect, it } from 'vitest'

import { SETTINGS_FIELD_HELP } from '#/lib/admin/settings-help'

const REQUIRED_KEYS = [
  'site_name',
  'site_url',
  'timezone',
  'language',
  'contact_email',
  'mfa_enabled',
  'mfa_policy',
  'redirect_after_sign_in_admin',
  'redirect_after_sign_in_user',
  'redirect_after_sign_up',
  'redirect_after_password_reset',
  'redirect_after_sign_out',
  'brand_hex',
  'logo_url',
  'seo_title_template',
  'seo_default_description',
  'social_image_url',
  'default_og_image_alt',
  'og_locale',
  'twitter_handle',
  'allow_search_indexing',
  'robots_extra_rules',
  'sitemap_include_blog',
  'sitemap_include_pages',
  'sitemap_include_docs',
  'sitemap_excluded_paths',
  'org_schema_type',
  'org_legal_name',
  'org_logo_url',
  'org_phone',
  'org_email',
  'org_opening_hours',
  'org_address',
  'org_same_as',
  'supabase_project_ref',
  'google_site_verification',
  'bing_site_verification',
  'ga4_measurement_id',
  'gtm_container_id',
  'plausible_domain',
  'analytics_id',
  'vercel_analytics_enabled',
  'webhook_url',
  'redirect_external_hosts',
] as const

describe('SETTINGS_FIELD_HELP', () => {
  it('defines help for every settings field', () => {
    for (const key of REQUIRED_KEYS) {
      expect(SETTINGS_FIELD_HELP[key]?.length).toBeGreaterThan(20)
    }
    expect(Object.keys(SETTINGS_FIELD_HELP).sort()).toEqual(
      [...REQUIRED_KEYS].sort(),
    )
  })

  it('uses plain copy without em dashes', () => {
    for (const text of Object.values(SETTINGS_FIELD_HELP)) {
      expect(text).not.toMatch(/—/)
    }
  })
})
