import { createFileRoute } from '@tanstack/react-router'
import { getRouteApi } from '@tanstack/react-router'

import {
  AdminListError,
  AdminListPending,
} from '#/components/admin/admin-list-route'
import {
  ApiAccessScreen,
  type ApiAccessTabId,
} from '#/components/admin/api-access-screen'
import { ADMIN_LIST_ROUTE_CACHE } from '#/auth'
import { adminTabSearchSchema } from '#/lib/admin/admin-tab-search'
import type { AccessDto } from '#/auth'
import { getSiteUrlFn } from '#/lib/site'

const apiSearchSchema = adminTabSearchSchema([
  'tokens',
  'usage',
  'clients',
] as const)

export const Route = createFileRoute('/_authenticated/admin/api')({
  ...ADMIN_LIST_ROUTE_CACHE,
  pendingComponent: AdminListPending,
  errorComponent: AdminListError,
  validateSearch: (search) => apiSearchSchema.parse(search),
  loader: async () => {
    const { siteUrl } = await getSiteUrlFn()
    return siteUrl ?? 'http://localhost:3000'
  },
  component: AdminApiPage,
})

const authenticatedRoute = getRouteApi('/_authenticated')

function AdminApiPage() {
  const appUrl = Route.useLoaderData()
  const { tab } = Route.useSearch()
  const { access } = authenticatedRoute.useRouteContext() as {
    access: AccessDto
  }
  return (
    <ApiAccessScreen
      permissions={access.permissions}
      appUrl={appUrl}
      activeTab={tab as ApiAccessTabId}
    />
  )
}
