import { existsSync } from 'node:fs'
import path from 'node:path'
import { pathToFileURL } from 'node:url'
import { describe, expect, it } from 'vitest'

import {
  applyPublicHtmlContentSecurityPolicy,
  type PreStripPublicHtmlCapture,
} from '#/lib/apply-public-html-csp.server'
import {
  assertSentHtmlInlineScriptsMatchCsp,
  assertTsrStreamPartScriptsHaveSsrNonce,
  findInlineScriptTags,
  sha256SourceHash,
} from '#/lib/public-inline-script-hashes.server'

const SSR_NONCE = 'integration-test-nonce'

describe('public route HTML CSP integration', () => {
  it('covers TanStack stream bootstrap markup like production', async () => {
    const streamBootstrap =
      'self.$_TSR={};/* seroval cross-ref + router bootstrap */'
    const html = [
      '<!doctype html><html><head></head><body>',
      `<script data-tsr-stream-part="" nonce="${SSR_NONCE}">${streamBootstrap}</script>`,
      `<script nonce="${SSR_NONCE}">document.currentScript.remove()</script>`,
      `<script type="application/ld+json" nonce="${SSR_NONCE}">{"@context":"https://schema.org"}</script>`,
      '</body></html>',
    ].join('')
    const response = await applyPublicHtmlContentSecurityPolicy(
      new Response(html, {
        headers: { 'content-type': 'text/html; charset=utf-8' },
      }),
      { NODE_ENV: 'production' },
      {
        ga4: null,
        gtm: null,
        plausible: null,
        vercelAnalytics: false,
      },
      true,
      SSR_NONCE,
    )
    const outHtml = await response.text()
    const csp = response.headers.get('content-security-policy')
    if (!csp) {
      throw new Error('Expected Content-Security-Policy header')
    }
    expect(csp).toContain(sha256SourceHash(streamBootstrap))
    assertSentHtmlInlineScriptsMatchCsp(outHtml, csp)
    expect(outHtml).not.toContain('nonce=')
  })
})

const handlerPath = path.resolve(
  process.cwd(),
  '.vercel/output/functions/__server.func/index.mjs',
)

const builtHandlerExists = existsSync(handlerPath)
if (process.env.CI === 'true' && !builtHandlerExists) {
  throw new Error(
    `CI must produce ${handlerPath} (run npm run build before npm test)`,
  )
}

function streamPartNoncesFromCapture(
  capture: PreStripPublicHtmlCapture,
): string[] {
  const nonces: string[] = []
  for (const { openTag } of findInlineScriptTags(capture.html)) {
    if (!/data-tsr-stream-part/i.test(openTag)) {
      continue
    }
    const match = openTag.match(/\snonce=["']([^"']+)["']/i)
    if (!match) {
      throw new Error('Expected SSR nonce on data-tsr-stream-part script')
    }
    nonces.push(match[1])
  }
  return nonces
}

async function fetchBuiltHomeStreamNonces(handler: {
  fetch: (request: Request) => Promise<Response>
}): Promise<string[]> {
  const preStripCaptures: PreStripPublicHtmlCapture[] = []
  globalThis.__amnPreStripPublicHtmlHook = (capture) => {
    preStripCaptures.push(capture)
  }
  const response = await handler.fetch(
    new Request('https://example.com/', {
      headers: { Accept: 'text/html' },
    }),
  )
  expect(response.status).toBe(200)
  const html = await response.text()
  const csp = response.headers.get('content-security-policy')
  if (!csp) {
    throw new Error('Expected Content-Security-Policy header')
  }
  expect(csp).not.toContain('nonce-')
  assertSentHtmlInlineScriptsMatchCsp(html, csp)
  expect(html).toContain('data-tsr-stream-part')
  expect(html).not.toMatch(/data-tsr-stream-part[^>]*\snonce=/i)

  const capture = preStripCaptures.at(-1)
  if (!capture) {
    throw new Error(
      'Expected pre-strip HTML capture from applyPublicHtmlContentSecurityPolicy',
    )
  }
  assertTsrStreamPartScriptsHaveSsrNonce(capture.html, capture.ssrNonce)
  const streamNonces = streamPartNoncesFromCapture(capture)
  expect(streamNonces.length).toBeGreaterThan(0)
  for (const nonce of streamNonces) {
    expect(nonce).toBe(capture.ssrNonce)
  }
  globalThis.__amnPreStripPublicHtmlHook = undefined
  return streamNonces
}

describe('built public routes HTML CSP', { timeout: 120_000 }, () => {
  it.skipIf(!builtHandlerExists)(
    'allows every inline script on the public home page',
    async () => {
      process.env.NODE_ENV = 'production'
      process.env.APP_URL = 'https://example.com'
      process.env.VITE_SUPABASE_URL =
        process.env.VITE_SUPABASE_URL ?? 'http://127.0.0.1:54321'
      process.env.VITE_SUPABASE_PUBLISHABLE_KEY =
        process.env.VITE_SUPABASE_PUBLISHABLE_KEY ?? 'test-publishable-key'
      process.env.SUPABASE_SERVICE_ROLE_KEY =
        process.env.SUPABASE_SERVICE_ROLE_KEY ?? 'test-service-role-key'

      const handlerUrl = pathToFileURL(handlerPath).href
      const { default: handler } = await import(handlerUrl)

      const firstRun = await fetchBuiltHomeStreamNonces(handler)
      const secondRun = await fetchBuiltHomeStreamNonces(handler)
      expect(firstRun.join(',')).not.toBe(secondRun.join(','))
    },
    120_000,
  )
})
