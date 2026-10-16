import { createFileRoute } from '@tanstack/react-router'

import { handleOpenApiRequest } from '#/lib/api/http.server'

export const Route = createFileRoute('/api/v1/openapi.json')({
  server: {
    handlers: {
      GET: ({ request }) => handleOpenApiRequest(request),
    },
  },
})
