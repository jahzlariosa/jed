import { createFileRoute, useRouter } from '@tanstack/react-router'

import {
  AdminListError,
  AdminListPending,
} from '#/components/admin/admin-list-route'
import { PostsListScreen } from '#/components/admin/posts-list-screen'
import { ADMIN_LIST_ROUTE_CACHE } from '#/auth'
import { adminPostsListQuerySchema } from '#/lib/cms/schemas'
import { listAdminPostsFn } from '#/lib/cms/posts-admin-fns'

const searchSchema = adminPostsListQuerySchema.pick({
  status: true,
  q: true,
  page: true,
})

export const Route = createFileRoute('/_authenticated/admin/posts/')({
  ...ADMIN_LIST_ROUTE_CACHE,
  pendingComponent: AdminListPending,
  errorComponent: AdminListError,
  validateSearch: (search) => searchSchema.parse(search),
  loaderDeps: ({ search }) => search,
  loader: ({ deps }) => listAdminPostsFn({ data: deps }),
  component: PostsListPage,
})

function PostsListPage() {
  const router = useRouter()
  const search = Route.useSearch()
  const data = Route.useLoaderData()

  return (
    <PostsListScreen
      data={data}
      filter={search.status}
      q={search.q ?? ''}
      onFilterChange={(status) =>
        router.navigate({
          to: '/admin/posts',
          search: {
            ...search,
            status: status as typeof search.status,
            page: 1,
          },
        })
      }
      onSearchChange={(q) =>
        router.navigate({
          to: '/admin/posts',
          search: { ...search, q, page: 1 },
        })
      }
      onPageChange={(page) =>
        router.navigate({ to: '/admin/posts', search: { ...search, page } })
      }
      onReload={() => router.invalidate()}
    />
  )
}
