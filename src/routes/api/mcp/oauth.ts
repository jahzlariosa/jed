import { createFileRoute } from '@tanstack/react-router'

import { applyMcpCacheHeaders } from '#/lib/http-cache.server'

const JSON_HEADERS = {
  'Content-Type': 'application/json; charset=utf-8',
}

export const Route = createFileRoute('/api/mcp/oauth')({
  server: {
    handlers: {
      GET: () =>
        applyMcpCacheHeaders(
          new Response(
            JSON.stringify({
              status: 'not_available',
              message:
                'OAuth for MCP clients is not enabled on this site. Use a personal access token in the Authorization header.',
              tokenDocsPath: '/admin/api',
              authorizationHeader:
                'Authorization: Bearer <personal_access_token>',
            }),
            { status: 501, headers: JSON_HEADERS },
          ),
        ),
    },
  },
})
