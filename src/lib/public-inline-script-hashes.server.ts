import '@tanstack/react-start/server-only'
import { createHash } from 'node:crypto'

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

export function sha256SourceHash(scriptSource: string): string {
  const digest = createHash('sha256')
    .update(scriptSource, 'utf8')
    .digest('base64')
  return `'sha256-${digest}'`
}

/** Match browser script text extraction for CSP hash checks (see HTML script data). */
export function scriptSourceForCspHash(rawScriptBody: string): string {
  return rawScriptBody.replaceAll('\0', '\uFFFD')
}

export function stripScriptNonceAttributes(
  html: string,
  ssrNonce: string,
): string {
  const pattern = new RegExp(`\\snonce=["']${escapeRegExp(ssrNonce)}["']`, 'gi')
  return html.replace(pattern, '')
}

export type InlineScriptTag = {
  openTag: string
  body: string
}

/** Walk inline `<script>` tags (no `src`) in final HTML byte order. */
export function findInlineScriptTags(html: string): InlineScriptTag[] {
  const tags: InlineScriptTag[] = []
  const lower = html.toLowerCase()
  let index = 0
  while (index < html.length) {
    const start = lower.indexOf('<script', index)
    if (start === -1) {
      break
    }
    const openEnd = html.indexOf('>', start)
    if (openEnd === -1) {
      break
    }
    const openTag = html.slice(start, openEnd + 1)
    if (/\ssrc\s*=/.test(openTag)) {
      index = openEnd + 1
      continue
    }
    const close = lower.indexOf('</script>', openEnd + 1)
    if (close === -1) {
      break
    }
    tags.push({
      openTag,
      body: html.slice(openEnd + 1, close),
    })
    index = close + '</script>'.length
  }
  return tags
}

export function hasMatchingSsrNonce(
  openTag: string,
  ssrNonce: string,
): boolean {
  const noncePattern = new RegExp(
    `\\snonce=["']${escapeRegExp(ssrNonce)}["']`,
    'i',
  )
  return noncePattern.test(openTag)
}

const TSR_STREAM_PART_ATTR = /data-tsr-stream-part/i

/** Fail closed: TanStack stream transport tags must carry the request SSR nonce. */
export function assertTsrStreamPartScriptsHaveSsrNonce(
  html: string,
  ssrNonce: string,
): void {
  for (const { openTag } of findInlineScriptTags(html)) {
    if (!TSR_STREAM_PART_ATTR.test(openTag)) {
      continue
    }
    if (!hasMatchingSsrNonce(openTag, ssrNonce)) {
      throw new Error(
        'TanStack data-tsr-stream-part inline script is missing the SSR nonce',
      )
    }
  }
}

/** Inline scripts trusted during SSR (matching `router.tsx` `ssr.nonce` only). */
export function isTrustedInlineScriptOpenTag(
  openTag: string,
  ssrNonce: string,
): boolean {
  if (/\ssrc\s*=/.test(openTag)) {
    return false
  }
  return hasMatchingSsrNonce(openTag, ssrNonce)
}

function hashScriptBody(body: string): string | null {
  if (body.length === 0) {
    return null
  }
  return sha256SourceHash(scriptSourceForCspHash(body))
}

/** Trusted inline scripts in HTML before nonce attributes are stripped. */
export function collectInlineScriptHashesFromHtml(
  html: string,
  ssrNonce: string,
): string[] {
  const hashes: string[] = []
  for (const { openTag, body } of findInlineScriptTags(html)) {
    if (!isTrustedInlineScriptOpenTag(openTag, ssrNonce)) {
      continue
    }
    const hash = hashScriptBody(body)
    if (hash) {
      hashes.push(hash)
    }
  }
  return [...new Set(hashes)]
}

/**
 * CSP `script-src` hashes for bytes sent to the browser: one hash per shipped
 * inline script, keyed to the pre-strip open tag when nonces are removed.
 */
export function collectPublicHtmlInlineScriptSrcHashes(
  htmlBeforeNonceStrip: string,
  htmlSent: string,
  ssrNonce: string,
): string[] {
  const preStripOpenTagByBody = new Map<string, string>()
  for (const { openTag, body } of findInlineScriptTags(htmlBeforeNonceStrip)) {
    preStripOpenTagByBody.set(body, openTag)
  }

  const hashes: string[] = []
  for (const { openTag, body } of findInlineScriptTags(htmlSent)) {
    const trustOpenTag = preStripOpenTagByBody.get(body) ?? openTag
    if (!isTrustedInlineScriptOpenTag(trustOpenTag, ssrNonce)) {
      throw new Error('Untrusted inline script in public HTML response')
    }
    const hash = hashScriptBody(body)
    if (hash) {
      hashes.push(hash)
    }
  }
  return [...new Set(hashes)]
}

/** Every inline script in the bytes sent to the browser (after nonce strip). */
export function collectInlineScriptHashesFromSentHtml(html: string): string[] {
  const hashes: string[] = []
  for (const { body } of findInlineScriptTags(html)) {
    const hash = hashScriptBody(body)
    if (hash) {
      hashes.push(hash)
    }
  }
  return [...new Set(hashes)]
}

export function parseScriptSrcSha256Hashes(csp: string): Set<string> {
  const found = new Set<string>()
  const match = csp.match(/script-src\s+([^;]+)/i)
  if (!match) {
    return found
  }
  for (const token of match[1].split(/\s+/)) {
    if (token.startsWith("'sha256-")) {
      found.add(token)
    }
  }
  return found
}

export function assertSentHtmlInlineScriptsMatchCsp(
  html: string,
  csp: string,
): void {
  const required = collectInlineScriptHashesFromSentHtml(html)
  const allowed = parseScriptSrcSha256Hashes(csp)
  const missing = required.filter((hash) => !allowed.has(hash))
  if (missing.length > 0) {
    throw new Error(
      `CSP script-src is missing ${missing.length} inline script hash(es)`,
    )
  }
  const orphan = [...allowed].filter((hash) => !required.includes(hash))
  if (orphan.length > 0) {
    throw new Error(
      `CSP script-src lists ${orphan.length} inline script hash(es) not present in HTML`,
    )
  }
}
