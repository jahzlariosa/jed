import '@tanstack/react-start/server-only'

import {
  assertSentHtmlInlineScriptsMatchCsp,
  assertTsrStreamPartScriptsHaveSsrNonce,
  collectPublicHtmlInlineScriptSrcHashes,
  stripScriptNonceAttributes,
} from '#/lib/public-inline-script-hashes.server'
import {
  type AnalyticsCspConfig,
  buildPublicHtmlContentSecurityPolicy,
} from '#/lib/security-headers.server'

export function stripCspNonceMeta(html: string): string {
  return html.replace(/<meta\s+[^>]*property=["']csp-nonce["'][^>]*>\s*/gi, '')
}

export async function applyPublicHtmlContentSecurityPolicy(
  response: Response,
  env: Record<string, string | undefined>,
  analytics: AnalyticsCspConfig,
  isProduction: boolean,
  ssrNonce: string,
): Promise<Response> {
  const contentType = response.headers.get('content-type') ?? ''
  if (!contentType.includes('text/html')) {
    return response
  }
  const htmlBeforeNonceStrip = await response.text()
  assertTsrStreamPartScriptsHaveSsrNonce(htmlBeforeNonceStrip, ssrNonce)
  maybeCapturePreStripPublicHtmlForTests(htmlBeforeNonceStrip, ssrNonce)
  let html = stripScriptNonceAttributes(htmlBeforeNonceStrip, ssrNonce)
  html = stripCspNonceMeta(html)
  const inlineScriptHashes = collectPublicHtmlInlineScriptSrcHashes(
    htmlBeforeNonceStrip,
    html,
    ssrNonce,
  )
  const csp = buildPublicHtmlContentSecurityPolicy(
    env,
    analytics,
    inlineScriptHashes,
  )
  assertSentHtmlInlineScriptsMatchCsp(html, csp)
  const body = new TextEncoder().encode(html)
  const headers = new Headers(response.headers)
  headers.set(
    isProduction
      ? 'Content-Security-Policy'
      : 'Content-Security-Policy-Report-Only',
    csp,
  )
  headers.set('Content-Length', String(body.byteLength))
  headers.delete('Transfer-Encoding')
  return new Response(body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  })
}

export type PreStripPublicHtmlCapture = { html: string; ssrNonce: string }

declare global {
  var __amnPreStripPublicHtmlHook:
    | ((capture: PreStripPublicHtmlCapture) => void)
    | undefined
}

function maybeCapturePreStripPublicHtmlForTests(
  html: string,
  ssrNonce: string,
): void {
  globalThis.__amnPreStripPublicHtmlHook?.({ html, ssrNonce })
}
