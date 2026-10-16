import { createFileRoute, Link, redirect } from '@tanstack/react-router'
import { useServerFn } from '@tanstack/react-start'
import { useState, type FormEvent } from 'react'

import {
  AUTH_PAGE_CACHE,
  AUTH_PAGE_HEADERS,
  getSignedInRedirectHrefFn,
  safeInternalPath,
  signInWithPasswordFn,
} from '#/auth'
import { AuthAlert } from '#/components/auth/auth-alert'
import { AuthGenericErrorPanel } from '#/components/auth/auth-error-state'
import {
  AuthFooterLink,
  AuthFormError,
  AuthPasswordField,
  AuthSubmitButton,
  AuthTextField,
} from '#/components/auth/auth-fields'
import { AuthGoogleSection } from '#/components/auth/auth-oauth'
import { AuthOtpInput } from '#/components/auth/auth-otp-input'
import { MarketingAuthLayout } from '#/components/marketing/marketing-auth-layout'
import { useAuthSubmit } from '#/components/auth/use-auth-submit'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import { verifyMfaSignInFn } from '#/auth/mfa-fns'
import { signInDocumentHref } from '#/auth/sign-in-navigation'
import { getAuthBrandingFn } from '#/lib/cms/public-marketing-fns'
import { noindexHead, type RootMatch } from '#/lib/seo'

const INVALID_CREDENTIALS = 'Email or password is incorrect'

export const Route = createFileRoute('/login')({
  ...AUTH_PAGE_CACHE,
  headers: () => AUTH_PAGE_HEADERS,
  head: ({ matches }: { matches: ReadonlyArray<RootMatch> }) =>
    noindexHead('Sign in', matches),
  loader: () => getAuthBrandingFn(),
  validateSearch: (search: Record<string, unknown>) => {
    const next: { redirect?: string; reason?: string } = {}
    if (typeof search.redirect === 'string') {
      const redirectTo = safeInternalPath(search.redirect, null)
      if (redirectTo) {
        next.redirect = redirectTo
      }
    }
    if (search.reason === 'sign_in_failed') {
      next.reason = 'sign_in_failed'
    }
    return next
  },
  beforeLoad: async ({ search }): Promise<void> => {
    const href = await getSignedInRedirectHrefFn({
      data: { redirectTo: search.redirect },
    })
    if (href) {
      throw redirect({
        href,
        headers: AUTH_PAGE_HEADERS,
      })
    }
  },
  component: LoginPage,
})

function LoginPage() {
  const marketing = Route.useLoaderData()
  const { redirect: redirectTo, reason } = Route.useSearch()
  const signIn = useServerFn(signInWithPasswordFn)
  const verifyMfa = useServerFn(verifyMfaSignInFn)
  const { error, pending, run } = useAuthSubmit()
  const invalidCreds = error === INVALID_CREDENTIALS
  const [mfaFactorId, setMfaFactorId] = useState<string | null>(null)
  const [mfaCode, setMfaCode] = useState('')

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const form = new FormData(event.currentTarget)
    const email = String(form.get('email') ?? '')
    const password = String(form.get('password') ?? '')
    const remember = form.get('remember') === 'on' ? 'on' : false

    await run(async () => {
      const result = await signIn({
        data: { email, password, redirectTo, remember },
      })
      if (result?.mfaRequired && result.factorId) {
        setMfaFactorId(result.factorId)
        return undefined
      }
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

  async function onMfaSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!mfaFactorId) {
      return
    }
    await run(async () => {
      const result = await verifyMfa({
        data: { factorId: mfaFactorId, code: mfaCode, redirectTo },
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

  if (reason === 'sign_in_failed') {
    return (
      <MarketingAuthLayout
        marketing={marketing}
        title="Sign in"
        description="Enter your email and password to open the workspace."
      >
        <AuthGenericErrorPanel />
      </MarketingAuthLayout>
    )
  }

  return (
    <MarketingAuthLayout
      marketing={marketing}
      icon={mfaFactorId ? 'shield' : undefined}
      title={mfaFactorId ? 'Enter your code' : 'Sign in'}
      description={
        mfaFactorId
          ? 'Open your authenticator app and enter the 6-digit code.'
          : 'Enter your email and password to open the workspace.'
      }
    >
      {invalidCreds ? (
        <AuthAlert tone="error" title="Could not sign in" className="mb-5">
          Email or password is incorrect. Try again, or reset your password.
        </AuthAlert>
      ) : null}
      {error ===
      'Too many attempts. Please wait a few minutes and try again.' ? (
        <AuthAlert tone="warn" title="Too many attempts" className="mb-5">
          Wait a few minutes, then try again.
        </AuthAlert>
      ) : null}
      {mfaFactorId ? (
        <form method="post" onSubmit={onMfaSubmit} className="grid gap-5">
          <AuthOtpInput
            id="mfa-code"
            value={mfaCode}
            onChange={setMfaCode}
            invalid={Boolean(error)}
            aria-describedby={error ? 'auth-form-error' : undefined}
          />
          <AuthFormError message={error} />
          <AuthSubmitButton pending={pending} pendingLabel="Verifying…">
            Verify
          </AuthSubmitButton>
          <button
            type="button"
            className="marketing-auth-link text-sm"
            onClick={() => {
              setMfaFactorId(null)
              setMfaCode('')
            }}
          >
            Back to password
          </button>
        </form>
      ) : (
        <>
          <AuthGoogleSection redirectTo={redirectTo} pending={pending} />
          <form method="post" onSubmit={onSubmit} className="grid gap-[18px]">
            <AuthTextField
              id="email"
              name="email"
              label="Email"
              type="email"
              autoComplete="username"
              placeholder="you@example.com"
              invalid={invalidCreds}
            />
            <AuthPasswordField
              id="password"
              name="password"
              label="Password"
              autoComplete="current-password"
              placeholder="Enter your password"
              invalid={invalidCreds}
            />
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <Checkbox id="remember" name="remember" defaultChecked />
                <Label
                  htmlFor="remember"
                  className="text-sm font-normal text-muted-foreground"
                >
                  Remember me
                </Label>
              </div>
              <Link
                to="/forgot-password"
                className="marketing-auth-link text-sm"
              >
                Forgot password?
              </Link>
            </div>
            {!invalidCreds ? <AuthFormError message={error} /> : null}
            <AuthSubmitButton pending={pending} pendingLabel="Signing in…">
              Sign in
            </AuthSubmitButton>
          </form>
        </>
      )}
      {!mfaFactorId ? (
        <AuthFooterLink>
          No account yet?{' '}
          <Link to="/signup" className="marketing-auth-link">
            Sign up
          </Link>
        </AuthFooterLink>
      ) : null}
    </MarketingAuthLayout>
  )
}
