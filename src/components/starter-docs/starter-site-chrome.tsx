import { Link } from '@tanstack/react-router'
import { useEffect, useState, type ReactNode } from 'react'

import { AuthBrandMark } from '#/components/auth/auth-brand-mark'
import { SkipLink } from '#/components/a11y/skip-link'
import { MAIN_CONTENT_ID } from '#/components/a11y/skip-link'
import { useMarketingRevealInit } from '#/components/marketing/reveal'
import {
  normalizePublicMarketing,
  type PublicMarketing,
} from '#/lib/cms/public-marketing'
import '#/styles/starter-docs.css'

export function StarterFeaturesShell({
  marketing,
  children,
  currentPath,
}: {
  marketing: PublicMarketing
  children: ReactNode
  currentPath: '/features' | '/features/api-and-mcp'
}) {
  const { siteName } = normalizePublicMarketing(marketing)
  const [navScrolled, setNavScrolled] = useState(false)
  useMarketingRevealInit()

  useEffect(() => {
    function onScroll() {
      setNavScrolled(window.scrollY > 8)
    }
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  const year = new Date().getFullYear()

  return (
    <div className="starter-surface flex min-h-dvh flex-col">
      <SkipLink />
      <header className={`starter-nav${navScrolled ? ' is-scrolled' : ''}`}>
        <div className="starter-nav-inner">
          <Link
            to="/"
            className="flex min-w-0 items-center gap-2.5 font-semibold text-[15px]"
          >
            <AuthBrandMark siteName={siteName} size="nav" />
            <span className="tracking-tight">{siteName}</span>
          </Link>
          <nav className="starter-nav-links" aria-label="Primary">
            <Link
              to="/features"
              aria-current={currentPath === '/features' ? 'page' : undefined}
            >
              Features
            </Link>
            <Link to="/docs">Docs</Link>
            <Link to="/blog">Blog</Link>
            <Link to="/contact">Contact</Link>
          </nav>
          <div className="starter-nav-actions">
            <Link to="/login" className="starter-btn starter-btn-ghost">
              Sign in
            </Link>
            <Link
              to="/docs/$slug"
              params={{ slug: 'getting-started' }}
              className="starter-btn starter-btn-primary starter-btn-sm"
            >
              Get started
            </Link>
          </div>
        </div>
      </header>
      <main
        id={MAIN_CONTENT_ID}
        tabIndex={-1}
        className="flex flex-1 flex-col outline-none"
      >
        {children}
      </main>
      <footer className="starter-footer">
        <div className="starter-wrap starter-footer-inner">
          <p>
            © {year} {siteName}
          </p>
          <nav className="starter-footer-links" aria-label="Footer">
            <Link to="/features">Features</Link>
            <Link to="/docs">Docs</Link>
            <Link to="/blog">Blog</Link>
            <Link to="/contact">Contact</Link>
            <Link to="/login">Sign in</Link>
          </nav>
        </div>
      </footer>
    </div>
  )
}
