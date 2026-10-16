import { createHighlighter, type Highlighter } from 'shiki'
const THEME = 'github-light'

const LANG_ALIASES: Record<string, string> = {
  env: 'ini',
  ts: 'typescript',
  curl: 'bash',
  sh: 'bash',
  plaintext: 'text',
}

const LANG_LABELS: Record<string, string> = {
  ini: 'ENV',
  text: 'TEXT',
  typescript: 'TS',
  bash: 'BASH',
  tsx: 'TSX',
  json: 'JSON',
  sql: 'SQL',
  http: 'HTTP',
}

let highlighterPromise: Promise<Highlighter> | null = null

async function getHighlighter() {
  highlighterPromise ??= createHighlighter({
    themes: [THEME],
    langs: ['bash', 'typescript', 'tsx', 'json', 'sql', 'http', 'ini', 'text'],
  })
  return highlighterPromise
}

function resolveLang(raw: string) {
  const key = raw.trim().toLowerCase() || 'text'
  return LANG_ALIASES[key] ?? key
}

function labelForLang(lang: string, filename?: string) {
  if (filename?.trim()) {
    return filename.trim()
  }
  const key = lang.toLowerCase()
  return LANG_LABELS[key] ?? key.toUpperCase()
}

export async function highlightDocCodeBlock(
  code: string,
  rawLang: string,
  filename?: string,
) {
  const lang = resolveLang(rawLang)
  const highlighter = await getHighlighter()
  const loaded = highlighter.getLoadedLanguages()
  const useLang = loaded.includes(lang) ? lang : 'text'
  const lineCount = code.split('\n').length

  const highlighted = highlighter.codeToHtml(code, {
    lang: useLang,
    theme: THEME,
  })

  const label = labelForLang(useLang, filename)
  const copyB64 = Buffer.from(code, 'utf8').toString('base64')
  const lineClass = lineCount > 1 ? ' docs-code-has-lines' : ''

  return `<div class="docs-code-block${lineClass}" data-language="${escapeAttr(useLang)}">
<div class="docs-code-head">
<span class="docs-code-label">${escapeHtml(label)}</span>
<button type="button" class="docs-code-copy" data-copy-b64="${copyB64}" aria-label="Copy code">
<span class="docs-code-copy-label">Copy</span>
</button>
<span class="docs-copy-live sr-only" aria-live="polite" aria-atomic="true"></span>
</div>
<div class="docs-code-scroll">${highlighted}</div>
</div>`
}

function escapeHtml(text: string) {
  return text
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
}

function escapeAttr(text: string) {
  return escapeHtml(text).replaceAll("'", '&#39;')
}
