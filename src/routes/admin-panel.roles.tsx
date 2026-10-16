import { createFileRoute, redirect } from '@tanstack/react-router'

import { AUTH_PAGE_HEADERS } from '#/auth'
import { ADMIN_USERS_TAB_SEARCH } from '#/lib/admin/admin-tab-defaults'

export const Route = createFileRoute('/admin-panel/roles')({
  beforeLoad: () => {
    throw redirect({
      to: '/admin/users',
      search: ADMIN_USERS_TAB_SEARCH,
      headers: {
        ...AUTH_PAGE_HEADERS,
        'Cache-Control': 'private, no-store',
      },
    })
  },
})
