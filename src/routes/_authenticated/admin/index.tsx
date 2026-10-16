import { createFileRoute } from '@tanstack/react-router'

import { AdminDashboard } from '#/components/admin/admin-dashboard'
import { getAdminDashboardFn } from '#/lib/cms/functions'

export const Route = createFileRoute('/_authenticated/admin/')({
  loader: () => getAdminDashboardFn(),
  component: AdminHomePage,
})

function AdminHomePage() {
  const data = Route.useLoaderData()
  return <AdminDashboard data={data} />
}
