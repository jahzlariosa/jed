import { createFileRoute } from '@tanstack/react-router'

import { handleMcpHttpRequest } from '#/lib/api/mcp.server'
import { applyMcpCacheHeaders } from '#/lib/http-cache.server'

export const Route = createFileRoute('/api/mcp')({
  server: {
    handlers: {
      GET: ({ request }) => handleMcpHttpRequest(request),
      POST: ({ request }) => handleMcpHttpRequest(request),
      DELETE: ({ request }) => handleMcpHttpRequest(request),
      OPTIONS: () => applyMcpCacheHeaders(new Response(null, { status: 204 })),
    },
  },
})
