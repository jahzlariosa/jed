import { createFileRoute, Link, redirect } from '@tanstack/react-router'

import {
  APP_SHELL_CACHE_KEY,
  APP_SHELL_TTL_MS,
  getAppShellFn,
  MFA_CHALLENGE_PATH,
  MFA_SETUP_PATH,
  mfaGateRedirectForPath,
  PRIVATE_ROUTE_CACHE,
  PRIVATE_ROUTE_HEADERS,
  safeInternalPath,
} from '#/auth'
import { cachedFetch } from '#/lib/deduped-fetch'
import { AuthMfaSetup } from '#/components/auth/auth-mfa-setup'
import { MarketingAuthLayout } from '#/components/marketing/marketing-auth-layout'
import { getAuthBrandingFn } from '#/lib/cms/public-marketing-fns'
import { noindexHead, type RootMatch } from '#/lib/seo'

export const Route = createFileRoute('/_authenticated/mfa-setup')({
  ...PRIVATE_ROUTE_CACHE,
  headers: () => PRIVATE_ROUTE_HEADERS,
  head: ({ matches }: { matches: ReadonlyArray<RootMatch> }) =>
    noindexHead('Set up authenticator', matches),
  loader: () => getAuthBrandingFn(),
  validateSearch: (search: Record<string, unknown>) => {
    const next: { redirect?: string } = {}
    if (typeof search.redirect === 'string') {
      const redirectTo = safeInternalPath(search.redirect, null)
      if (redirectTo) {
        next.redirect = redirectTo
      }
    }
    return next
  },
  beforeLoad: async ({ location, search }) => {
    const shell = await cachedFetch(APP_SHELL_CACHE_KEY, APP_SHELL_TTL_MS, () =>
      getAppShellFn(),
    )
    if (!shell) {
      throw redirect({ to: '/login' })
    }
    const redirectTo = mfaGateRedirectForPath(shell, location.pathname)
    if (redirectTo === MFA_CHALLENGE_PATH) {
      throw redirect({
        to: MFA_CHALLENGE_PATH,
        search: { redirect: search.redirect },
      })
    }
    if (redirectTo && redirectTo !== MFA_SETUP_PATH) {
      throw redirect({ to: redirectTo })
    }
  },
  component: MfaSetupPage,
})

function MfaSetupPage() {
  const marketing = Route.useLoaderData()

  return (
    <MarketingAuthLayout
      marketing={marketing}
      icon="shield"
      title="Set up authenticator"
      description="This site asks for a second sign-in step. Add an authenticator app such as Google Authenticator or 1Password to continue."
    >
      <AuthMfaSetup />
      <p className="marketing-auth-foot">
        <Link to="/" className="marketing-auth-link">
          Back to home
        </Link>
      </p>
    </MarketingAuthLayout>
  )
}
