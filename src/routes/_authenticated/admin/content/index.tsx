import { createFileRoute, useNavigate } from '@tanstack/react-router'

import {
  AdminListError,
  AdminListPending,
} from '#/components/admin/admin-list-route'
import { ContentListScreen } from '#/components/admin/content-list-screen'
import { ADMIN_LIST_ROUTE_CACHE } from '#/auth'
import { listContentFn } from '#/lib/cms/functions'

type ContentSearch = {
  filter?: string
  q?: string
  page?: number
}

export const Route = createFileRoute('/_authenticated/admin/content/')({
  ...ADMIN_LIST_ROUTE_CACHE,
  pendingComponent: AdminListPending,
  errorComponent: AdminListError,
  validateSearch: (search: Record<string, unknown>): ContentSearch => ({
    filter: typeof search.filter === 'string' ? search.filter : undefined,
    q: typeof search.q === 'string' ? search.q : undefined,
    page:
      typeof search.page === 'number'
        ? search.page
        : Number.parseInt(String(search.page ?? '1'), 10) || undefined,
  }),
  loaderDeps: ({ search }) => ({
    filter: search.filter ?? 'all',
    q: search.q ?? '',
    page: search.page ?? 1,
  }),
  loader: ({ deps }) =>
    listContentFn({
      data: {
        page: deps.page,
        pageSize: 25,
        q: deps.q,
        filter: deps.filter,
        status: deps.filter,
      },
    }),
  component: ContentListPage,
})

function ContentListPage() {
  const data = Route.useLoaderData()
  const search = Route.useSearch()
  const navigate = useNavigate()
  const filter = search.filter ?? 'all'
  const q = search.q ?? ''

  return (
    <ContentListScreen
      data={data}
      filter={filter}
      q={q}
      onFilterChange={(next) =>
        void navigate({
          to: '/admin/content',
          search: { filter: next, q, page: 1 },
        })
      }
      onSearchChange={(next) =>
        void navigate({
          to: '/admin/content',
          search: { filter, q: next, page: 1 },
        })
      }
      onPageChange={(next) =>
        void navigate({
          to: '/admin/content',
          search: { filter, q, page: next },
        })
      }
    />
  )
}
