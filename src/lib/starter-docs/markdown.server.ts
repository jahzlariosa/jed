import '@tanstack/react-start/server-only'

import { marked } from 'marked'
import sanitizeHtml from 'sanitize-html'

import type {
  DocHeading,
  RenderedStarterDoc,
} from '#/lib/starter-docs/markdown-types'
import { highlightDocCodeBlock } from '#/lib/starter-docs/shiki.server'
import { slugifyHeading } from '#/lib/starter-docs/slug'

type FencedBlock = {
  rawLang: string
  filename?: string
  code: string
}

type CalloutBlock = {
  kind: 'note' | 'warning' | 'tip'
  body: string
}

function escapeHtml(text: string) {
  return text
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
}

function extractCallouts(source: string) {
  const callouts: CalloutBlock[] = []
  const body = source.replace(
    /^:::(note|warning|tip)\s*\n([\s\S]*?)\n:::\s*$/gm,
    (_, kind: string, inner: string) => {
      const id = callouts.length
      callouts.push({
        kind: kind as CalloutBlock['kind'],
        body: inner.trim(),
      })
      return `\n\n<div data-doc-callout="${id}"></div>\n\n`
    },
  )
  return { body, callouts }
}

function extractFencedCode(source: string) {
  const blocks: FencedBlock[] = []
  const body = source.replace(
    /^```([^\n`]*)\n([\s\S]*?)^```\s*$/gm,
    (_, header: string, code: string) => {
      const trimmedHeader = header.trim()
      let rawLang = ''
      let filename: string | undefined
      if (trimmedHeader.length > 0) {
        const parts = trimmedHeader.split(/\s+/)
        rawLang = parts[0] ?? ''
        filename = parts.slice(1).join(' ') || undefined
      }
      const id = blocks.length
      blocks.push({
        rawLang,
        filename,
        code: code.replace(/\n$/, ''),
      })
      return `\n\n<div data-doc-code="${id}"></div>\n\n`
    },
  )
  return { body, blocks }
}

function headingAnchorHtml(depth: number, id: string, innerHtml: string) {
  const label = innerHtml.replace(/<[^>]+>/g, '')
  return `<h${depth} id="${id}" class="docs-h${depth}"><span class="docs-heading-text">${innerHtml}</span><a class="docs-heading-anchor" href="#${id}" aria-label="Link to ${escapeHtml(label)}"><span aria-hidden="true">#</span></a></h${depth}>`
}

function sanitizeArticleHtml(html: string) {
  return sanitizeHtml(html, {
    allowedTags: sanitizeHtml.defaults.allowedTags.concat([
      'aside',
      'button',
      'figure',
      'figcaption',
      'span',
      'pre',
      'code',
      'table',
      'thead',
      'tbody',
      'tr',
      'th',
      'td',
      'div',
      'img',
      'hr',
    ]),
    allowedAttributes: {
      ...sanitizeHtml.defaults.allowedAttributes,
      '*': ['class', 'id', 'role', 'tabindex'],
      a: ['href', 'name', 'target', 'rel', 'class', 'aria-label'],
      img: ['src', 'alt', 'loading', 'width', 'height', 'class'],
      span: ['class', 'style', 'aria-hidden', 'aria-live', 'aria-atomic'],
      code: ['class'],
      pre: ['class', 'style', 'tabindex'],
      button: ['type', 'class', 'data-copy-b64', 'aria-label'],
      div: ['class', 'data-doc-code', 'data-doc-callout', 'data-language'],
      h2: ['id', 'class'],
      h3: ['id', 'class'],
      h4: ['id', 'class'],
      aside: ['class'],
    },
    allowedSchemes: ['http', 'https', 'mailto'],
  })
}

async function renderCalloutHtml(callout: CalloutBlock) {
  const inner = await renderStarterDocMarkdown(callout.body)
  const titles: Record<CalloutBlock['kind'], string> = {
    note: 'Note',
    warning: 'Warning',
    tip: 'Tip',
  }
  return `<aside class="docs-callout docs-callout-${callout.kind}" role="note">
<p class="docs-callout-title">${titles[callout.kind]}</p>
<div class="docs-callout-content">${inner.html}</div>
</aside>`
}

export async function renderStarterDocMarkdown(
  source: string,
): Promise<RenderedStarterDoc> {
  const headings: DocHeading[] = []
  const { body: afterCallouts, callouts } = extractCallouts(source)
  const { body, blocks } = extractFencedCode(afterCallouts)

  const renderer = new marked.Renderer()

  renderer.heading = ({ text, depth }) => {
    const plain = text.replace(/<[^>]+>/g, '')
    const id = slugifyHeading(plain)
    if (depth === 2 || depth === 3) {
      headings.push({ id, text: plain, level: depth as 2 | 3 })
    }
    if (depth >= 2 && depth <= 4) {
      return headingAnchorHtml(depth, id, text)
    }
    return `<h${depth} id="${id}">${text}</h${depth}>`
  }

  renderer.code = ({ text }) => {
    return `<code class="docs-inline-code">${escapeHtml(text)}</code>`
  }

  renderer.codespan = ({ text }) => {
    return `<code class="docs-inline-code">${escapeHtml(text)}</code>`
  }

  renderer.link = ({ href, title, text }) => {
    const titleAttr = title ? ` title="${escapeHtml(title)}"` : ''
    return `<a class="docs-text-link" href="${escapeHtml(href)}"${titleAttr}>${text}</a>`
  }

  renderer.image = ({ href, title, text }) => {
    const cap = title
      ? `<figcaption class="docs-figcaption">${escapeHtml(title)}</figcaption>`
      : ''
    return `<figure class="docs-figure"><img src="${escapeHtml(href)}" alt="${escapeHtml(text)}" loading="lazy" class="docs-image" />${cap}</figure>`
  }

  renderer.table = (token) => {
    const header = token.header
      .map(
        (cell) => `<th>${marked.parseInline(cell.text, { async: false })}</th>`,
      )
      .join('')
    const rows = token.rows
      .map(
        (row) =>
          `<tr>${row
            .map(
              (cell) =>
                `<td>${marked.parseInline(cell.text, { async: false })}</td>`,
            )
            .join('')}</tr>`,
      )
      .join('')
    return `<div class="docs-table-scroll"><table class="docs-table"><thead><tr>${header}</tr></thead><tbody>${rows}</tbody></table></div>`
  }

  let html = marked.parse(body, {
    renderer,
    async: false,
    gfm: true,
  }) as string

  html = html
    .replaceAll('<ol>', '<ol class="docs-ol docs-steps">')
    .replaceAll('<ul>', '<ul class="docs-ul">')
    .replaceAll('<blockquote>', '<blockquote class="docs-blockquote">')
    .replaceAll('<hr>', '<hr class="docs-hr" />')
    .replaceAll('<hr/>', '<hr class="docs-hr" />')

  for (let i = 0; i < blocks.length; i++) {
    const block = blocks[i]
    const highlighted = await highlightDocCodeBlock(
      block.code,
      block.rawLang,
      block.filename,
    )
    html = html.replace(`<div data-doc-code="${i}"></div>`, highlighted)
  }

  for (let i = 0; i < callouts.length; i++) {
    const calloutHtml = await renderCalloutHtml(callouts[i])
    html = html.replace(`<div data-doc-callout="${i}"></div>`, calloutHtml)
  }

  return {
    html: sanitizeArticleHtml(html),
    headings,
  }
}
