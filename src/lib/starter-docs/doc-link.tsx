import { Link } from '@tanstack/react-router'
import type { ReactNode } from 'react'

export function StarterDocLink({
  path,
  className,
  children,
  onClick,
}: {
  path: string
  className?: string
  children: ReactNode
  onClick?: () => void
}) {
  if (path === '/docs') {
    return (
      <Link to="/docs" className={className} onClick={onClick}>
        {children}
      </Link>
    )
  }
  if (path.startsWith('/docs/')) {
    const slug = path.slice('/docs/'.length)
    return (
      <Link
        to="/docs/$slug"
        params={{ slug }}
        className={className}
        onClick={onClick}
      >
        {children}
      </Link>
    )
  }
  return (
    <a href={path} className={className} onClick={onClick}>
      {children}
    </a>
  )
}
