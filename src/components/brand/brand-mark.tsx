import { cn } from '@/lib/utils'

export function BrandMark({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        'inline-flex size-8 items-center justify-center text-current',
        className,
      )}
      aria-hidden="true"
    >
      <svg
        viewBox="0 0 24 24"
        className="size-[18px]"
        fill="none"
        aria-hidden="true"
      >
        <path
          d="M2 9.5c3.2 2.6 6.4 2.6 9.6 0s6.4-2.6 9.6 0"
          stroke="currentColor"
          strokeLinecap="round"
        />
        <path
          d="M2 14.5c3.2 2.6 6.4 2.6 9.6 0s6.4-2.6 9.6 0"
          stroke="currentColor"
          strokeLinecap="round"
        />
      </svg>
    </span>
  )
}

export function BrandWordmark({ className }: { className?: string }) {
  return (
    <span className={cn('inline-flex items-center gap-2', className)}>
      <BrandMark />
      <span className="font-display text-sm tracking-tight">JED</span>
    </span>
  )
}
