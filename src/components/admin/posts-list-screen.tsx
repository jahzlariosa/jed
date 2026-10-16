import { Link, useNavigate } from '@tanstack/react-router'
import { FileDashed, PencilSimple, Plus } from '@phosphor-icons/react'

import { ADMIN_EDITOR_TAB_SEARCH } from '#/lib/admin/admin-tab-defaults'
import { phosphorIcon } from '#/lib/icon'
import { useState } from 'react'
import { useServerFn } from '@tanstack/react-start'

import { AdminPageHeader } from '#/components/admin/admin-page-header'
import { AdminTableEmpty } from '#/components/admin/admin-table-states'
import { AdminStatusBadge } from '#/components/admin/admin-status-badge'
import { POST_CATEGORY_LABELS, formatPostDate } from '#/lib/cms/blog'
import type { PostKind } from '#/lib/cms/schemas'
import { bulkAdminPostsFn } from '#/lib/cms/posts-admin-fns'
import { appToast } from '#/lib/app-toast'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'

type PostRow = {
  id: string
  kind: string
  slug: string
  title: string
  status: string
  published_at: string | null
  updated_at: string
  excerpt: string
}

type ListData = {
  items: PostRow[]
  total: number
  page: number
  pageSize: number
  pageCount: number
  counts: {
    all: number
    published: number
    draft: number
    scheduled: number
    trash: number
  }
}

const FILTERS = [
  { key: 'all', label: 'All' },
  { key: 'published', label: 'Published' },
  { key: 'draft', label: 'Drafts' },
  { key: 'scheduled', label: 'Scheduled' },
  { key: 'trash', label: 'Trash' },
] as const

