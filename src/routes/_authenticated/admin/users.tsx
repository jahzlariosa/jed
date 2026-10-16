import { createFileRoute, useRouter } from '@tanstack/react-router'

import { UsersScreen, type UsersTabId } from '#/components/admin/users-screen'
import { ADMIN_LIST_ROUTE_CACHE } from '#/auth'
import {
  buildUsersMembersRouteSearch,
  parseUsersDirectoryQuery,
  usersDirectoryLoaderDeps,
} from '#/auth/users-directory-query'
import type { UsersDirectoryPageSize } from '#/auth/users-directory-query'
import { listRolesCatalogAdminFn } from '#/auth/roles-admin'
import { listUsersAdminFn } from '#/auth/users-admin'
import { adminTabSearchSchema } from '#/lib/admin/admin-tab-search'

const usersTabSchema = adminTabSearchSchema(['members', 'roles'] as const)

export const Route = createFileRoute('/_authenticated/admin/users')({
  ...ADMIN_LIST_ROUTE_CACHE,
  validateSearch: (search) => ({
    ...parseUsersDirectoryQuery(search),
    ...usersTabSchema.parse(search),
  }),
  loaderDeps: ({ search }) => usersDirectoryLoaderDeps(search),
  loader: async ({ deps }) => {
    const [directory, rolesCatalog] = await Promise.all([
      listUsersAdminFn({ data: deps }),
      listRolesCatalogAdminFn(),
    ])
    return { ...directory, rolesCatalog }
  },
  component: AdminUsersPage,
})

function AdminUsersPage() {
  const router = useRouter()
  const search = Route.useSearch()
  const directory = Route.useLoaderData()

  function navigateMembers(
    patch: Partial<ReturnType<typeof parseUsersDirectoryQuery>>,
  ) {
    void router.navigate({
      to: '/admin/users',
      search: buildUsersMembersRouteSearch(search, patch),
    })
  }

  return (
    <UsersScreen
      directory={directory}
      activeTab={search.tab as UsersTabId}
      q={search.q ?? ''}
      role={search.role}
      status={search.status}
      mfa={search.mfa}
      createdFrom={search.createdFrom}
      createdTo={search.createdTo}
      page={search.page}
      pageSize={search.pageSize}
      onSearchChange={(q) => navigateMembers({ q, page: 1 })}
      onRoleChange={(role) => navigateMembers({ role, page: 1 })}
      onStatusChange={(status) => navigateMembers({ status, page: 1 })}
      onMfaChange={(mfa) => navigateMembers({ mfa, page: 1 })}
      onCreatedFromChange={(createdFrom) =>
        navigateMembers({ createdFrom, page: 1 })
      }
      onCreatedToChange={(createdTo) => navigateMembers({ createdTo, page: 1 })}
      onPageChange={(page) => navigateMembers({ page })}
      onPageSizeChange={(pageSize: UsersDirectoryPageSize) =>
        navigateMembers({ pageSize, page: 1 })
      }
      onReload={() => {
        void router.invalidate()
      }}
    />
  )
}
