import type { ReactNode } from 'react'
import { Link } from '@tanstack/react-router'
import { ArrowLeft, Sidebar } from '@phosphor-icons/react'

import { AdminAutosaveStatus } from '#/components/admin/admin-autosave-status'
import {
  AdminTabPanel,
  AdminUrlTabs,
  type AdminUrlTabItem,
} from '#/components/admin/admin-url-tabs'
import { useWritingDeskSplit } from '#/lib/admin/use-writing-desk-split.client'
import { phosphorIcon } from '#/lib/icon'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'

export function AdminWritingDesk({
  backTo,
  backLabel,
  title,
  autosave,
  topActions,
  canvas,
  tabs,
  activeTab,
  onTabChange,
  tabPanels,
  sidebarHeader,
  saveBar,
}: {
  backTo: { to: string; search?: Record<string, unknown> }
  backLabel: string
  title: string
  autosave: { dirty: boolean; saving: boolean; savedAt?: number | null }
  topActions: ReactNode
  canvas: ReactNode
  tabs: readonly AdminUrlTabItem[]
  activeTab: string
  onTabChange: (tab: string) => void
  tabPanels: ReactNode
  sidebarHeader?: ReactNode
  saveBar: ReactNode
}) {
  const {
    rootRef,
    stacked,
    sidebarHidden,
    toggleSidebar,
    separatorProps,
    sidebarStyle,
  } = useWritingDeskSplit()

  const showSidebar = stacked || !sidebarHidden
  const showSeparator = !stacked && !sidebarHidden

  return (
    <div
      ref={rootRef}
      className={cn(
        'admin-writing-desk',
        stacked && 'admin-writing-desk--stacked',
        !stacked && sidebarHidden && 'admin-writing-desk--sidebar-hidden',
      )}
    >
      <div className="admin-writing-desk-main">
        <div className="admin-writing-desk-top">
          <Link
            to={backTo.to}
            search={backTo.search}
            className="admin-writing-desk-back"
          >
            <ArrowLeft {...phosphorIcon} className="size-4" aria-hidden />
            {backLabel}
          </Link>
          <span className="truncate text-sm font-medium text-muted-foreground">
            {title}
          </span>
          <AdminAutosaveStatus {...autosave} />
          <div className="admin-writing-desk-actions">
            {!stacked ? (
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                onClick={toggleSidebar}
                aria-pressed={!sidebarHidden}
                aria-label={
                  sidebarHidden ? 'Show editor sidebar' : 'Hide editor sidebar'
                }
              >
                <Sidebar {...phosphorIcon} aria-hidden />
              </Button>
            ) : null}
            {topActions}
          </div>
        </div>
        <div className="admin-writing-desk-canvas-wrap">
          <div className="admin-writing-desk-canvas">{canvas}</div>
          <div className="admin-writing-desk-save">{saveBar}</div>
        </div>
      </div>
      {showSeparator ? (
        <div className="admin-writing-desk-separator" {...separatorProps} />
      ) : null}
      {showSidebar ? (
        <aside
          className="admin-writing-desk-side"
          style={sidebarStyle}
          aria-label="Editor settings"
        >
          {sidebarHeader ? (
            <div className="admin-writing-desk-side-header">
              {sidebarHeader}
            </div>
          ) : null}
          <AdminUrlTabs
            tabs={tabs}
            activeTab={activeTab}
            onTabChange={onTabChange}
            ariaLabel="Editor sections"
            className="admin-writing-desk-tabs"
          />
          <div className="admin-writing-desk-side-body">{tabPanels}</div>
        </aside>
      ) : null}
    </div>
  )
}

export function AdminWritingDeskPanels({
  activeTab,
  panels,
}: {
  activeTab: string
  panels: Array<{ id: string; children: ReactNode }>
}) {
  return (
    <>
      {panels.map((panel) => (
        <AdminTabPanel key={panel.id} id={panel.id} activeTab={activeTab}>
          {panel.children}
        </AdminTabPanel>
      ))}
    </>
  )
}
