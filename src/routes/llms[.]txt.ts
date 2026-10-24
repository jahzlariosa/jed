import { createFileRoute } from '@tanstack/react-router'

import { PUBLIC_XML_CACHE_HEADERS } from '#/lib/seo'
import { getSiteUrl } from '#/lib/site.server'

function buildLlmsTxt(origin: string): string {
  const lines = [
    '# JED',
    '',
    'TanStack Start Supabase starter for client sites.',
    '',
    `- ${origin}/`,
    `- ${origin}/docs`,
    `- ${origin}/features`,
    `- ${origin}/blog`,
    `- ${origin}/contact`,
    '',
    `Source: https://github.com/jahzlariosa/jed`,
  ]
  return `${lines.join('\n')}\n`
}

export const Route = createFileRoute('/llms.txt')({
  server: {
    handlers: {
      GET: async () => {
        const origin = getSiteUrl() ?? 'http://localhost:3000'
        const body = buildLlmsTxt(origin)
        return new Response(body, {
          headers: {
            'Content-Type': 'text/plain; charset=utf-8',
            ...PUBLIC_XML_CACHE_HEADERS,
          },
        })
      },
    },
  },
})
