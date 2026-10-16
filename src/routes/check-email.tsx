import { createFileRoute, Link } from '@tanstack/react-router'
import { useServerFn } from '@tanstack/react-start'
import { useState } from 'react'

import { AUTH_PAGE_CACHE, AUTH_PAGE_HEADERS, resendAuthEmailFn } from '#/auth'
import { AuthAlert } from '#/components/auth/auth-alert'
import { AuthFooterLink, AuthSubmitButton } from '#/components/auth/auth-fields'
import { MarketingAuthLayout } from '#/components/marketing/marketing-auth-layout'
import { getAuthBrandingFn } from '#/lib/cms/public-marketing-fns'
import { noindexHead } from '#/lib/seo'

export const Route = createFileRoute('/check-email')({
  ...AUTH_PAGE_CACHE,
  headers: () => AUTH_PAGE_HEADERS,
  head: ({ matches }) => noindexHead('Check your email', matches),
  validateSearch: (
    search: Record<string, unknown>,
  ): { email?: string; flow?: 'reset' | 'signup' } => {
    const email =
      typeof search.email === 'string' && search.email.length <= 255
        ? search.email
        : undefined
    const flow = search.flow === 'reset' ? 'reset' : 'signup'
    return { email, flow }
  },
  loader: () => getAuthBrandingFn(),
  component: CheckEmailPage,
})

function CheckEmailPage() {
  const marketing = Route.useLoaderData()
  const { email, flow } = Route.useSearch()
  const resend = useServerFn(resendAuthEmailFn)
  const [pending, setPending] = useState(false)
  const [note, setNote] = useState('')

  async function onResend() {
    if (!email) {
      return
    }
    setPending(true)
    setNote('')
    try {
      const result = await resend({ data: { email, flow } })
      if (result?.error) {
        setNote(result.error)
      } else {
        setNote('If that address can receive mail, we sent another message.')
      }
    } finally {
      setPending(false)
    }
  }

  return (
    <MarketingAuthLayout
      marketing={marketing}
      icon="envelope"
      title="Check your email"
      description={
        email ? (
          <>
            We sent a link to{' '}
            <strong className="font-medium text-foreground">{email}</strong>.
            Open it to continue.
          </>
        ) : (
          'We sent a link to your inbox. Open it to continue.'
        )
      }
    >
      <AuthAlert tone="info" title="Link expires in 24 hours" className="mb-5">
        Did not get it? Check spam, or resend below.
      </AuthAlert>
      {email ? (
        <div className="grid gap-3">
          <AuthSubmitButton
            type="button"
            variant="secondary"
            pending={pending}
            pendingLabel="Sending…"
            onClick={() => void onResend()}
          >
            Resend email
          </AuthSubmitButton>
          {note ? (
            <p
              className="text-center text-sm text-muted-foreground"
              role="status"
            >
              {note}
            </p>
          ) : null}
        </div>
      ) : null}
      <AuthFooterLink>
        <Link to="/login" className="marketing-auth-link">
          Back to sign in
        </Link>
      </AuthFooterLink>
    </MarketingAuthLayout>
  )
}
