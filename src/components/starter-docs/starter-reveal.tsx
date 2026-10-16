import {
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type ReactNode,
} from 'react'

import { cn } from '@/lib/utils'

type Variant = 'up' | 'left' | 'right'

export function StarterReveal({
  children,
  i = 0,
  variant = 'up',
  className,
}: {
  children: ReactNode
  i?: number
  variant?: Variant
  className?: string
}) {
  const ref = useRef<HTMLDivElement>(null)
  const [revealed, setRevealed] = useState(() => {
    if (typeof window === 'undefined') {
      return false
    }
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches
  })

  useEffect(() => {
    const node = ref.current
    if (!node) {
      return
    }
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setRevealed(true)
      return
    }
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          setRevealed(true)
          observer.disconnect()
        }
      },
      { threshold: 0.16 },
    )
    observer.observe(node)
    return () => observer.disconnect()
  }, [])

  const style = { '--rv-i': i } as CSSProperties

  return (
    <div
      ref={ref}
      style={style}
      className={cn(
        variant === 'left' && 'starter-rv starter-rv-left',
        variant === 'right' && 'starter-rv starter-rv-right',
        variant === 'up' && 'starter-rv',
        revealed && 'in',
        className,
      )}
    >
      {children}
    </div>
  )
}
