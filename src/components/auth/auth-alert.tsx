import type { ReactNode } from 'react'
import { CheckCircle, Info, WarningCircle } from '@phosphor-icons/react'

import { phosphorIcon } from '#/lib/icon'
import { cn } from '@/lib/utils'

type Tone = 'error' | 'success' | 'info' | 'warn'

const toneStyles: Record<
  Tone,
  { panel: string; icon: string; Icon: typeof WarningCircle }
> = {
  error: {
    panel: 'auth-alert-error border-[#fecaca] bg-[#fef2f2] text-[#991b1b]',
    icon: 'text-destructive',
    Icon: WarningCircle,
  },
  success: {
    panel: 'border-[#bbf7d0] bg-[var(--success-bg)] text-[#166534]',
    icon: 'text-[var(--success)]',
    Icon: CheckCircle,
  },
  info: {
    panel: 'border-[#c7d2fe] bg-[var(--brand-wash)] text-[var(--brand-ink)]',
    icon: 'text-[var(--brand)]',
    Icon: Info,
  },
  warn: {
    panel: 'border-[#fde68a] bg-[var(--warning-bg)] text-[#854d0e]',
    icon: 'text-[var(--warning)]',
    Icon: WarningCircle,
  },
}

export function AuthAlert({
  tone,
  title,
  children,
  className,
}: {
  tone: Tone
  title: string
  children?: ReactNode
  className?: string
}) {
  const styles = toneStyles[tone]
  const Icon = styles.Icon

  return (
    <div
      role={tone === 'error' ? 'alert' : 'status'}
      className={cn(
        'flex gap-2.5 rounded-[11px] border px-3.5 py-3 text-sm',
        styles.panel,
        className,
      )}
    >
      <Icon
        {...phosphorIcon}
        className={cn('mt-0.5 size-[18px] shrink-0', styles.icon)}
        aria-hidden
      />
      <div className="min-w-0">
        <p className="text-[13.5px] font-semibold">{title}</p>
        {children ? (
          <p className="mt-0.5 text-[13px] opacity-90">{children}</p>
        ) : null}
      </div>
    </div>
  )
}
