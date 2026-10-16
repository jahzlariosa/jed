import {
  createFileRoute,
  Link,
  redirect,
  useNavigate,
} from '@tanstack/react-router'
import { useServerFn } from '@tanstack/react-start'
import { type FormEvent, useState } from 'react'

import {
  AUTH_PAGE_CACHE,
  AUTH_PAGE_HEADERS,
  getSignedInRedirectHrefFn,
  signUpWithPasswordFn,
} from '#/auth'
import {
  AuthFooterLink,
  AuthFormError,
  AuthPasswordField,
  AuthSubmitButton,
  AuthTextField,
} from '#/components/auth/auth-fields'
import { AuthGoogleSection } from '#/components/auth/auth-oauth'
import { MarketingAuthLayout } from '#/components/marketing/marketing-auth-layout'
import { useAuthSubmit } from '#/components/auth/use-auth-submit'
import { getAuthBrandingFn } from '#/lib/cms/public-marketing-fns'
import { noindexHead } from '#/lib/seo'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'

export const Route = createFileRoute('/signup')({
  ...AUTH_PAGE_CACHE,
  headers: () => AUTH_PAGE_HEADERS,
  head: ({ matches }) => noindexHead('Create account', matches),
  loader: () => getAuthBrandingFn(),
  beforeLoad: async () => {
    const href = await getSignedInRedirectHrefFn({ data: {} })
    if (href) {
      throw redirect({ href, headers: AUTH_PAGE_HEADERS })
    }
  },
  component: SignUpPage,
})

const TERMS_ERROR = 'Accept the terms to continue.'

function SignUpPage() {
  const marketing = Route.useLoaderData()
  const navigate = useNavigate()
  const signUp = useServerFn(signUpWithPasswordFn)
  const { error, pending, run, setError } = useAuthSubmit()
  const [password, setPassword] = useState('')
  const [terms, setTerms] = useState(false)
  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!terms) {
      setError(TERMS_ERROR)
      return
    }
    const form = new FormData(event.currentTarget)
    const displayName = String(form.get('name') ?? '').trim()
    const email = String(form.get('email') ?? '')
    const nextPassword = String(form.get('password') ?? '')

    await run(async (mounted) => {
      const result = await signUp({
        data: { email, password: nextPassword, displayName },
      })
      if (!mounted()) {
        return
      }
      if (result?.error) {
        return result.error
      }
      if (result?.needsConfirmation) {
        await navigate({
          to: '/check-email',
          search: { email, flow: 'signup' },
        })
      }
    })
  }

  return (
    <MarketingAuthLayout
      marketing={marketing}
      title="Create an account"
      description="Start with email. You can invite your team after setup."
    >
      <AuthGoogleSection pending={pending} />
      <form method="post" onSubmit={onSubmit} className="grid gap-[18px]">
        <AuthTextField
          id="name"
          name="name"
          label="Name"
          autoComplete="name"
          placeholder="Your name"
          required={false}
          invalid={Boolean(error) && error !== TERMS_ERROR}
        />
        <AuthTextField
          id="email"
          name="email"
          label="Email"
          type="email"
          autoComplete="username"
          placeholder="you@example.com"
          invalid={Boolean(error) && error !== TERMS_ERROR}
        />
        <AuthPasswordField
          id="password"
          name="password"
          label="Password"
          autoComplete="new-password"
          placeholder="At least 8 characters"
          invalid={Boolean(error) && error !== TERMS_ERROR}
          showStrength
          password={password}
          onPasswordChange={setPassword}
        />
        <div className="flex items-start gap-3">
          <Checkbox
            id="terms"
            checked={terms}
            onCheckedChange={(value) => setTerms(value === true)}
            aria-invalid={error === TERMS_ERROR || undefined}
          />
          <Label
            htmlFor="terms"
            className="text-sm leading-snug font-normal text-muted-foreground"
          >
            I agree to the terms
          </Label>
        </div>
        <AuthFormError message={error} />
        <AuthSubmitButton pending={pending} pendingLabel="Creating account…">
          Create account
        </AuthSubmitButton>
      </form>
      <AuthFooterLink>
        Already have an account?{' '}
        <Link to="/login" className="marketing-auth-link">
          Sign in
        </Link>
      </AuthFooterLink>
    </MarketingAuthLayout>
  )
}
