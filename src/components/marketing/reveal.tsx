import {
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type ReactNode,
} from 'react'

import { cn } from '@/lib/utils'

type RevealVariant = 'up' | 'left' | 'right'

export function useMarketingRevealInit() {
  useEffect(() => {
    const reduced = window.matchMedia(
      '(prefers-reduced-motion: reduce)',
    ).matches
    if (reduced) {
      return
    }
    document.documentElement.classList.add('marketing-reveal-init')
    return () => {
      document.documentElement.classList.remove('marketing-reveal-init')
    }
  }, [])
}

export function Reveal({
  children,
  i = 0,
  variant = 'up',
  className,
}: {
  children: ReactNode
  i?: number
  variant?: RevealVariant
  className?: string
}) {
  const ref = useRef<HTMLDivElement>(null)
  const [revealed, setRevealed] = useState(
    () =>
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches,
  )

  useEffect(() => {
    if (revealed) {
      return
    }
    const el = ref.current
    if (!el) {
      return
    }
    const reduced = window.matchMedia(
      '(prefers-reduced-motion: reduce)',
    ).matches
    if (reduced) {
      setRevealed(true)
      return
    }
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) {
          setRevealed(true)
          observer.disconnect()
        }
      },
      { threshold: 0.16, rootMargin: '0px 0px -6% 0px' },
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [revealed])

  return (
    <div
      ref={ref}
      className={cn(
        'marketing-reveal',
        variant === 'left' && 'marketing-reveal-from-left',
        variant === 'right' && 'marketing-reveal-from-right',
        revealed && 'is-revealed',
        className,
      )}
      style={{ '--reveal-delay': `${i * 80}ms` } as CSSProperties}
    >
      {children}
    </div>
  )
}
