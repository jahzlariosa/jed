import { List } from '@phosphor-icons/react'
import { useRouterState } from '@tanstack/react-router'
import { useEffect, useState, type ReactNode } from 'react'

import {
  DocsSearchDialog,
  useDocsSearchShortcut,
} from '#/components/starter-docs/docs-search-dialog'
import { MarketingSiteShell } from '#/components/marketing/marketing-site-shell'
import {
  DOC_NAV_GROUPS,
  listStarterDocs,
  type StarterDocEntry,
} from '#/lib/starter-docs/catalog'
import { StarterDocLink } from '#/lib/starter-docs/doc-link'
import { starterDocNavLabel } from '#/lib/starter-docs/nav-label'
import type { PublicMarketing } from '#/lib/cms/public-marketing'
import { phosphorIcon } from '#/lib/icon'
import '#/styles/starter-docs.css'

export function DocsShell({
  marketing,
  children,
  activePath,
}: {
  marketing: PublicMarketing
  children: ReactNode
  activePath: string
}) {
  const [searchOpen, setSearchOpen] = useState(false)
  const [sideOpen, setSideOpen] = useState(false)
  const docs = listStarterDocs()
  const pathname = useRouterState({
    select: (state) => state.location.pathname,
  })

  useDocsSearchShortcut(() => setSearchOpen(true))

  // biome-ignore lint/correctness/useExhaustiveDependencies: close drawer on route change only
  useEffect(() => {
    setSideOpen(false)
  }, [pathname])

  const bySlug = new Map(docs.map((doc) => [doc.fileSlug, doc]))

  return (
    <MarketingSiteShell
      marketing={marketing}
      activeNav="docs"
      onSearchOpen={() => setSearchOpen(true)}
    >
      <div className="starter-surface docs-shell flex flex-1 flex-col">
        <div className="docs-mobile-bar">
          <button
            type="button"
            className="docs-menu-btn"
            aria-label="Open docs menu"
            onClick={() => setSideOpen(true)}
          >
            <List {...phosphorIcon} size={18} />
          </button>
          <span className="text-sm font-medium">Documentation</span>
        </div>
        <div className="starter-main-grow docs-body">
          <aside
            className={`docs-side${sideOpen ? ' open' : ''}`}
            aria-label="Docs"
          >
            {DOC_NAV_GROUPS.map((group) => (
              <div key={group.label} className="docs-group">
                <div className="docs-group-label">{group.label}</div>
                {group.fileSlugs.map((fileSlug) => {
                  const entry = bySlug.get(fileSlug)
                  if (!entry) {
                    return null
                  }
                  const active = entry.path === activePath
                  return (
                    <StarterDocLink
                      key={entry.path}
                      path={entry.path}
                      className={`docs-link${active ? ' active' : ''}`}
                      onClick={() => setSideOpen(false)}
                    >
                      {starterDocNavLabel(entry)}
                    </StarterDocLink>
                  )
                })}
              </div>
            ))}
          </aside>
          {children}
        </div>
        <DocsSearchDialog open={searchOpen} onOpenChange={setSearchOpen} />
      </div>
    </MarketingSiteShell>
  )
}

export function DocsPager({ current }: { current: StarterDocEntry }) {
  const docs = listStarterDocs()
  const index = docs.findIndex((doc) => doc.fileSlug === current.fileSlug)
  const prev = index > 0 ? docs[index - 1] : undefined
  const next =
    index >= 0 && index < docs.length - 1 ? docs[index + 1] : undefined
  if (!prev && !next) {
    return null
  }
  return (
    <nav className="docs-pager" aria-label="Docs pages">
      {prev ? (
        <StarterDocLink path={prev.path}>
          <div className="dir">Previous</div>
          <div className="title">{starterDocNavLabel(prev)}</div>
        </StarterDocLink>
      ) : (
        <span />
      )}
      {next ? (
        <StarterDocLink path={next.path} className="next">
          <div className="dir">Next</div>
          <div className="title">{starterDocNavLabel(next)}</div>
        </StarterDocLink>
      ) : null}
    </nav>
  )
}

export function DocsToc({
  headings,
  activeId,
}: {
  headings: { id: string; text: string; level: 2 | 3 }[]
  activeId?: string
}) {
  if (headings.length === 0) {
    return null
  }
  return (
    <aside className="docs-toc" aria-label="On this page">
      <div className="toc-label">On this page</div>
      <nav>
        {headings.map((heading) => (
          <a
            key={heading.id}
            href={`#${heading.id}`}
            className={activeId === heading.id ? 'active' : undefined}
            style={
              heading.level === 3
                ? { paddingLeft: '18px', fontSize: '12px' }
                : undefined
            }
          >
            {heading.text}
          </a>
        ))}
      </nav>
    </aside>
  )
}
