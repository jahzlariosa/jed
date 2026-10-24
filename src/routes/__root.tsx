import {
  ClientOnly,
  HeadContent,
  Scripts,
  createRootRoute,
  redirect,
} from '@tanstack/react-router'
import { lazy, Suspense } from 'react'
import { TanStackRouterDevtoolsPanel } from '@tanstack/react-router-devtools'
import { TanStackDevtools } from '@tanstack/react-devtools'

import { resolvePublicSiteName } from '#/lib/cms/brand-defaults'
import {
  DEFAULT_SEO_TITLE_TEMPLATE,
  SITE_DESCRIPTION,
  SITE_NAME,
  seoTitleTemplate,
} from '#/lib/seo'
import { resolveMetaDescription } from '#/lib/seo/descriptions'
import { resolveOgImageUrl } from '#/lib/seo/og-image'
import { SETUP_CACHE_HEADERS, shouldRedirectToSetup } from '#/lib/env/gate'
import { getSetupStatusFn } from '#/lib/env/setup-status'
import { getRootShellFn } from '#/lib/site'

import { SiteAnalyticsScripts } from '#/components/seo/site-analytics-scripts'

const LazySiteAnalytics = lazy(() =>
  import('#/components/seo/site-analytics.client').then((module) => ({
    default: module.SiteAnalytics,
  })),
)
import { RouteTransitionIndicator } from '#/components/route-transition'
import { Toaster } from '@/components/ui/sonner'

import { AdminThemeInitScript } from '#/components/seo/admin-theme-init-script'
import { MarketingThemeInitScript } from '#/components/seo/marketing-theme-init-script'
import appCss from '../styles.css?url'

export const Route = createRootRoute({
  beforeLoad: async ({ location }) => {
    if (!import.meta.env.DEV || import.meta.env.MODE === 'test') return
    if (
      !shouldRedirectToSetup({
        dev: true,
        pathname: location.pathname,
        ok: false,
      })
    ) {
      return
    }
    const status = await getSetupStatusFn()
    if (!status.ok) {
      throw redirect({
        to: '/setup',
        headers: SETUP_CACHE_HEADERS,
      })
    }
  },
  // Public, identity-free origin for canonical links. Resolved once per client session.
  staleTime: Infinity,
  gcTime: Infinity,
  loader: () => getRootShellFn(),
  head: ({ loaderData }) => {
    const siteUrl = loaderData?.siteUrl
    const rootDescription = resolveMetaDescription(
      loaderData?.seo.defaultDescription,
      SITE_DESCRIPTION,
    )
    const ogImageUrl = resolveOgImageUrl({
      siteUrl,
      socialImageUrl: loaderData?.seo.socialImageUrl,
    })
    return {
      meta: [
        {
          charSet: 'utf-8',
        },
        {
          name: 'viewport',
          content: 'width=device-width, initial-scale=1',
        },
        {
          title: seoTitleTemplate(SITE_NAME, {
            siteName: resolvePublicSiteName(loaderData?.seo.siteName),
            titleTemplate:
              loaderData?.seo.titleTemplate ?? DEFAULT_SEO_TITLE_TEMPLATE,
          }),
        },
        {
          name: 'description',
          content: rootDescription,
        },
        {
          property: 'og:site_name',
          content: resolvePublicSiteName(loaderData?.seo.siteName),
        },
        { property: 'og:type', content: 'website' },
        {
          property: 'og:locale',
          content: loaderData?.seo.ogLocale ?? 'en_US',
        },
        {
          name: 'twitter:card',
          content: ogImageUrl ? 'summary_large_image' : 'summary',
        },
        ...(loaderData?.seo.googleSiteVerification
          ? [
              {
                name: 'google-site-verification',
                content: loaderData.seo.googleSiteVerification,
              },
            ]
          : []),
        ...(loaderData?.seo.bingSiteVerification
          ? [
              {
                name: 'msvalidate.01',
                content: loaderData.seo.bingSiteVerification,
              },
            ]
          : []),
        ...(loaderData?.seo.twitterHandle
          ? [{ name: 'twitter:site', content: loaderData.seo.twitterHandle }]
          : []),
      ],
      links: [
        { rel: 'icon', href: '/favicon.svg', type: 'image/svg+xml' },
        {
          rel: 'stylesheet',
          href: appCss,
        },
      ],
    }
  },
  shellComponent: RootDocument,
})

function RootDocument({ children }: { children: React.ReactNode }) {
  const shell = Route.useLoaderData()
  const analytics = shell?.seo
  return (
    <html lang={shell?.seo.language ?? 'en'}>
      <head>
        <HeadContent />
        <AdminThemeInitScript />
        <MarketingThemeInitScript />
        {analytics ? (
          <>
            <SiteAnalyticsScripts
              config={{
                ga4MeasurementId: analytics.ga4MeasurementId ?? null,
                gtmContainerId: analytics.gtmContainerId ?? null,
              }}
            />
            <ClientOnly>
              <Suspense fallback={null}>
                <LazySiteAnalytics
                  config={{
                    ga4MeasurementId: analytics.ga4MeasurementId ?? null,
                    gtmContainerId: analytics.gtmContainerId ?? null,
                    plausibleDomain: analytics.plausibleDomain ?? null,
                    vercelAnalyticsEnabled:
                      analytics.vercelAnalyticsEnabled === true,
                  }}
                />
              </Suspense>
            </ClientOnly>
          </>
        ) : null}
      </head>
      <body>
        <RouteTransitionIndicator />
        <Toaster
          richColors
          closeButton
          position="bottom-right"
          visibleToasts={1}
        />
        {children}
        {import.meta.env.DEV ? (
          <TanStackDevtools
            config={{
              position: 'bottom-right',
            }}
            plugins={[
              {
                name: 'Tanstack Router',
                render: <TanStackRouterDevtoolsPanel />,
              },
            ]}
          />
        ) : null}
        <Scripts />
      </body>
    </html>
  )
}
