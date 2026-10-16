import { createFileRoute, redirect } from '@tanstack/react-router'

import { AUTH_PAGE_HEADERS } from '#/auth'

export const Route = createFileRoute('/admin/login')({
  beforeLoad: () => {
    throw redirect({
      to: '/login',
      search: { redirect: '/admin' },
      headers: {
        ...AUTH_PAGE_HEADERS,
        'Cache-Control': 'private, no-store',
      },
    })
  },
  component: () => null,
})
