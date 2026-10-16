import { createFileRoute } from '@tanstack/react-router'

import { PUBLIC_XML_CACHE_HEADERS } from '#/lib/seo'
import { isPreviewDeployment } from '#/lib/seo/request-policy.server'
import { loadPublicSeoSettings } from '#/lib/seo/public-settings.server'
import { getSiteUrl } from '#/lib/site.server'

export const Route = createFileRoute('/robots.txt')({
  server: {
    handlers: {
      GET: async () => {
        const origin = getSiteUrl() ?? 'http://localhost:3000'
        const settings = await loadPublicSeoSettings()
        const preview = isPreviewDeployment()
        const lines = [
          'User-agent: *',
          preview || !settings.allowSearchIndexing ? 'Disallow: /' : 'Allow: /',
          'Disallow: /admin',
          'Disallow: /admin-panel',
          'Disallow: /account',
          'Disallow: /update-password',
          'Disallow: /reset-password',
          'Disallow: /roles',
          'Disallow: /auth/',
        ]
        if (settings.robotsExtraRules.trim()) {
          lines.push(settings.robotsExtraRules.trim())
        }
        if (!preview && settings.allowSearchIndexing) {
          lines.push(`Sitemap: ${origin}/sitemap.xml`)
        }
        const body = `${lines.join('\n')}\n`
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
