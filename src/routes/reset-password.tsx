import { createFileRoute, Link } from '@tanstack/react-router'
import { useServerFn } from '@tanstack/react-start'
import { type FormEvent, useState } from 'react'

import { AUTH_PAGE_CACHE, AUTH_PAGE_HEADERS, updatePasswordFn } from '#/auth'
import {
  AuthFooterLink,
  AuthFormError,
  AuthPasswordField,
  AuthSubmitButton,
} from '#/components/auth/auth-fields'
import { MarketingAuthLayout } from '#/components/marketing/marketing-auth-layout'
import { useAuthSubmit } from '#/components/auth/use-auth-submit'
import { getAuthBrandingFn } from '#/lib/cms/public-marketing-fns'
import { noindexHead } from '#/lib/seo'

export const Route = createFileRoute('/reset-password')({
  ...AUTH_PAGE_CACHE,
  head: ({ matches }) => noindexHead('Reset password', matches),
  headers: () => AUTH_PAGE_HEADERS,
  loader: () => getAuthBrandingFn(),
  component: ResetPasswordPage,
})

const MISMATCH_ERROR = 'Passwords do not match'

function ResetPasswordPage() {
  const marketing = Route.useLoaderData()
  const updatePassword = useServerFn(updatePasswordFn)
  const { error, pending, run, setError } = useAuthSubmit()
  const [password, setPassword] = useState('')
  const mismatch = error === MISMATCH_ERROR

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const form = new FormData(event.currentTarget)
    const nextPassword = String(form.get('password') ?? '')
    const confirm = String(form.get('confirm') ?? '')

    if (nextPassword !== confirm) {
      setError(MISMATCH_ERROR)
      return
    }

    await run(async () => {
      const result = await updatePassword({ data: { password: nextPassword } })
      return result?.error
    })
  }

  return (
    <MarketingAuthLayout
      marketing={marketing}
      title="Set a new password"
      description="Choose a password you have not used here before."
    >
      <form method="post" onSubmit={onSubmit} className="grid gap-[18px]">
        <AuthPasswordField
          id="password"
          name="password"
          label="New password"
          autoComplete="new-password"
          placeholder="At least 8 characters"
          invalid={Boolean(error) && !mismatch}
          showStrength
          password={password}
          onPasswordChange={setPassword}
        />
        <AuthPasswordField
          id="confirm"
          name="confirm"
          label="Confirm password"
          autoComplete="new-password"
          placeholder="Repeat your password"
          invalid={mismatch}
          fieldError={mismatch ? error : undefined}
        />
        <AuthFormError message={mismatch ? '' : error} />
        <AuthSubmitButton pending={pending} pendingLabel="Updating…">
          Update password
        </AuthSubmitButton>
      </form>
      <AuthFooterLink>
        <Link to="/login" className="marketing-auth-link">
          Back to sign in
        </Link>
      </AuthFooterLink>
    </MarketingAuthLayout>
  )
}
