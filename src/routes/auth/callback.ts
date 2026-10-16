import { createFileRoute } from '@tanstack/react-router'

import { handleAuthCallbackGet } from '#/auth/handle-auth-callback.server'

export const Route = createFileRoute('/auth/callback')({
  server: {
    handlers: {
      GET: ({ request }) => handleAuthCallbackGet(request),
    },
  },
})
