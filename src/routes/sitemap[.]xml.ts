import { createFileRoute } from '@tanstack/react-router'

import { PUBLIC_XML_CACHE_HEADERS } from '#/lib/seo'
import { buildSitemapXml } from '#/lib/seo/sitemap.server'
import { getSiteUrl } from '#/lib/site.server'

export const Route = createFileRoute('/sitemap.xml')({
  server: {
    handlers: {
      GET: async () => {
        const origin = getSiteUrl() ?? 'http://localhost:3000'
        const xml = await buildSitemapXml(origin)
        return new Response(xml, {
          headers: {
            'Content-Type': 'application/xml; charset=utf-8',
            ...PUBLIC_XML_CACHE_HEADERS,
          },
        })
      },
    },
  },
})
