import { createFileRoute } from '@tanstack/react-router'

import {
  handleApiV1MethodNotAllowed,
  handleApiV1Request,
} from '#/lib/api/http.server'

export const Route = createFileRoute('/api/v1/$')({
  server: {
    handlers: {
      GET: ({ request }) => handleApiV1Request(request),
      POST: ({ request }) => handleApiV1Request(request),
      PATCH: ({ request }) => handleApiV1Request(request),
      PUT: ({ request }) => handleApiV1Request(request),
      DELETE: ({ request }) => handleApiV1Request(request),
      HEAD: ({ request }) => handleApiV1MethodNotAllowed(request),
      OPTIONS: ({ request }) => handleApiV1MethodNotAllowed(request),
    },
  },
})
