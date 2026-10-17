import { Copy, ShieldCheck } from '@phosphor-icons/react'
import { useRouter } from '@tanstack/react-router'
import { useServerFn } from '@tanstack/react-start'
import { useEffect, useState, type FormEvent } from 'react'

import {
  enrollMfaTotpFn,
  listMfaFactorsFn,
  unenrollMfaFactorFn,
  verifyMfaEnrollmentFn,
} from '#/auth/mfa-fns'
import { APP_SHELL_CACHE_KEY } from '#/auth'
import { AuthAlert } from '#/components/auth/auth-alert'
import {
  AUTH_ERROR_ID,
  AuthFormError,
  AuthSubmitButton,
} from '#/components/auth/auth-fields'
import { AuthOtpInput } from '#/components/auth/auth-otp-input'
import { appToast } from '#/lib/app-toast'
import { clearFetchCache } from '#/lib/deduped-fetch'
import { phosphorIcon } from '#/lib/icon'

export function AuthMfaSetup() {
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

  async function onVerify(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
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
      <AuthAlert tone="info" title="Authenticator setup is turned off">
        A site admin can turn it on in site settings.
      </AuthAlert>
    )
  }

  if (active) {
    return (
      <div className="grid gap-5">
        <div className="marketing-auth-factor">
          <ShieldCheck {...phosphorIcon} size={20} aria-hidden />
          <div className="min-w-0">
            <p className="marketing-auth-factor-title">Authenticator app</p>
            <p className="marketing-auth-factor-meta">Active</p>
          </div>
        </div>
        <AuthFormError message={error} />
        <AuthSubmitButton
          type="button"
          variant="secondary"
          pending={pending}
          pendingLabel="Removing."
          onClick={() => void onRemove(active.id)}
        >
          Remove authenticator
        </AuthSubmitButton>
      </div>
    )
  }

  if (enrollState) {
    return (
      <form method="post" onSubmit={onVerify} className="grid gap-5">
        <div className="grid gap-3">
          <p className="marketing-auth-step">1. Scan this code in your app</p>
          {enrollState.qrCode ? (
            <img
              src={enrollState.qrCode}
              alt="Authenticator QR code"
              width={176}
              height={176}
              className="marketing-auth-qr"
            />
          ) : null}
          <p className="marketing-auth-step-hint">
            Can't scan it? Enter this key instead.
          </p>
          <div className="marketing-auth-secret">
            <code>{enrollState.secret}</code>
            <button
              type="button"
              aria-label="Copy secret"
              onClick={() => void onCopySecret()}
            >
              <Copy {...phosphorIcon} size={16} aria-hidden />
            </button>
          </div>
        </div>
        <div className="grid gap-3">
          <p className="marketing-auth-step">2. Enter the 6-digit code</p>
          <AuthOtpInput
            id="mfa-setup-code"
            value={code}
            onChange={setCode}
            invalid={Boolean(error)}
            aria-describedby={error ? AUTH_ERROR_ID : undefined}
          />
        </div>
        <AuthFormError message={error} />
        <div className="grid gap-2.5">
          <AuthSubmitButton
            pending={pending}
            pendingLabel="Verifying."
            disabled={code.length < 6}
          >
            Verify and turn on
          </AuthSubmitButton>
          <AuthSubmitButton
            type="button"
            variant="secondary"
            pending={false}
            disabled={pending}
            onClick={() => setEnrollState(null)}
          >
            Cancel
          </AuthSubmitButton>
        </div>
      </form>
    )
  }

  return (
    <div className="grid gap-5">
      <AuthFormError message={error} />
      <AuthSubmitButton
        type="button"
        pending={pending}
        pendingLabel="Preparing."
        onClick={() => void onStartEnroll()}
      >
        Set up authenticator
      </AuthSubmitButton>
    </div>
  )
}
