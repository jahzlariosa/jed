import type { Icon } from '@phosphor-icons/react'
import { useCallback, useRef } from 'react'

import { phosphorIcon } from '#/lib/icon'
import { cn } from '@/lib/utils'

export type AdminUrlTabItem = {
  id: string
  label: string
  icon?: Icon
}

function moveTabFocus(
  tabs: readonly AdminUrlTabItem[],
  currentId: string,
  direction: -1 | 1,
) {
  const index = tabs.findIndex((tab) => tab.id === currentId)
  if (index < 0) {
    return tabs[0]?.id
  }
  const next = (index + direction + tabs.length) % tabs.length
  return tabs[next]?.id ?? currentId
}

export function AdminUrlTabs({
  tabs,
  activeTab,
  onTabChange,
  ariaLabel,
  className,
}: {
  tabs: readonly AdminUrlTabItem[]
  activeTab: string
  onTabChange: (tabId: string) => void
  ariaLabel: string
  className?: string
}) {
  const tabRefs = useRef<Record<string, HTMLButtonElement | null>>({})

  const focusTab = useCallback((tabId: string) => {
    tabRefs.current[tabId]?.focus()
  }, [])

  return (
    <div className={cn('admin-url-tabs', className)}>
      <div role="tablist" aria-label={ariaLabel} className="admin-tab-list">
        {tabs.map((tab) => {
          const selected = tab.id === activeTab
          const IconGlyph = tab.icon
          return (
            <button
              key={tab.id}
              ref={(node) => {
                tabRefs.current[tab.id] = node
              }}
              type="button"
              role="tab"
              id={`admin-tab-${tab.id}`}
              aria-selected={selected}
              aria-controls={`admin-tabpanel-${tab.id}`}
              tabIndex={selected ? 0 : -1}
              className={cn('admin-tab', selected && 'admin-tab-active')}
              onClick={() => onTabChange(tab.id)}
              onKeyDown={(event) => {
                if (
                  event.key === 'ArrowRight' ||
                  event.key === 'ArrowLeft' ||
                  event.key === 'Home' ||
                  event.key === 'End'
                ) {
                  event.preventDefault()
                  let nextId = activeTab
                  if (event.key === 'ArrowRight') {
                    nextId = moveTabFocus(tabs, activeTab, 1)
                  } else if (event.key === 'ArrowLeft') {
                    nextId = moveTabFocus(tabs, activeTab, -1)
                  } else if (event.key === 'Home') {
                    nextId = tabs[0]?.id ?? activeTab
                  } else if (event.key === 'End') {
                    nextId = tabs[tabs.length - 1]?.id ?? activeTab
                  }
                  onTabChange(nextId)
                  focusTab(nextId)
                }
              }}
            >
              {IconGlyph ? (
                <IconGlyph
                  {...phosphorIcon}
                  className="size-4 shrink-0"
                  aria-hidden
                />
              ) : null}
              {tab.label}
            </button>
          )
        })}
      </div>
    </div>
  )
}

export function AdminTabPanel({
  id,
  activeTab,
  children,
  className,
}: {
  id: string
  activeTab: string
  children: React.ReactNode
  className?: string
}) {
  const hidden = activeTab !== id
  return (
    <div
      role="tabpanel"
      id={`admin-tabpanel-${id}`}
      aria-labelledby={`admin-tab-${id}`}
      hidden={hidden}
      className={cn('admin-tab-panel', className)}
    >
      {children}
    </div>
  )
}
