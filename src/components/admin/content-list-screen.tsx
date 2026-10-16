import { Link, useNavigate } from '@tanstack/react-router'
import {
  DotsThree,
  Eye,
  FileDashed,
  PencilSimple,
  Plus,
} from '@phosphor-icons/react'

import { ADMIN_EDITOR_TAB_SEARCH } from '#/lib/admin/admin-tab-defaults'
import { phosphorIcon } from '#/lib/icon'
import { useState } from 'react'

import { AdminPageHeader } from '#/components/admin/admin-page-header'
import { AdminTableEmpty } from '#/components/admin/admin-table-states'
import { AdminStatusBadge } from '#/components/admin/admin-status-badge'
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
import { publicCmsPagePath } from '#/lib/cms/pages'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { cn } from '@/lib/utils'

type ContentRow = {
  id: string
  title: string
  slug: string
  kind: string
  status: string
  updated_at: string
}

type ListData = {
  items: ContentRow[]
  total: number
  page: number
  pageSize: number
  counts: {
    all: number
    pages: number
    posts: number
    drafts: number
    scheduled: number
  }
}

const FILTERS = [
  { key: 'all', label: 'All' },
  { key: 'pages', label: 'Pages' },
  { key: 'posts', label: 'Posts' },
  { key: 'draft', label: 'Drafts' },
  { key: 'scheduled', label: 'Scheduled' },
] as const

export function ContentListScreen({
  data,
  filter,
  q,
  onFilterChange,
  onSearchChange,
  onPageChange,
}: {
  data: ListData
  filter: string
  q: string
  onFilterChange: (filter: string) => void
  onSearchChange: (q: string) => void
  onPageChange: (page: number) => void
}) {
  const navigate = useNavigate()
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const from = (data.page - 1) * data.pageSize + 1
  const to = Math.min(data.page * data.pageSize, data.total)

  function toggleAll(checked: boolean) {
    setSelected(
      checked ? new Set(data.items.map((item) => item.id)) : new Set(),
    )
  }

  return (
    <div className="grid gap-4">
      <AdminPageHeader
        title="Content"
        description="Pages and posts for your public site."
        actions={
          <>
            <Button variant="outline" size="sm" asChild>
              <Link
                to="/admin/posts/$postId"
                params={{ postId: 'new' }}
                search={ADMIN_EDITOR_TAB_SEARCH}
              >
                New post
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

      <ul className="flex flex-wrap gap-2 text-sm">
        {FILTERS.map((tab) => {
          const count =
            tab.key === 'all'
              ? data.counts.all
              : tab.key === 'pages'
                ? data.counts.pages
                : tab.key === 'posts'
                  ? data.counts.posts
                  : tab.key === 'draft'
                    ? data.counts.drafts
                    : data.counts.scheduled
          const active = filter === tab.key
          return (
            <li key={tab.key}>
              <button
                type="button"
                className={cn(
                  'admin-chip',
                  active
                    ? 'active'
                    : 'text-muted-foreground hover:bg-muted hover:text-foreground',
                )}
                onClick={() => onFilterChange(tab.key)}
              >
                {tab.label} {count}
              </button>
            </li>
          )
        })}
      </ul>

      <div className="flex flex-wrap gap-2">
        <Input
          value={q}
          onChange={(event) => onSearchChange(event.target.value)}
          placeholder="Filter content…"
          className="max-w-xs"
          aria-label="Filter content"
        />
      </div>

      {data.items.length === 0 ? (
        <AdminTableEmpty
          icon={FileDashed}
          title="No content in this view"
          description="Try another filter or create a new page or post to get started."
          action={
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
                    onCheckedChange={(value) => toggleAll(value === true)}
                    aria-label="Select all rows"
                  />
                </TableHead>
                <TableHead>Title</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Updated</TableHead>
                <TableHead className="w-20 text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.items.map((item) => (
                <TableRow key={item.id}>
                  <TableCell>
                    <Checkbox
                      checked={selected.has(item.id)}
                      onCheckedChange={(value) => {
                        const next = new Set(selected)
                        if (value === true) {
                          next.add(item.id)
                        } else {
                          next.delete(item.id)
                        }
                        setSelected(next)
                      }}
                      aria-label={`Select ${item.title}`}
                    />
                  </TableCell>
                  <TableCell>
                    <button
                      type="button"
                      className="text-left"
                      onClick={() =>
                        void navigate({
                          to: '/admin/content/$contentId',
                          params: { contentId: item.id },
                          search: ADMIN_EDITOR_TAB_SEARCH,
                        })
                      }
                    >
                      <span className="block font-semibold">{item.title}</span>
                      <span className="text-xs text-muted-foreground">
                        slug: {item.slug}
                      </span>
                    </button>
                  </TableCell>
                  <TableCell className="capitalize">{item.kind}</TableCell>
                  <TableCell>
                    <AdminStatusBadge status={item.status} />
                  </TableCell>
                  <TableCell>{formatDate(item.updated_at)}</TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="icon" asChild>
                      <Link
                        to="/admin/content/$contentId"
                        params={{ contentId: item.id }}
                        search={ADMIN_EDITOR_TAB_SEARCH}
                        aria-label={`Edit ${item.title}`}
                      >
                        <PencilSimple
                          {...phosphorIcon}
                          className="size-4 text-current"
                        />
                      </Link>
                    </Button>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          aria-label={`More actions for ${item.title}`}
                        >
                          <DotsThree
                            {...phosphorIcon}
                            className="size-4 text-current"
                          />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-48">
                        <DropdownMenuItem asChild>
                          <Link
                            to="/admin/content/$contentId"
                            params={{ contentId: item.id }}
                            search={ADMIN_EDITOR_TAB_SEARCH}
                          >
                            <PencilSimple
                              {...phosphorIcon}
                              className="mr-2 size-4 text-current"
                              aria-hidden
                            />
                            Edit
                          </Link>
                        </DropdownMenuItem>
                        {item.kind === 'page' ? (
                          <DropdownMenuItem asChild>
                            <Link
                              to="/$slug"
                              params={{ slug: item.slug }}
                              search={{ draftPreview: true }}
                              target="_blank"
                              rel="noopener noreferrer"
                            >
                              <Eye
                                {...phosphorIcon}
                                className="mr-2 size-4 text-current"
                                aria-hidden
                              />
                              Preview draft
                            </Link>
                          </DropdownMenuItem>
                        ) : null}
                        {item.kind === 'page' && item.status === 'published' ? (
                          <>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem asChild>
                              <a
                                href={publicCmsPagePath(item.slug)}
                                target="_blank"
                                rel="noopener noreferrer"
                              >
                                View live page
                              </a>
                            </DropdownMenuItem>
                          </>
                        ) : null}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
        <p className="text-muted-foreground">
          Showing {data.total === 0 ? 0 : from}-{to} of {data.total} items
        </p>
        <div className="flex gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={data.page <= 1}
            onClick={() => onPageChange(data.page - 1)}
          >
            Previous
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={to >= data.total}
            onClick={() => onPageChange(data.page + 1)}
          >
            Next
          </Button>
        </div>
      </div>
    </div>
  )
}

function formatDate(value: string) {
  return new Date(value).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}
