import { createFileRoute, useRouter } from '@tanstack/react-router'

import {
  AdminListError,
  AdminListPending,
} from '#/components/admin/admin-list-route'
import {
  RedirectsScreen,
  type RedirectsTabId,
} from '#/components/admin/redirects-screen'
import { ADMIN_LIST_ROUTE_CACHE } from '#/auth'
import { parseMfaPolicy } from '#/auth/mfa-policy'
import { adminTabSearchSchema } from '#/lib/admin/admin-tab-search'
import { getSiteSettingsFn } from '#/lib/cms/functions'
import { listUrlRedirectsFn } from '#/lib/cms/redirects-fns'

const redirectsSearchSchema = adminTabSearchSchema(['rules', 'hosts'] as const)

export const Route = createFileRoute('/_authenticated/admin/redirects')({
  ...ADMIN_LIST_ROUTE_CACHE,
  pendingComponent: AdminListPending,
  errorComponent: AdminListError,
  validateSearch: (search) => redirectsSearchSchema.parse(search),
  loader: async () => {
    const [rows, settings] = await Promise.all([
      listUrlRedirectsFn(),
      getSiteSettingsFn(),
    ])
    return { rows, settings }
  },
  component: AdminRedirectsPage,
})

function AdminRedirectsPage() {
  const router = useRouter()
  const { rows, settings } = Route.useLoaderData()
  const { tab } = Route.useSearch()
  if (!settings) {
    return null
  }
  const siteSettings = {
    ...settings,
    redirect_after_sign_in_admin:
      settings.redirect_after_sign_in_admin ?? '/admin',
    redirect_after_sign_in_user: settings.redirect_after_sign_in_user ?? '/',
    redirect_after_sign_up: settings.redirect_after_sign_up ?? '/',
    redirect_after_password_reset:
      settings.redirect_after_password_reset ?? '/account',
    redirect_after_sign_out: settings.redirect_after_sign_out ?? '/login',
    mfa_enabled: settings.mfa_enabled ?? true,
    mfa_policy: parseMfaPolicy(settings.mfa_policy),
    og_locale: settings.og_locale ?? 'en_US',
    twitter_handle: settings.twitter_handle ?? null,
    allow_search_indexing: settings.allow_search_indexing ?? true,
    robots_extra_rules: settings.robots_extra_rules ?? '',
    sitemap_include_blog: settings.sitemap_include_blog ?? true,
    sitemap_include_pages: settings.sitemap_include_pages ?? true,
    sitemap_include_docs: settings.sitemap_include_docs ?? true,
    sitemap_excluded_paths: settings.sitemap_excluded_paths ?? [],
    google_site_verification: settings.google_site_verification ?? null,
    bing_site_verification: settings.bing_site_verification ?? null,
    ga4_measurement_id: settings.ga4_measurement_id ?? null,
    gtm_container_id: settings.gtm_container_id ?? null,
    plausible_domain: settings.plausible_domain ?? null,
    vercel_analytics_enabled: settings.vercel_analytics_enabled ?? false,
    default_og_image_alt: settings.default_og_image_alt ?? null,
    org_schema_type: settings.org_schema_type ?? 'Organization',
    org_legal_name: settings.org_legal_name ?? null,
    org_logo_url: settings.org_logo_url ?? null,
    org_address: settings.org_address ?? null,
    org_phone: settings.org_phone ?? null,
    org_email: settings.org_email ?? null,
    org_opening_hours: settings.org_opening_hours ?? null,
    org_same_as: settings.org_same_as ?? [],
    redirect_external_hosts: settings.redirect_external_hosts ?? [],
  }
  return (
    <RedirectsScreen
      initial={rows}
      siteSettings={siteSettings}
      activeTab={tab as RedirectsTabId}
      onReload={() => void router.invalidate()}
    />
  )
}
