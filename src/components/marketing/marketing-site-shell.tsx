import { List, MagnifyingGlass } from '@phosphor-icons/react'
import { Link, useRouterState } from '@tanstack/react-router'
import { useState, type CSSProperties, type ReactNode } from 'react'

import { AuthBrandMark } from '#/components/auth/auth-brand-mark'
import { MarketingNavSession } from '#/components/marketing/marketing-nav-session'
import { MarketingThemeToggle } from '#/components/marketing/marketing-theme-toggle'
import { useMarketingRevealInit } from '#/components/marketing/reveal'
import {
  DocsSearchDialog,
  useDocsSearchShortcut,
} from '#/components/starter-docs/docs-search-dialog'
import { SkipLink } from '#/components/a11y/skip-link'
import { applyMarketingBrandCss } from '#/lib/cms/brand'
import {
  normalizePublicMarketing,
  type PublicMarketing,
} from '#/lib/cms/public-marketing'
import { phosphorIcon } from '#/lib/icon'
import '#/styles/marketing-home.css'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

export type MarketingNavKey = 'home' | 'docs' | 'features' | 'blog' | 'contact'

export function MarketingSiteShell({
  marketing,
  children,
  activeNav,
  onSearchOpen,
}: {
  marketing: PublicMarketing
  children: ReactNode
  activeNav?: MarketingNavKey
  onSearchOpen?: () => void
  searchQuery?: string
}) {
  const { siteName, brandHex } = normalizePublicMarketing(marketing)
  const brandStyle = applyMarketingBrandCss(brandHex) as CSSProperties
  const pathname = useRouterState({
    select: (state) => state.location.pathname,
  })

  useMarketingRevealInit()

  const resolvedNav = activeNav ?? navKeyFromPath(pathname)

  const [paletteOpen, setPaletteOpen] = useState(false)
  useDocsSearchShortcut(() => {
    if (!onSearchOpen) {
      setPaletteOpen(true)
    }
  })
  const openSearch = onSearchOpen ?? (() => setPaletteOpen(true))

  const year = new Date().getFullYear()

  return (
    <div
      className="amianan-marketing flex min-h-dvh flex-col bg-background text-foreground"
      style={brandStyle}
    >
      <SkipLink />
      <header className="marketing-header">
        <div className="marketing-header-inner">
          <Link
            to="/"
            className="flex min-w-0 items-center gap-2 font-semibold text-sm tracking-tight"
          >
            <AuthBrandMark siteName={siteName} size="nav" surface="solid" />
            <span className="truncate">{siteName}</span>
          </Link>
          <nav className="marketing-nav-links" aria-label="Primary">
            <NavLink to="/" active={resolvedNav === 'home'}>
              Home
            </NavLink>
            <NavLink to="/docs" active={resolvedNav === 'docs'}>
              Docs
            </NavLink>
            <NavLink to="/features" active={resolvedNav === 'features'}>
              Features
            </NavLink>
            <NavLink to="/blog" active={resolvedNav === 'blog'}>
              Blog
            </NavLink>
            <NavLink to="/contact" active={resolvedNav === 'contact'}>
              Contact
            </NavLink>
          </nav>
          <div className="flex-1" />
          <div className="flex items-center gap-2">
            <button
              type="button"
              className="marketing-search-chip"
              onClick={openSearch}
            >
              <MagnifyingGlass {...phosphorIcon} size={14} />
              <span>Search docs...</span>
              <kbd>⌘K</kbd>
            </button>
            <MarketingThemeToggle />
            <MarketingNavSession className="flex items-center gap-2" />
            <button
              type="button"
              className="marketing-icon-btn marketing-icon-btn-mobile"
              aria-label="Search"
              onClick={openSearch}
            >
              <MagnifyingGlass {...phosphorIcon} size={16} />
            </button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  type="button"
                  className="marketing-icon-btn marketing-menu-btn"
                  aria-label="Open menu"
                >
                  <List {...phosphorIcon} size={16} />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="min-w-44 rounded-xl">
                <DropdownMenuItem asChild>
                  <Link to="/">Home</Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link to="/docs">Docs</Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link to="/features">Features</Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link to="/blog">Blog</Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link to="/contact">Contact</Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link to="/login">Sign in</Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link to="/signup">Get started</Link>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </header>
      <div className="flex flex-1 flex-col">{children}</div>
      {onSearchOpen ? null : (
        <DocsSearchDialog open={paletteOpen} onOpenChange={setPaletteOpen} />
      )}
      <footer className="marketing-wrap marketing-wrap-wide">
        <div className="marketing-footer-grid">
          <div>
            <div className="marketing-footer-brand">{siteName}</div>
            <p className="marketing-footer-blurb">
              A reusable base for branded client sites: auth, admin, content,
              and a versioned API with MCP.
            </p>
          </div>
          <div className="marketing-footer-col">
            <h4>Product</h4>
            <ul>
              <li>
                <Link to="/features">Features</Link>
              </li>
              <li>
                <Link to="/docs">Docs</Link>
              </li>
              <li>
                <Link to="/blog">Blog</Link>
              </li>
            </ul>
          </div>
          <div className="marketing-footer-col">
            <h4>Resources</h4>
            <ul>
              <li>
                <Link to="/docs/$slug" params={{ slug: 'api' }}>
                  API reference
                </Link>
              </li>
              <li>
                <Link to="/docs/$slug" params={{ slug: 'mcp' }}>
                  MCP guide
                </Link>
              </li>
              <li>
                <Link to="/docs/$slug" params={{ slug: 'sql-templates' }}>
                  SQL templates
                </Link>
              </li>
            </ul>
          </div>
          <div className="marketing-footer-col">
            <h4>Account</h4>
            <ul>
              <li>
                <Link to="/login">Sign in</Link>
              </li>
              <li>
                <Link to="/contact">Contact</Link>
              </li>
            </ul>
          </div>
        </div>
        <div className="marketing-footer-bottom">
          <span>{siteName}</span>
          <span>© {year}</span>
        </div>
      </footer>
    </div>
  )
}

function NavLink({
  to,
  active,
  children,
}: {
  to: string
  active: boolean
  children: ReactNode
}) {
  return (
    <Link to={to} aria-current={active ? 'page' : undefined}>
      {children}
    </Link>
  )
}

function navKeyFromPath(pathname: string): MarketingNavKey | undefined {
  if (pathname === '/') {
    return 'home'
  }
  if (pathname.startsWith('/docs')) {
    return 'docs'
  }
  if (pathname.startsWith('/features')) {
    return 'features'
  }
  if (pathname.startsWith('/blog')) {
    return 'blog'
  }
  if (pathname.startsWith('/contact')) {
    return 'contact'
  }
  return undefined
}
