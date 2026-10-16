import type { ReactNode } from 'react'
import { Link } from '@tanstack/react-router'

import { cn } from '@/lib/utils'

export function AuthErrorState({
  title,
  description,
  primaryAction,
  secondaryAction,
  className,
}: {
  title: string
  description: string
  primaryAction?: ReactNode
  secondaryAction?: ReactNode
  className?: string
}) {
  return (
    <div className={cn('marketing-auth-error-panel', className)} role="alert">
      <h2 className="text-lg font-semibold tracking-tight">{title}</h2>
      <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
        {description}
      </p>
      {primaryAction || secondaryAction ? (
        <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:justify-center">
          {primaryAction}
          {secondaryAction}
        </div>
      ) : null}
    </div>
  )
}

export function AuthGenericErrorPanel() {
  return (
    <AuthErrorState
      title="Sign-in link failed"
      description="The link may have expired or already been used. Try signing in with your password instead."
      primaryAction={
        <Link to="/login" className="marketing-auth-submit">
          Back to sign in
        </Link>
      }
    />
  )
}

export function AuthLinkExpiredPanel() {
  return (
    <AuthErrorState
      title="This reset link expired"
      description="Request a new link from the forgot password page."
      primaryAction={
        <Link to="/forgot-password" className="marketing-auth-submit">
          Request new link
        </Link>
      }
    />
  )
}

export function AuthRateLimitedPanel() {
  return (
    <AuthErrorState
      title="Too many attempts"
      description="Wait a few minutes, then try again."
      primaryAction={
        <Link to="/forgot-password" className="marketing-auth-submit secondary">
          Forgot password
        </Link>
      }
    />
  )
}
