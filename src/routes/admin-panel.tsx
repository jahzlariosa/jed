import { createFileRoute, redirect } from '@tanstack/react-router'

import { AUTH_PAGE_HEADERS } from '#/auth'

export const Route = createFileRoute('/admin-panel')({
  beforeLoad: ({ location }) => {
    throw redirect({
      to: '/admin',
      search: location.search,
      headers: {
        ...AUTH_PAGE_HEADERS,
        'Cache-Control': 'private, no-store',
      },
    })
  },
})
