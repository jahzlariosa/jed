import {
  createFileRoute,
  getRouteApi,
  Outlet,
  redirect,
} from '@tanstack/react-router'

import {
  ADMIN_ROUTE_CACHE,
  PRIVATE_ROUTE_HEADERS,
  type AccessDto,
} from '#/auth'
import type { AppUser } from '#/auth/user'
import { AdminShell } from '#/components/admin/admin-shell'
import { AdminRoutePending } from '#/components/admin/admin-pending'
import { canUseAdmin } from '#/lib/cms/access'
import { getAdminShellSettingsFn } from '#/lib/cms/functions'
import { noindexHead, type RootMatch } from '#/lib/seo'

export const Route = createFileRoute('/_authenticated/admin')({
  ...ADMIN_ROUTE_CACHE,
  pendingComponent: AdminRoutePending,
  headers: () => PRIVATE_ROUTE_HEADERS,
  head: ({ matches }: { matches: ReadonlyArray<RootMatch> }) =>
    noindexHead('Admin', matches),
  loader: () => getAdminShellSettingsFn(),
  beforeLoad: ({ context }): void => {
    const access = (context as { access?: AccessDto }).access
    if (!access || !canUseAdmin(access.permissions)) {
      throw redirect({ to: '/' })
    }
  },
  component: AdminLayout,
})

const authenticatedRoute = getRouteApi('/_authenticated')

function AdminLayout() {
  const shell = authenticatedRoute.useRouteContext() as {
    user: AppUser
    access: AccessDto
  }
  const { user, access } = shell
  const branding = Route.useLoaderData()
  return (
    <AdminShell
      email={user.email}
      roles={access.roles}
      permissions={access.permissions}
      branding={branding}
    >
      <Outlet />
    </AdminShell>
  )
}
