import { createFileRoute } from '@tanstack/react-router'

import { listBlogPostsFn } from '#/lib/cms/blog-fns'
import { getSiteUrl } from '#/lib/site.server'
import { PUBLIC_XML_CACHE_HEADERS } from '#/lib/seo'
import { loadPublicSeoSettings } from '#/lib/seo/public-settings.server'

function escapeXml(value: string) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

export const Route = createFileRoute('/blog/rss.xml')({
  server: {
    handlers: {
      GET: async () => {
        const origin = getSiteUrl() ?? 'http://localhost:3000'
        const seo = await loadPublicSeoSettings()
        const list = await listBlogPostsFn({ data: { page: 1 } })
        const posts = [
          ...(list.featured ? [list.featured] : []),
          ...list.items,
        ].slice(0, 20)

        const items = posts
          .map((post) => {
            const link = `${origin}/blog/${post.slug}`
            const pubDate = post.publishedAt
              ? new Date(post.publishedAt).toUTCString()
              : new Date().toUTCString()
            return `<item>
  <title>${escapeXml(post.title)}</title>
  <link>${escapeXml(link)}</link>
  <guid>${escapeXml(link)}</guid>
  <pubDate>${pubDate}</pubDate>
  <description>${escapeXml(post.excerpt)}</description>
</item>`
          })
          .join('\n')

        const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
<channel>
  <title>${escapeXml(`${seo.siteName} blog`)}</title>
  <link>${escapeXml(`${origin}/blog`)}</link>
  <description>${escapeXml(seo.defaultDescription || `${seo.siteName} blog`)}</description>
${items}
</channel>
</rss>`

        return new Response(xml, {
          headers: {
            'Content-Type': 'application/rss+xml; charset=utf-8',
            ...PUBLIC_XML_CACHE_HEADERS,
          },
        })
      },
    },
  },
})
