import { createFileRoute, redirect } from '@tanstack/react-router'

import { ADMIN_USERS_TAB_SEARCH } from '#/lib/admin/admin-tab-defaults'

export const Route = createFileRoute('/_authenticated/roles')({
  beforeLoad: () => {
    throw redirect({
      to: '/admin/users',
      search: ADMIN_USERS_TAB_SEARCH,
    })
  },
})
