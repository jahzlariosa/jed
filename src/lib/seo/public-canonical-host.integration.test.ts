import { existsSync } from 'node:fs'
import path from 'node:path'
import { pathToFileURL } from 'node:url'
import { describe, expect, it } from 'vitest'

const handlerPath = path.resolve(
  process.cwd(),
  '.vercel/output/functions/__server.func/index.mjs',
)

const builtHandlerExists = existsSync(handlerPath)

function canonicalHostFromHtml(html: string): string | undefined {
  const match = html.match(
    /<link[^>]+rel=["']canonical["'][^>]+href=["']([^"']+)["']/i,
  )
  if (!match) {
    return undefined
  }
  return new URL(match[1]).host
}

function firstSitemapLocHost(xml: string): string | undefined {
  const match = xml.match(/<loc>([^<]+)<\/loc>/i)
  if (!match) {
    return undefined
  }
  return new URL(match[1]).host
}

describe('public canonical host alignment', { timeout: 120_000 }, () => {
  it.skipIf(!builtHandlerExists)(
    'matches APP_URL on HTML canonical and sitemap loc',
    async () => {
      const configuredOrigin = 'https://jed-starter.vercel.app'
      process.env.NODE_ENV = 'production'
      process.env.APP_URL = configuredOrigin
      process.env.VITE_SUPABASE_URL =
        process.env.VITE_SUPABASE_URL ?? 'http://127.0.0.1:54321'
      process.env.VITE_SUPABASE_PUBLISHABLE_KEY =
        process.env.VITE_SUPABASE_PUBLISHABLE_KEY ?? 'test-publishable-key'
      process.env.SUPABASE_SERVICE_ROLE_KEY =
        process.env.SUPABASE_SERVICE_ROLE_KEY ?? 'test-service-role-key'

      const handlerUrl = pathToFileURL(handlerPath).href
      const { default: handler } = await import(handlerUrl)
      const expectedHost = new URL(configuredOrigin).host

      const home = await handler.fetch(
        new Request(`${configuredOrigin}/`, {
          headers: { Accept: 'text/html' },
        }),
      )
      expect(home.status).toBe(200)
      const homeHtml = await home.text()
      expect(canonicalHostFromHtml(homeHtml)).toBe(expectedHost)

      const sitemap = await handler.fetch(
        new Request(`${configuredOrigin}/sitemap.xml`, {
          headers: { Accept: 'application/xml' },
        }),
      )
      expect(sitemap.status).toBe(200)
      const xml = await sitemap.text()
      expect(firstSitemapLocHost(xml)).toBe(expectedHost)
    },
    120_000,
  )
})
