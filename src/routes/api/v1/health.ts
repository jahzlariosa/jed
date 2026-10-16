import { createFileRoute } from '@tanstack/react-router'

import { handleHealthRequest } from '#/lib/api/http.server'

export const Route = createFileRoute('/api/v1/health')({
  server: {
    handlers: {
      GET: ({ request }) => handleHealthRequest(request),
    },
  },
})
