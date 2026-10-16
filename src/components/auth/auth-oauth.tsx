import { useServerFn } from '@tanstack/react-start'

import { signInWithGoogleFn } from '#/auth/functions'
import { AuthEmailDivider } from '#/components/auth/auth-divider'
const googleEnabled = import.meta.env.VITE_AUTH_GOOGLE_ENABLED === 'true'

function GoogleMark() {
  return (
    <span
      className="grid size-[18px] place-items-center rounded border border-border bg-white text-[11px] font-bold text-[#ea4335]"
      aria-hidden
    >
      G
    </span>
  )
}

export function AuthGoogleSection({
  redirectTo,
  pending,
}: {
  redirectTo?: string
  pending: boolean
}) {
  const signInWithGoogle = useServerFn(signInWithGoogleFn)

  if (!googleEnabled) {
    return null
  }

  async function onGoogle() {
    await signInWithGoogle({ data: { redirectTo } })
  }

  return (
    <div className="grid gap-0">
      <button
        type="button"
        className="marketing-auth-google"
        disabled={pending}
        onClick={() => void onGoogle()}
      >
        <GoogleMark />
        Continue with Google
      </button>
      <AuthEmailDivider />
    </div>
  )
}

export function AuthRememberRow({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-3 text-sm">
      {children}
    </div>
  )
}
