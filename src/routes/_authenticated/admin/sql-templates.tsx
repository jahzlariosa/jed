import { createFileRoute } from '@tanstack/react-router'

import {
  AdminListError,
  AdminListPending,
} from '#/components/admin/admin-list-route'
import { SqlTemplatesScreen } from '#/components/admin/sql-templates-screen'
import { ADMIN_LIST_ROUTE_CACHE } from '#/auth'
import { listSqlTemplatesFn } from '#/lib/cms/sql-templates-fns'

export const Route = createFileRoute('/_authenticated/admin/sql-templates')({
  ...ADMIN_LIST_ROUTE_CACHE,
  pendingComponent: AdminListPending,
  errorComponent: AdminListError,
  loader: () => listSqlTemplatesFn(),
  component: AdminSqlTemplatesPage,
})

function AdminSqlTemplatesPage() {
  const data = Route.useLoaderData()
  return <SqlTemplatesScreen templates={data.templates} />
}
