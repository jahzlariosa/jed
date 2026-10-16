import {
  createFileRoute,
  Link,
  redirect,
  useNavigate,
} from '@tanstack/react-router'
import { useServerFn } from '@tanstack/react-start'
import type { FormEvent, ReactNode } from 'react'

import {
  AUTH_PAGE_CACHE,
  AUTH_PAGE_HEADERS,
  getSignedInRedirectHrefFn,
  requestPasswordResetFn,
} from '#/auth'
import {
  AuthLinkExpiredPanel,
  AuthRateLimitedPanel,
} from '#/components/auth/auth-error-state'
import {
  AuthFooterLink,
  AuthFormError,
  AuthSubmitButton,
  AuthTextField,
} from '#/components/auth/auth-fields'
import { MarketingAuthLayout } from '#/components/marketing/marketing-auth-layout'
import { useAuthSubmit } from '#/components/auth/use-auth-submit'
import { getAuthBrandingFn } from '#/lib/cms/public-marketing-fns'
import { noindexHead } from '#/lib/seo'

export const Route = createFileRoute('/forgot-password')({
  ...AUTH_PAGE_CACHE,
  headers: () => AUTH_PAGE_HEADERS,
  head: ({ matches }) => noindexHead('Reset password', matches),
  loader: () => getAuthBrandingFn(),
  validateSearch: (search: Record<string, unknown>) =>
    search.reason === 'link_expired' ? { reason: 'link_expired' } : {},
  beforeLoad: async () => {
    const href = await getSignedInRedirectHrefFn({ data: {} })
    if (href) {
      throw redirect({ href, headers: AUTH_PAGE_HEADERS })
    }
  },
  component: ForgotPasswordPage,
})

function ForgotPasswordPage() {
  const marketing = Route.useLoaderData()
  const { reason } = Route.useSearch()
  const navigate = useNavigate()
  const requestReset = useServerFn(requestPasswordResetFn)
  const { error, pending, run } = useAuthSubmit()
  const rateLimited =
    error.toLowerCase().includes('too many') ||
    error.toLowerCase().includes('wait')

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const form = new FormData(event.currentTarget)
    const email = String(form.get('email') ?? '')

    await run(async (mounted) => {
      await requestReset({ data: { email } })
      if (mounted()) {
        await navigate({
          to: '/check-email',
          search: { email, flow: 'reset' },
        })
      }
    })
  }

  const shell = (title: string, description: string, body: ReactNode) => (
    <MarketingAuthLayout
      marketing={marketing}
      title={title}
      description={description}
    >
      {body}
    </MarketingAuthLayout>
  )

  if (reason === 'link_expired') {
    return shell(
      'Forgot password',
      'We will email a reset link if that address is on file.',
      <AuthLinkExpiredPanel />,
    )
  }

  if (rateLimited) {
    return shell(
      'Forgot password',
      'We will email a reset link if that address is on file.',
      <AuthRateLimitedPanel />,
    )
  }

  return shell(
    'Forgot password',
    'We will email a reset link if that address is on file.',
    <>
      <form method="post" onSubmit={onSubmit} className="grid gap-[18px]">
        <AuthTextField
          id="email"
          name="email"
          label="Email"
          type="email"
          autoComplete="username"
          placeholder="you@example.com"
          invalid={Boolean(error)}
        />
        <AuthFormError message={error} />
        <AuthSubmitButton pending={pending} pendingLabel="Sending link…">
          Send reset link
        </AuthSubmitButton>
      </form>
      <AuthFooterLink>
        <Link to="/login" className="marketing-auth-link">
          Back to sign in
        </Link>
      </AuthFooterLink>
    </>,
  )
}