export function PostsListScreen({
  data,
  filter,
  q,
  onFilterChange,
  onSearchChange,
  onPageChange,
  onReload,
}: {
  data: ListData
  filter: string
  q: string
  onFilterChange: (filter: string) => void
  onSearchChange: (q: string) => void
  onPageChange: (page: number) => void
  onReload: () => void
}) {
  const navigate = useNavigate()
  const bulk = useServerFn(bulkAdminPostsFn)
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [pending, setPending] = useState(false)
  const from = data.total === 0 ? 0 : (data.page - 1) * data.pageSize + 1
  const to = Math.min(data.page * data.pageSize, data.total)

  function toggleAll(checked: boolean) {
    setSelected(
      checked ? new Set(data.items.map((item) => item.id)) : new Set(),
    )
  }

  async function runBulk(action: 'publish' | 'draft' | 'trash') {
    if (selected.size === 0) return
    setPending(true)
    try {
      const result = await bulk({ data: { ids: [...selected], action } })
      if (result.error) {
        appToast.error(result.error)
        return
      }
      const label =
        action === 'publish'
          ? 'Posts published.'
          : action === 'draft'
            ? 'Posts moved to drafts.'
            : 'Posts moved to trash.'
      appToast.success(label)
      setSelected(new Set())
      onReload()
    } finally {
      setPending(false)
    }
  }

  return (
    <div className="grid gap-4">
      <AdminPageHeader
        title="Blog posts"
        description="Write, schedule, and publish posts for the public blog."
        actions={
          <Button asChild>
            <Link
              to="/admin/posts/$postId"
              params={{ postId: 'new' }}
              search={ADMIN_EDITOR_TAB_SEARCH}
            >
              <Plus
                {...phosphorIcon}
                className="mr-2 size-4 text-current"
                aria-hidden
              />
              New post
            </Link>
          </Button>
        }
      />

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap gap-2">
          {FILTERS.map((tab) => (
            <Button
              key={tab.key}
              type="button"
              size="sm"
              variant={filter === tab.key ? 'default' : 'outline'}
              onClick={() => onFilterChange(tab.key)}
            >
              {tab.label}
              <span className="ml-1.5 tabular-nums text-xs opacity-80">
                ({data.counts[tab.key]})
              </span>
            </Button>
          ))}
        </div>
        <Input
          type="search"
          placeholder="Search title or excerpt"
          value={q}
          onChange={(event) => onSearchChange(event.target.value)}
          className="max-w-xs"
          aria-label="Search posts"
        />
      </div>

      {selected.size > 0 ? (
        <div className="flex flex-wrap items-center gap-2 rounded-lg border bg-card p-3">
          <span className="text-sm text-muted-foreground">
            {selected.size} selected
          </span>
          <Button
            type="button"
            size="sm"
            variant="secondary"
            loading={pending}
            disabled={pending}
            onClick={() => void runBulk('publish')}
          >
            Publish
          </Button>
          <Button
            type="button"
            size="sm"
            variant="secondary"
            loading={pending}
            disabled={pending}
            onClick={() => void runBulk('draft')}
          >
            Move to draft
          </Button>
          <Button
            type="button"
            size="sm"
            variant="destructive"
            loading={pending}
            disabled={pending}
            onClick={() => void runBulk('trash')}
          >
            Trash
          </Button>
        </div>
      ) : null}

      {data.items.length === 0 ? (
        <AdminTableEmpty
          icon={FileDashed}
          title={emptyPostsTitle(filter)}
          description={emptyPostsDescription(filter)}
          action={
            filter === 'trash' ? undefined : (
              <Button asChild>
                <Link
                  to="/admin/posts/$postId"
                  params={{ postId: 'new' }}
                  search={ADMIN_EDITOR_TAB_SEARCH}
                >
                  <Plus
                    {...phosphorIcon}
                    className="mr-2 size-4 text-current"
                    aria-hidden
                  />
                  New post
                </Link>
              </Button>
            )
          }
        />
      ) : (
        <div className="admin-card overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-10">
                  <Checkbox
                    checked={
                      data.items.length > 0 &&
                      selected.size === data.items.length
                    }
                    onCheckedChange={(checked) => toggleAll(checked === true)}
                    aria-label="Select all posts on this page"
                  />
                </TableHead>
                <TableHead>Title</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Updated</TableHead>
                <TableHead className="w-12" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.items.map((row) => (
                <TableRow key={row.id}>
                  <TableCell>
                    <Checkbox
                      checked={selected.has(row.id)}
                      onCheckedChange={(checked) => {
                        const next = new Set(selected)
                        if (checked) next.add(row.id)
                        else next.delete(row.id)
                        setSelected(next)
                      }}
                      aria-label={`Select ${row.title}`}
                    />
                  </TableCell>
                  <TableCell>
                    <button
                      type="button"
                      className="text-left font-medium hover:text-primary"
                      onClick={() =>
                        navigate({
                          to: '/admin/posts/$postId',
                          params: { postId: row.id },
                          search: ADMIN_EDITOR_TAB_SEARCH,
                        })
                      }
                    >
                      {row.title}
                    </button>
                    <p className="text-xs text-muted-foreground">/{row.slug}</p>
                  </TableCell>
                  <TableCell>
                    {POST_CATEGORY_LABELS[row.kind as PostKind] ?? row.kind}
                  </TableCell>
                  <TableCell>
                    <AdminStatusBadge status={row.status} />
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {formatPostDate(row.published_at ?? row.updated_at)}
                  </TableCell>
                  <TableCell>
                    <Button variant="ghost" size="icon" asChild>
                      <Link
                        to="/admin/posts/$postId"
                        params={{ postId: row.id }}
                        search={ADMIN_EDITOR_TAB_SEARCH}
                        aria-label={`Edit ${row.title}`}
                      >
                        <PencilSimple
                          {...phosphorIcon}
                          className="size-4 text-current"
                        />
                      </Link>
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      <div className="flex items-center justify-between text-sm text-muted-foreground">
        <p>
          {data.total === 0
            ? 'No posts'
            : `Showing ${from} to ${to} of ${data.total}`}
        </p>
        <div className="flex gap-2">
          <Button
            type="button"
            size="sm"
            variant="outline"
            disabled={data.page <= 1}
            onClick={() => onPageChange(data.page - 1)}
          >
            Previous
          </Button>
          <Button
            type="button"
            size="sm"
            variant="outline"
            disabled={data.page >= data.pageCount}
            onClick={() => onPageChange(data.page + 1)}
          >
            Next
          </Button>
        </div>
      </div>
    </div>
  )
}

function emptyPostsTitle(filter: string) {
  if (filter === 'draft') return 'No drafts yet'
  if (filter === 'trash') return 'Trash is empty'
  if (filter === 'published') return 'No published posts'
  if (filter === 'scheduled') return 'No scheduled posts'
  return 'No posts yet'
}

function emptyPostsDescription(filter: string) {
  if (filter === 'draft') {
    return 'Drafts appear here when you save without publishing. Start a post to see this list fill.'
  }
  if (filter === 'trash') {
    return 'Posts you move to trash stay here until you delete them permanently.'
  }
  return 'Write your first post to fill this list. You can schedule publishing from the editor.'
}
