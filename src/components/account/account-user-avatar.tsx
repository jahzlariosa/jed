import { cn } from '@/lib/utils'

import { profileInitials } from '#/lib/account/account-initials'
import { sanitizeAvatarUrl } from '#/lib/url-security'

export function AccountUserAvatar({
  avatarUrl,
  displayName,
  email,
  size = 'lg',
  dimmed,
  className,
}: {
  avatarUrl: string | null
  displayName: string | null
  email: string | null
  size?: 'sm' | 'lg'
  dimmed?: boolean
  className?: string
}) {
  const initials = profileInitials({ displayName, email })
  const sizeClass =
    size === 'lg' ? 'account-avatar-lg text-2xl' : 'size-9 text-xs'

  const safeAvatarUrl = sanitizeAvatarUrl(avatarUrl)

  if (safeAvatarUrl) {
    return (
      <img
        src={safeAvatarUrl}
        alt=""
        className={cn(
          'rounded-full object-cover',
          sizeClass,
          dimmed && 'opacity-50',
          className,
        )}
      />
    )
  }

  return (
    <span
      className={cn(
        'inline-flex items-center justify-center rounded-full bg-primary/10 font-semibold text-primary',
        sizeClass,
        dimmed && 'opacity-50',
        className,
      )}
      aria-hidden
    >
      {initials}
    </span>
  )
}
