import { cn } from '@/lib/utils'

export function AuthBrandMark({
  siteName,
  size = 'form',
  surface = 'default',
  className,
}: {
  siteName: string
  size?: 'aside' | 'form' | 'nav'
  surface?: 'default' | 'inverse' | 'brand' | 'solid'
  className?: string
}) {
  const initial = siteName.trim().charAt(0).toUpperCase() || 'A'
  const sizes = {
    aside: 'size-9 rounded-[10px] text-sm',
    form: 'size-10 rounded-[11px] text-[15px]',
    nav: 'size-7 rounded-lg text-[11px]',
  }
  const surfaces = {
    default: 'border border-border bg-card font-bold text-foreground',
    inverse: 'border border-white/20 bg-[#f7f6f3] font-bold text-[#111111]',
    solid: 'border-0 bg-foreground font-bold text-background',
    brand:
      'border-0 bg-[var(--brand)] font-bold text-[var(--brand-foreground)]',
  }
  return (
    <span
      className={cn(
        'inline-flex shrink-0 items-center justify-center',
        sizes[size],
        surfaces[surface],
        className,
      )}
      aria-hidden
    >
      {initial}
    </span>
  )
}
