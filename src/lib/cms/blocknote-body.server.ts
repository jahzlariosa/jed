import '@tanstack/react-start/server-only'

import {
  type BlockNoteDocument,
  emptyBlockDocument,
} from '#/lib/cms/blocknote-types'
import { sanitizeRichHtml } from '#/lib/cms/sanitize'

export function persistBodyFromClient(
  blocks: BlockNoteDocument,
  bodyHtml: string,
): { body_blocks: BlockNoteDocument; body_html: string } {
  const body_blocks = blocks.length > 0 ? blocks : emptyBlockDocument()
  const trimmed = bodyHtml.trim()
  const body_html = sanitizeRichHtml(trimmed || '<p></p>')
  return { body_blocks, body_html }
}
