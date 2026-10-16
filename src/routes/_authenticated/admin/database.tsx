import { createFileRoute } from '@tanstack/react-router'

import {
  AdminListError,
  AdminListPending,
} from '#/components/admin/admin-list-route'
import {
  DatabaseScreen,
  type DatabaseTabId,
} from '#/components/admin/database-screen'
import { ADMIN_LIST_ROUTE_CACHE } from '#/auth'
import { adminTabSearchSchema } from '#/lib/admin/admin-tab-search'
import { getAdminDatabaseFn } from '#/lib/admin/database/database-fns'

const databaseSearchSchema = adminTabSearchSchema([
  'overview',
  'tables',
  'diagram',
  'activity',
] as const)

export const Route = createFileRoute('/_authenticated/admin/database')({
  ...ADMIN_LIST_ROUTE_CACHE,
  pendingComponent: AdminListPending,
  errorComponent: AdminListError,
  validateSearch: (search) => databaseSearchSchema.parse(search),
  loader: () => getAdminDatabaseFn(),
  component: AdminDatabasePage,
})

function AdminDatabasePage() {
  const snapshot = Route.useLoaderData()
  const { tab } = Route.useSearch()
  return <DatabaseScreen snapshot={snapshot} activeTab={tab as DatabaseTabId} />
}
