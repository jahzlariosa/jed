import { DeviceMobile, ShieldCheck } from '@phosphor-icons/react'
import { useRouter } from '@tanstack/react-router'
import { useServerFn } from '@tanstack/react-start'
import { useEffect, useState } from 'react'

import {
  enrollMfaTotpFn,
  listMfaFactorsFn,
  unenrollMfaFactorFn,
  verifyMfaEnrollmentFn,
} from '#/auth/mfa-fns'
import { phosphorIcon } from '#/lib/icon'
import { AccountCard } from '#/components/account/account-confirm-dialog'
import { AccountConfirmDialog } from '#/components/account/account-confirm-dialog'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { APP_SHELL_CACHE_KEY } from '#/auth'
import { appToast } from '#/lib/app-toast'
import { clearFetchCache } from '#/lib/deduped-fetch'

type VerifiedFactor = {
  id: string
  friendlyName?: string | null
  createdAt: string | null
}

export function AccountMfaSection({
  showEnrollmentUi,
}: {
  showEnrollmentUi: boolean
}) {
  const router = useRouter()
  const listFactors = useServerFn(listMfaFactorsFn)
  const enroll = useServerFn(enrollMfaTotpFn)
  const verify = useServerFn(verifyMfaEnrollmentFn)
  const unenroll = useServerFn(unenrollMfaFactorFn)

  const [verified, setVerified] = useState<VerifiedFactor[]>([])
  const [enrollmentAllowed, setEnrollmentAllowed] = useState(true)
  const [pending, setPending] = useState(false)
  const [error, setError] = useState('')
  const [enrollState, setEnrollState] = useState<{
    factorId: string
    qrCode: string
    secret: string
  } | null>(null)
  const [code, setCode] = useState('')
  const [removeId, setRemoveId] = useState<string | null>(null)

  useEffect(() => {
    if (!showEnrollmentUi) {
      return
    }
    let cancelled = false
    void listFactors().then((data) => {
      if (!cancelled) {
        setVerified(data.verified)
        setEnrollmentAllowed(data.enrollmentAllowed)
      }
    })
    return () => {
      cancelled = true
    }
  }, [listFactors, showEnrollmentUi])

  async function refreshFactors() {
    const data = await listFactors()
    setVerified(data.verified)
    setEnrollmentAllowed(data.enrollmentAllowed)
  }

  async function onStartEnroll() {
    setPending(true)
    setError('')
    const result = await enroll()
    if ('error' in result && result.error) {
      setError(result.error)
    } else if ('factorId' in result) {
      setEnrollState({
        factorId: result.factorId,
        qrCode: result.qrCode,
        secret: result.secret,
      })
    }
    setPending(false)
  }

  async function onVerify() {
    if (!enrollState) {
      return
    }
    setPending(true)
    setError('')
    const result = await verify({
      data: { factorId: enrollState.factorId, code },
    })
    if (result.error) {
      setError(result.error)
    } else {
      clearFetchCache(APP_SHELL_CACHE_KEY)
      setEnrollState(null)
      setCode('')
      await router.invalidate()
      await refreshFactors()
      appToast.success('Two-factor enabled.')
    }
    setPending(false)
  }

  async function onRemove() {
    if (!removeId) {
      return
    }
    setPending(true)
    setError('')
    const result = await unenroll({ data: { factorId: removeId } })
    if (result.error) {
      setError(result.error)
    } else {
      setRemoveId(null)
      await router.invalidate()
      await refreshFactors()
      appToast.success('Authenticator removed.')
    }
    setPending(false)
  }

  async function onCopySecret() {
    if (!enrollState?.secret) {
      return
    }
    try {
      await navigator.clipboard.writeText(enrollState.secret)
      appToast.success('Secret copied.')
    } catch {
      appToast.error('Unable to copy secret.')
    }
  }

  if (!showEnrollmentUi) {
    return (
      <AccountCard id="two-factor" title="Two-factor">
        <p className="text-[16px] account-muted">
          Two-factor sign-in is turned off for this site.
        </p>
      </AccountCard>
    )
  }

  if (!enrollmentAllowed) {
    return (
      <AccountCard id="two-factor" title="Two-factor">
        <p className="text-[16px] account-muted">
          Authenticator setup is turned off in site settings.
        </p>
      </AccountCard>
    )
  }

  const dateFormat = new Intl.DateTimeFormat('en', { dateStyle: 'medium' })

  return (
    <AccountCard id="two-factor" title="Two-factor">
      {error ? (
        <p role="alert" className="text-[15px] text-destructive">
          {error}
        </p>
      ) : null}
      {verified.length > 0 && !enrollState ? (
        <ul className="account-field-gap grid">
          {verified.map((factor) => (
            <li
              key={factor.id}
              className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border px-4 py-3"
            >
              <div className="flex items-center gap-3">
                <ShieldCheck
                  {...phosphorIcon}
                  className="size-5 text-primary"
                />
                <div>
                  <p className="text-[16px] font-medium">
                    {factor.friendlyName ?? 'Authenticator app'}
                  </p>
                  <p className="text-[13px] account-muted">
                    Added{' '}
                    {factor.createdAt
                      ? dateFormat.format(new Date(factor.createdAt))
                      : 'recently'}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="secondary">Active</Badge>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="rounded-xl"
                  disabled={pending}
                  onClick={() => setRemoveId(factor.id)}
                >
                  Remove
                </Button>
              </div>
            </li>
          ))}
        </ul>
      ) : enrollState ? (
        <div className="account-field-gap grid md:grid-cols-[auto_1fr] md:items-start">
          {enrollState.qrCode ? (
            <img
              src={enrollState.qrCode}
              alt="Authenticator QR code"
              className="mx-auto size-44 rounded-xl border border-border bg-white p-3 md:mx-0"
            />
          ) : null}
          <div className="account-field-gap grid">
            <p className="text-[16px] account-muted">
              Scan the code with your authenticator app, or enter the secret
              manually.
            </p>
            <div className="flex flex-wrap items-center gap-2">
              <Input
                readOnly
                value={enrollState.secret}
                className="h-11 max-w-full flex-1 rounded-xl font-mono text-[14px]"
                aria-label="Authenticator secret"
              />
              <Button
                type="button"
                variant="outline"
                className="rounded-xl"
                onClick={() => void onCopySecret()}
              >
                Copy secret
              </Button>
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="mfa-code" className="account-label">
                6-digit code
              </Label>
              <Input
                id="mfa-code"
                inputMode="numeric"
                autoComplete="one-time-code"
                maxLength={6}
                value={code}
                onChange={(event) => setCode(event.target.value)}
                className="h-12 max-w-[12rem] rounded-xl font-mono text-[18px]"
              />
            </div>
            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                className="rounded-xl"
                disabled={pending || code.length < 6}
                onClick={() => void onVerify()}
              >
                Verify and enable
              </Button>
              <Button
                type="button"
                variant="outline"
                className="rounded-xl"
                disabled={pending}
                onClick={() => setEnrollState(null)}
              >
                Cancel
              </Button>
            </div>
          </div>
        </div>
      ) : (
        <div className="rounded-xl border border-dashed border-border px-6 py-10 text-center">
          <DeviceMobile
            {...phosphorIcon}
            className="mx-auto size-8 text-primary"
          />
          <p className="mt-4 text-[16px] account-muted">
            Add an authenticator app for a second sign-in step when your site
            policy requires it.
          </p>
          <Button
            type="button"
            className="mt-6 rounded-xl"
            disabled={pending}
            onClick={() => void onStartEnroll()}
          >
            Set up two-factor
          </Button>
        </div>
      )}
      <AccountConfirmDialog
        open={Boolean(removeId)}
        onOpenChange={(open) => !open && setRemoveId(null)}
        title="Remove authenticator?"
        description="You will not need an app code at sign in until you set one up again."
        primaryLabel="Remove"
        primaryVariant="destructive"
        secondaryLabel="Keep"
        pending={pending}
        onPrimary={onRemove}
      />
    </AccountCard>
  )
}
