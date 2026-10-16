import { MagnifyingGlass } from '@phosphor-icons/react'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'

import { searchStarterDocs } from '#/lib/starter-docs/catalog'
import { cn } from '@/lib/utils'

export function DocsSearchDialog({
  open,
  onOpenChange,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const [query, setQuery] = useState('')
  const [active, setActive] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)

  const hits = useMemo(() => searchStarterDocs(query), [query])

  const close = useCallback(() => {
    onOpenChange(false)
    setQuery('')
    setActive(0)
  }, [onOpenChange])

  useEffect(() => {
    if (!open) {
      return
    }
    inputRef.current?.focus()
  }, [open])

  useEffect(() => {
    if (!open) {
      return
    }
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault()
        close()
        return
      }
      if (event.key === 'ArrowDown') {
        event.preventDefault()
        setActive((value) => Math.min(value + 1, Math.max(0, hits.length - 1)))
      }
      if (event.key === 'ArrowUp') {
        event.preventDefault()
        setActive((value) => Math.max(value - 1, 0))
      }
      if (event.key === 'Enter' && hits[active]) {
        event.preventDefault()
        window.location.assign(hits[active].path)
        close()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, hits, active, close])

  if (!open) {
    return null
  }

  return (
    // biome-ignore lint/a11y/noStaticElementInteractions: scrim dismisses on backdrop click
    <div
      className="search-scrim"
      role="presentation"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) {
          close()
        }
      }}
    >
      <div
        className="search-dialog"
        role="dialog"
        aria-modal="true"
        aria-label="Search documentation"
      >
        <div className="search-input-row">
          <MagnifyingGlass size={18} weight="regular" aria-hidden />
          <input
            ref={inputRef}
            type="search"
            value={query}
            onChange={(event) => {
              setQuery(event.target.value)
              setActive(0)
            }}
            placeholder="Search docs"
            aria-label="Search docs"
          />
          <kbd>Esc</kbd>
        </div>
        <div className="search-results">
          {hits.length === 0 && query.trim() ? (
            <p className="px-3 py-2 text-sm text-[var(--muted-foreground)]">
              No results.
            </p>
          ) : null}
          {hits.map((hit, index) => (
            <button
              key={hit.path}
              type="button"
              className={cn('search-hit', index === active && 'active')}
              onMouseEnter={() => setActive(index)}
              onClick={() => {
                window.location.assign(hit.path)
                close()
              }}
            >
              <span className="path">{hit.path}</span>
              <span className="title">{hit.title}</span>
              <span className="snip">{hit.snippet}</span>
            </button>
          ))}
        </div>
        <div className="search-foot">
          <span>↑↓ to move</span>
          <span>↵ to open</span>
          <span>Esc to close</span>
        </div>
      </div>
    </div>
  )
}

export function useDocsSearchShortcut(onOpen: () => void) {
  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      const isK = event.key.toLowerCase() === 'k'
      if (!isK) {
        return
      }
      if (!(event.metaKey || event.ctrlKey)) {
        return
      }
      event.preventDefault()
      onOpen()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onOpen])
}
