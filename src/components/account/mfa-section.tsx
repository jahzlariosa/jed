import { useRouter } from '@tanstack/react-router'
import { useServerFn } from '@tanstack/react-start'
import { useEffect, useState } from 'react'

import {
  enrollMfaTotpFn,
  listMfaFactorsFn,
  unenrollMfaFactorFn,
  verifyMfaEnrollmentFn,
} from '#/auth/mfa-fns'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { APP_SHELL_CACHE_KEY } from '#/auth'
import { appToast } from '#/lib/app-toast'
import { clearFetchCache } from '#/lib/deduped-fetch'

export function MfaSection() {
  const router = useRouter()
  const listFactors = useServerFn(listMfaFactorsFn)
  const enroll = useServerFn(enrollMfaTotpFn)
  const verify = useServerFn(verifyMfaEnrollmentFn)
  const unenroll = useServerFn(unenrollMfaFactorFn)

  const [verified, setVerified] = useState<
    Array<{ id: string; friendlyName?: string | null }>
  >([])
  const [enrollmentAllowed, setEnrollmentAllowed] = useState(true)
  const [pending, setPending] = useState(false)
  const [error, setError] = useState('')
  const [enrollState, setEnrollState] = useState<{
    factorId: string
    qrCode: string
    secret: string
  } | null>(null)
  const [code, setCode] = useState('')

  useEffect(() => {
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
  }, [listFactors])

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
      const data = await listFactors()
      setVerified(data.verified)
      appToast.success('Authenticator enabled.')
    }
    setPending(false)
  }

  async function onRemove(factorId: string) {
    setPending(true)
    setError('')
    const result = await unenroll({ data: { factorId } })
    if (result.error) {
      setError(result.error)
    } else {
      await router.invalidate()
      const data = await listFactors()
      setVerified(data.verified)
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

  const active = verified[0]

  if (!enrollmentAllowed) {
    return (
      <p className="text-sm text-muted-foreground">
        Authenticator setup is turned off in site settings.
      </p>
    )
  }

  return (
    <div className="grid gap-4">
      <p className="text-sm text-muted-foreground">
        Add an authenticator app for a second sign-in step when your site policy
        requires it.
      </p>
      {error ? (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      ) : null}
      {active ? (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-md border border-border px-4 py-3">
          <div>
            <p className="text-sm font-medium">Authenticator app</p>
            <p className="text-xs text-muted-foreground">Status: active</p>
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={pending}
            onClick={() => void onRemove(active.id)}
          >
            Remove
          </Button>
        </div>
      ) : enrollState ? (
        <div className="grid gap-4 rounded-md border border-border p-4">
          {enrollState.qrCode ? (
            <img
              src={enrollState.qrCode}
              alt="Authenticator QR code"
              className="mx-auto size-40 rounded-md border border-border bg-white p-2"
            />
          ) : null}
          <div className="flex flex-wrap items-center justify-center gap-2">
            <p className="font-mono text-xs text-muted-foreground">
              {enrollState.secret}
            </p>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => void onCopySecret()}
            >
              Copy secret
            </Button>
          </div>
          <div>
            <Label htmlFor="mfa-code">6-digit code</Label>
            <Input
              id="mfa-code"
              inputMode="numeric"
              autoComplete="one-time-code"
              maxLength={6}
              value={code}
              onChange={(event) => setCode(event.target.value)}
              className="mt-1 max-w-[12rem] font-mono"
            />
          </div>
          <div className="flex gap-2">
            <Button
              type="button"
              size="sm"
              disabled={pending || code.length < 6}
              onClick={() => void onVerify()}
            >
              Verify and enable
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              disabled={pending}
              onClick={() => setEnrollState(null)}
            >
              Cancel
            </Button>
          </div>
        </div>
      ) : (
        <Button
          type="button"
          size="sm"
          disabled={pending}
          onClick={() => void onStartEnroll()}
        >
          Set up authenticator
        </Button>
      )}
    </div>
  )
}
