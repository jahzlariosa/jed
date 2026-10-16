import { createFileRoute, Outlet, redirect } from '@tanstack/react-router'

import {
  APP_SHELL_CACHE_KEY,
  APP_SHELL_TTL_MS,
  getAppShellFn,
  PRIVATE_ROUTE_CACHE,
  PRIVATE_ROUTE_HEADERS,
  safeInternalPath,
  type AccessDto,
} from '#/auth'
import { mfaGateRedirectForPath } from '#/auth/mfa-gate'
import type { AppUser } from '#/auth/user'
import { cachedFetch } from '#/lib/deduped-fetch'
import { noindexHead, type RootMatch } from '#/lib/seo'

export const Route = createFileRoute('/_authenticated')({
  ...PRIVATE_ROUTE_CACHE,
  headers: () => PRIVATE_ROUTE_HEADERS,
  head: ({ matches }: { matches: ReadonlyArray<RootMatch> }) =>
    noindexHead('Account', matches),
  beforeLoad: async ({
    location,
  }): Promise<{ user: AppUser; access: AccessDto }> => {
    const shell = await cachedFetch(APP_SHELL_CACHE_KEY, APP_SHELL_TTL_MS, () =>
      getAppShellFn(),
    )
    if (!shell) {
      throw redirect({
        to: '/login',
        search: { redirect: location.pathname },
      })
    }

    const redirectTo = mfaGateRedirectForPath(shell, location.pathname)
    if (redirectTo && redirectTo !== location.pathname) {
      throw redirect({
        to: redirectTo,
        search: {
          redirect: safeInternalPath(location.pathname, null) ?? undefined,
        },
      })
    }

    return { user: shell.user, access: shell.access }
  },
  component: Outlet,
})
