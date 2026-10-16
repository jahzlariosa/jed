import '@tanstack/react-start/server-only'

import {
  type BlockNoteDocument,
  emptyBlockDocument,
  parseBlockDocument,
} from '#/lib/cms/blocknote-types'
import { isAllowedCmsImageSrc, sanitizeRichHtml } from '#/lib/cms/sanitize'

type InlineNode = {
  type?: string
  text?: string
  styles?: Record<string, boolean | string>
  href?: string
  content?: InlineNode[]
}

type BlockNode = {
  type?: string
  props?: Record<string, unknown>
  content?: InlineNode[]
  children?: BlockNode[]
}

function escapeText(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

function renderInline(nodes: InlineNode[] | undefined): string {
  if (!nodes?.length) return ''
  return nodes
    .map((node) => {
      if (node.type === 'text') {
        let text = escapeText(node.text ?? '')
        const styles = node.styles ?? {}
        if (styles.bold) text = `<strong>${text}</strong>`
        if (styles.italic) text = `<em>${text}</em>`
        if (styles.code) text = `<code>${text}</code>`
        return text
      }
      if (node.type === 'link') {
        const href = typeof node.href === 'string' ? node.href : '#'
        return `<a href="${escapeText(href)}" rel="noopener noreferrer">${renderInline(node.content)}</a>`
      }
      return ''
    })
    .join('')
}

function renderBlock(block: BlockNode): string {
  const type = block.type ?? 'paragraph'
  const inner = renderInline(block.content)
  switch (type) {
    case 'heading': {
      const level = Number(block.props?.level ?? 2)
      const tag = level === 1 ? 'h1' : level === 3 ? 'h3' : 'h2'
      return `<${tag}>${inner}</${tag}>`
    }
    case 'bulletListItem':
      return `<ul><li>${inner}</li></ul>`
    case 'numberedListItem':
      return `<ol><li>${inner}</li></ol>`
    case 'paragraph':
      return `<p>${inner || '<br>'}</p>`
    case 'image': {
      const url = typeof block.props?.url === 'string' ? block.props.url : ''
      if (!url || !isAllowedCmsImageSrc(url)) {
        return ''
      }
      const altSource =
        typeof block.props?.name === 'string'
          ? block.props.name
          : typeof block.props?.alt === 'string'
            ? block.props.alt
            : ''
      const caption =
        typeof block.props?.caption === 'string'
          ? block.props.caption.trim()
          : ''
      const img = `<img src="${escapeText(url)}" alt="${escapeText(altSource)}">`
      if (caption) {
        return `<figure>${img}<figcaption>${escapeText(caption)}</figcaption></figure>`
      }
      return img
    }
    default:
      return inner ? `<p>${inner}</p>` : ''
  }
}

function renderBlocks(blocks: BlockNode[]): string {
  return blocks.map((block) => renderBlock(block)).join('')
}

export function blocksToHtmlServer(raw: unknown): string {
  const document = parseBlockDocument(raw) as BlockNode[]
  const blocks =
    document.length > 0 ? document : (emptyBlockDocument() as BlockNode[])
  return sanitizeRichHtml(renderBlocks(blocks) || '<p></p>')
}

export function blocksDocumentToHtml(blocks: BlockNoteDocument): string {
  return blocksToHtmlServer(blocks)
}
