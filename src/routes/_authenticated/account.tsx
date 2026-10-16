import { createFileRoute } from '@tanstack/react-router'

import {
  PRIVATE_ROUTE_CACHE,
  PRIVATE_ROUTE_HEADERS,
  withAuthRedirects,
} from '#/auth'
import { getMfaAccountSettingsFn } from '#/auth/mfa-fns'
import { AccountPageScreen } from '#/components/account/account-page-screen'
import { MarketingSiteShell } from '#/components/marketing/marketing-site-shell'
import { getAccountProfileFn } from '#/lib/account/account-fns'
import { getPublicMarketingFn } from '#/lib/cms/public-marketing-fns'
import { normalizePublicMarketing } from '#/lib/cms/public-marketing'
import { noindexHead, type RootMatch } from '#/lib/seo'

export const Route = createFileRoute('/_authenticated/account')({
  ...PRIVATE_ROUTE_CACHE,
  headers: () => PRIVATE_ROUTE_HEADERS,
  head: ({ matches }: { matches: ReadonlyArray<RootMatch> }) =>
    noindexHead('Account', matches),
  loader: ({ location }) =>
    withAuthRedirects(async () => {
      const [marketing, profile, mfa] = await Promise.all([
        getPublicMarketingFn(),
        getAccountProfileFn(),
        getMfaAccountSettingsFn(),
      ])
      return { marketing, profile, mfa }
    }, location.pathname),
  component: AccountPage,
})

function AccountPage() {
  const { marketing, profile, mfa } = Route.useLoaderData()
  const { siteName } = normalizePublicMarketing(marketing)

  return (
    <MarketingSiteShell marketing={marketing}>
      <main id="main-content" tabIndex={-1} className="flex flex-1 flex-col">
        <AccountPageScreen
          siteName={siteName}
          profile={{
            userId: profile.userId,
            email: profile.email,
            displayName: profile.displayName,
            avatarUrl: profile.avatarUrl,
            permissions: profile.permissions,
            mfa,
          }}
        />
      </main>
    </MarketingSiteShell>
  )
}
