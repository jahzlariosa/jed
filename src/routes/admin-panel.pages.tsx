import { createFileRoute, redirect } from '@tanstack/react-router'

import { AUTH_PAGE_HEADERS } from '#/auth'

export const Route = createFileRoute('/admin-panel/pages')({
  beforeLoad: () => {
    throw redirect({
      to: '/admin/content',
      search: { filter: 'all', q: '', page: 1 },
      headers: {
        ...AUTH_PAGE_HEADERS,
        'Cache-Control': 'private, no-store',
      },
    })
  },
})
