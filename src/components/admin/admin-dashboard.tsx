import { Link } from '@tanstack/react-router'
import { FileText, Image, Plus, Upload, UserPlus } from '@phosphor-icons/react'

import { AdminPageHeader } from '#/components/admin/admin-page-header'
import { AdminStatusBadge } from '#/components/admin/admin-status-badge'
import {
  ADMIN_EDITOR_TAB_SEARCH,
  ADMIN_USERS_TAB_SEARCH,
} from '#/lib/admin/admin-tab-defaults'
import { phosphorIcon } from '#/lib/icon'
import { Button } from '@/components/ui/button'

type DashboardData = {
  recentContent: Array<{
    id: string
    title: string
    status: string
    updated_at: string
    path: string
    kindLabel: string
    editor: 'content' | 'post'
  }>
  draftAttention: Array<{
    id: string
    title: string
    updated_at: string
    editor: 'content' | 'post'
  }>
  recentActivity: Array<{
    id: string
    summary: string
    created_at: string
    action: string
  }>
  systemStatus: Array<{
    id: string
    label: string
    status: string
    level: 'ok' | 'warn'
  }>
}

export function AdminDashboard({ data }: { data: DashboardData }) {
  const { recentContent, draftAttention, recentActivity, systemStatus } = data

  return (
    <div className="admin-dash">
      <AdminPageHeader
        title="Dashboard"
        description="Recent content, drafts, and system health for this site."
        actions={
          <>
            <Button variant="outline" size="sm" className="gap-1.5" asChild>
              <Link to="/admin/media">
                <Upload
                  {...phosphorIcon}
                  className="size-4 text-current"
                  aria-hidden
                />
                Upload media
              </Link>
            </Button>
            <Button size="sm" className="gap-1.5" asChild>
              <Link
                to="/admin/content/$contentId"
                params={{ contentId: 'new' }}
                search={ADMIN_EDITOR_TAB_SEARCH}
              >
                <Plus
                  {...phosphorIcon}
                  className="size-4 text-current"
                  aria-hidden
                />
                New page
              </Link>
            </Button>
          </>
        }
      />

      <div className="admin-dash-grid">
        <div className="admin-dash-stack">
          <section className="admin-dash-card">
            <div className="admin-dash-card-head">
              <h2>Recent content</h2>
              <Link to="/admin/content" className="admin-dash-card-link">
                View all
              </Link>
            </div>
            <ul className="admin-dash-rows">
              {recentContent.length === 0 ? (
                <li className="admin-dash-row-empty">
                  No content yet. Create a page or post to see it here.
                </li>
              ) : (
                recentContent.map((item) => (
                  <li
                    key={`${item.editor}-${item.id}`}
                    className="admin-dash-row"
                  >
                    <div className="min-w-0 flex-1">
                      <EditorLink item={item} />
                      <p className="admin-dash-row-meta">
                        {item.path} · {item.kindLabel}
                      </p>
                    </div>
                    <AdminStatusBadge status={item.status} />
                    <span className="admin-dash-row-date">
                      {formatShortDate(item.updated_at)}
                    </span>
                  </li>
                ))
              )}
            </ul>
          </section>

          <section className="admin-dash-card">
            <div className="admin-dash-card-head">
              <h2>Drafts needing attention</h2>
            </div>
            <ul className="admin-dash-rows">
              {draftAttention.length === 0 ? (
                <li className="admin-dash-row-empty">
                  No drafts waiting. Published work shows in Recent content.
                </li>
              ) : (
                draftAttention.map((item) => (
                  <li
                    key={`${item.editor}-${item.id}`}
                    className="admin-dash-row"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-medium text-foreground">
                        {item.title}
                      </p>
                      <p className="admin-dash-row-meta">
                        Updated {formatShortDate(item.updated_at)}
                      </p>
                    </div>
                    <Button variant="ghost" size="sm" asChild>
                      <EditorLink item={item} label="Edit" />
                    </Button>
                  </li>
                ))
              )}
            </ul>
          </section>
        </div>

        <div className="admin-dash-stack">
          <section className="admin-dash-card">
            <div className="admin-dash-card-head">
              <h2>Quick actions</h2>
            </div>
            <div className="admin-quick-actions">
              <Link
                to="/admin/posts/$postId"
                params={{ postId: 'new' }}
                search={ADMIN_EDITOR_TAB_SEARCH}
                className="admin-quick-action"
              >
                <Plus {...phosphorIcon} className="size-[18px] text-primary" />
                New post
              </Link>
              <Link
                to="/admin/content/$contentId"
                params={{ contentId: 'new' }}
                search={ADMIN_EDITOR_TAB_SEARCH}
                className="admin-quick-action"
              >
                <FileText
                  {...phosphorIcon}
                  className="size-[18px] text-primary"
                />
                New page
              </Link>
              <Link to="/admin/media" className="admin-quick-action">
                <Image {...phosphorIcon} className="size-[18px] text-primary" />
                Upload media
              </Link>
              <Link
                to="/admin/users"
                search={ADMIN_USERS_TAB_SEARCH}
                className="admin-quick-action"
              >
                <UserPlus
                  {...phosphorIcon}
                  className="size-[18px] text-primary"
                />
                Invite user
              </Link>
            </div>
          </section>

          <section className="admin-dash-card">
            <div className="admin-dash-card-head">
              <h2>Recent activity</h2>
            </div>
            <ul className="admin-dash-rows">
              {recentActivity.length === 0 ? (
                <li className="admin-dash-row-empty">No activity yet.</li>
              ) : (
                recentActivity.map((row) => (
                  <li key={row.id} className="admin-dash-row">
                    <p className="min-w-0 flex-1 text-sm">{row.summary}</p>
                    <span className="admin-dash-row-date">
                      {formatRelative(row.created_at)}
                    </span>
                  </li>
                ))
              )}
            </ul>
          </section>

          <section className="admin-dash-card">
            <div className="admin-dash-card-head">
              <h2>System status</h2>
            </div>
            <ul className="admin-status-list">
              {systemStatus.map((row) => (
                <li key={row.id} className="admin-status-row">
                  <span className="admin-status-label">
                    <span
                      className={
                        row.level === 'ok'
                          ? 'admin-status-dot-ok'
                          : 'admin-status-dot-warn'
                      }
                      aria-hidden
                    />
                    {row.label}
                  </span>
                  <span className="admin-status-value">{row.status}</span>
                </li>
              ))}
            </ul>
          </section>
        </div>
      </div>
    </div>
  )
}

function EditorLink({
  item,
  label,
}: {
  item: {
    id: string
    title: string
    editor: 'content' | 'post'
  }
  label?: string
}) {
  if (item.editor === 'post') {
    return (
      <Link
        to="/admin/posts/$postId"
        params={{ postId: item.id }}
        search={ADMIN_EDITOR_TAB_SEARCH}
        className="block truncate font-medium hover:text-primary"
      >
        {label ?? item.title}
      </Link>
    )
  }
  return (
    <Link
      to="/admin/content/$contentId"
      params={{ contentId: item.id }}
      search={ADMIN_EDITOR_TAB_SEARCH}
      className="block truncate font-medium hover:text-primary"
    >
      {label ?? item.title}
    </Link>
  )
}

function formatShortDate(value: string) {
  return new Date(value).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
  })
}

function formatRelative(value: string) {
  const diff = Date.now() - new Date(value).getTime()
  const hours = Math.floor(diff / 3_600_000)
  if (hours < 24) {
    return hours <= 1 ? 'Just now' : `${hours} hours ago`
  }
  const days = Math.floor(hours / 24)
  return days === 1 ? 'Yesterday' : `${days} days ago`
}
