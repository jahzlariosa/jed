import { createFileRoute, Link, redirect } from '@tanstack/react-router'
import { useServerFn } from '@tanstack/react-start'
import { useEffect, useState, type FormEvent } from 'react'

import {
  APP_SHELL_CACHE_KEY,
  APP_SHELL_TTL_MS,
  getAppShellFn,
  MFA_CHALLENGE_PATH,
  mfaGateRedirectForPath,
  PRIVATE_ROUTE_CACHE,
  PRIVATE_ROUTE_HEADERS,
  safeInternalPath,
} from '#/auth'
import { completeMfaChallengeFn, listMfaFactorsFn } from '#/auth/mfa-fns'
import { cachedFetch } from '#/lib/deduped-fetch'
import { signInDocumentHref } from '#/auth/sign-in-navigation'
import { AuthFormError, AuthSubmitButton } from '#/components/auth/auth-fields'
import { AuthOtpInput } from '#/components/auth/auth-otp-input'
import { MarketingAuthLayout } from '#/components/marketing/marketing-auth-layout'
import { useAuthSubmit } from '#/components/auth/use-auth-submit'
import { getAuthBrandingFn } from '#/lib/cms/public-marketing-fns'
import { noindexHead, type RootMatch } from '#/lib/seo'

export const Route = createFileRoute('/_authenticated/mfa-challenge')({
  ...PRIVATE_ROUTE_CACHE,
  headers: () => PRIVATE_ROUTE_HEADERS,
  head: ({ matches }: { matches: ReadonlyArray<RootMatch> }) =>
    noindexHead('Verify sign-in', matches),
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
    if (redirectTo && redirectTo !== MFA_CHALLENGE_PATH) {
      throw redirect({
        to: redirectTo,
        search: { redirect: search.redirect },
      })
    }
  },
  component: MfaChallengePage,
})

function MfaChallengePage() {
  const marketing = Route.useLoaderData()
  const { redirect: redirectTo } = Route.useSearch()
  const complete = useServerFn(completeMfaChallengeFn)
  const listFactors = useServerFn(listMfaFactorsFn)
  const { error, pending, run } = useAuthSubmit()
  const [factorId, setFactorId] = useState<string | null>(null)
  const [code, setCode] = useState('')

  useEffect(() => {
    let cancelled = false
    void listFactors().then((data) => {
      if (!cancelled) {
        setFactorId(data.verified[0]?.id ?? null)
      }
    })
    return () => {
      cancelled = true
    }
  }, [listFactors])

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!factorId) {
      return
    }
    await run(async () => {
      const result = await complete({
        data: { factorId, code, redirectTo },
      })
      if (result && 'redirectTo' in result) {
        const href = signInDocumentHref(result.redirectTo)
        if (href) {
          window.location.replace(href)
          return undefined
        }
      }
      return result?.error
    })
  }

  return (
    <MarketingAuthLayout
      marketing={marketing}
      icon="shield"
      title="Enter your code"
      description="Open your authenticator app and enter the 6-digit code."
    >
      <form method="post" onSubmit={onSubmit} className="grid gap-5">
        <AuthOtpInput
          id="mfa-challenge-code"
          value={code}
          onChange={setCode}
          invalid={Boolean(error)}
          aria-describedby={error ? 'auth-form-error' : undefined}
        />
        <AuthFormError message={error} />
        <AuthSubmitButton
          pending={pending}
          pendingLabel="Verifying…"
          disabled={!factorId || code.length < 6}
        >
          Verify
        </AuthSubmitButton>
      </form>
      <p className="marketing-auth-foot">
        <Link to="/login" className="marketing-auth-link">
          Back to sign in
        </Link>
      </p>
    </MarketingAuthLayout>
  )
}
